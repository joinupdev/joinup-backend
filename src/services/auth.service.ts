import prisma from "../config/db";
import { compareHash, hashValue } from "../utils/bcrypt";
import {
  fifteenMinutesFromNow,
  fiveMinutesAgoFromNow,
  oneYearFromNow,
  thirtyDaysFromNow,
} from "../utils/date";
import appAssert from "../utils/appAssert";
import {
  CONFLICT,
  INTERNAL_SERVER_ERROR,
  NOT_FOUND,
  TOO_MANY_REQUESTS,
  UNAUTHORIZED,
  UNPROCESSABLE_ENTITY,
} from "../constants/http";
import { createJwtSession, verifyJwt } from "../utils/jwtSession";
import jwt from "jsonwebtoken";
import {
  FRONTEND_ORIGIN,
  JWT_REFRESH_SECRET,
  JWT_SECRET,
} from "../constants/env";
import { VerificationCodeType } from "@prisma/client";
import { sendMail } from "../utils/sendMail";
import {
  getPasswordResetTemplate,
  getVerifyEmailTemplate,
} from "../utils/emailTemplates";

export type userAccountParams = {
  email: string;
  password: string;
  userAgent?: string;
};

export const createAccount = async (data: userAccountParams) => {
  // verify existing user doesn't exist
  const existingUser = await prisma.user.findUnique({
    where: {
      email: data.email,
    },
  });
  appAssert(!existingUser, CONFLICT, "User already exists");

  // hash password
  const hashedPassword = await hashValue(data.password);

  // create user
  const user = await prisma.user.create({
    data: {
      email: data.email,
      password: hashedPassword,
    },
  });

  // create verification code
  const verificationCode = await prisma.verificationCode.create({
    data: {
      userId: user.id,
      type: "Email_Verification",
      expiresAt: oneYearFromNow(),
    },
  });

  const url = `${FRONTEND_ORIGIN}/verify/email/${verificationCode.id}`;

  // send email
  const { error } = await sendMail({
    to: user.email,
    ...getVerifyEmailTemplate(url),
  });

  // verify email sent
  console.error(error);
  // appAssert(!error, UNPROCESSABLE_ENTITY, "Failed to send email");

  // create jwt session
  const { accessToken, refreshToken } = await createJwtSession(
    user.id,
    data.userAgent
  );

  // return user and tokens
  return {
    user,
    accessToken,
    refreshToken,
  };
};

export const loginUser = async (data: userAccountParams) => {
  // get user by email
  const user = await prisma.user.findUnique({
    where: {
      email: data.email,
    },
  });

  // verify user exists
  appAssert(user, UNAUTHORIZED, "Invalid email or password");

  // verify password
  const isValid = await compareHash(data.password, user.password);
  appAssert(isValid, UNAUTHORIZED, "Invalid email or password");

  // create session
  const { accessToken, refreshToken } = await createJwtSession(
    user.id,
    data.userAgent
  );

  // return user and tokens
  return {
    user,
    accessToken,
    refreshToken,
  };
};

export const refreshUserAccessToken = async (refreshToken: string) => {
  // verify refresh token
  const { payload } = verifyJwt(refreshToken, {
    secret: JWT_REFRESH_SECRET,
    audience: ["user"],
  });

  appAssert(payload, UNAUTHORIZED, "Invalid JWT");
  appAssert(
    typeof payload === "object" && payload !== null,
    UNAUTHORIZED,
    "Invalid JWT"
  );
  appAssert("sessionId" in payload, UNAUTHORIZED, "SessionId not found in JWT");

  // get session by id
  const session = await prisma.session.findUnique({
    where: {
      id: payload.sessionId,
    },
  });

  // verify session exists
  appAssert(
    session && session.expiresAt.getTime() > Date.now(),
    UNAUTHORIZED,
    "Session Expired"
  );

  const sessionNeedsRefresh =
    session.expiresAt.getTime() - Date.now() < 24 * 60 * 60 * 1000;

  // refresh session if it expires in 24 hours
  if (sessionNeedsRefresh) {
    await prisma.session.update({
      where: {
        id: session.id,
      },
      data: {
        expiresAt: thirtyDaysFromNow(),
      },
    });
  }

  // create new refresh token
  const newRefreshToken = sessionNeedsRefresh
    ? jwt.sign(
        {
          sessionId: session.id,
        },
        JWT_REFRESH_SECRET,
        {
          expiresIn: "30d",
          audience: ["user"],
        }
      )
    : undefined;

  // create new access token
  const accessToken = jwt.sign(
    {
      sessionId: session.id,
      userId: session.userId,
    },
    JWT_SECRET,
    {
      expiresIn: "15m",
      audience: ["user"],
    }
  );

  // return tokens
  return {
    accessToken,
    newRefreshToken,
  };
};

export const verifyEmail = async (code: string) => {
  // get verification code
  const validCode = await prisma.verificationCode.findUnique({
    where: {
      id: code,
      type: VerificationCodeType.Email_Verification,
      expiresAt: {
        gte: new Date(),
      },
    },
  });
  appAssert(validCode, NOT_FOUND, "Invalid or Expired verification code");

  // get user by id
  const user = await prisma.user.findUnique({
    where: {
      id: validCode.userId,
    },
  });
  appAssert(user, NOT_FOUND, "User not found");

  // update user isEmailVerified
  const updateUser = await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      verified: true,
    },
  });
  appAssert(updateUser, UNPROCESSABLE_ENTITY, "Failed to verify email");

  // delete verification code
  await prisma.verificationCode.delete({
    where: {
      id: validCode.id,
    },
  });

  // return user
  return updateUser;
};

export const sendPasswordResetEmail = async (email: string) => {
  // get the user by email
  const user = await prisma.user.findUnique({
    where: {
      email: email,
    },
  });
  appAssert(user, NOT_FOUND, "User not found");

  //check email rate limit
  const count = await prisma.verificationCode.count({
    where: {
      userId: user.id,
      type: VerificationCodeType.Password_Reset,
      createdAt: {
        gte: fiveMinutesAgoFromNow(),
      },
    },
  });

  appAssert(
    count <= 1,
    TOO_MANY_REQUESTS,
    "Too many requests, please try again later"
  );

  // create verification code
  const verificationCode = await prisma.verificationCode.create({
    data: {
      userId: user.id,
      type: VerificationCodeType.Password_Reset,
      expiresAt: fifteenMinutesFromNow(),
    },
  });

  // send verification email
  const url = `{FRONTEND_ORIGIN}/password/reset?code=${
    verificationCode.id
  }&exp=${fiveMinutesAgoFromNow().getTime()}`;

  const { data, error } = await sendMail({
    to: user.email,
    ...getPasswordResetTemplate(url),
  });

  appAssert(
    data?.id,
    INTERNAL_SERVER_ERROR,
    `${error?.name} - ${error?.message}`
  );
  // return success
  return {
    url,
    emailId: data.id,
  };
};

type ResetPasswordParams = {
  password: string;
  verificationCode: string;
};

export const resetPassword = async ({
  password,
  verificationCode,
}: ResetPasswordParams) => {
  // get the verification code
  const validCode = await prisma.verificationCode.findUnique({
    where: {
      id: verificationCode,
      type: VerificationCodeType.Password_Reset,
      expiresAt: {
        gte: new Date(),
      },
    },
  });
  appAssert(validCode, NOT_FOUND, "Invalid or Expired verification code");

  // update the users password
  const updatedUser = await prisma.user.update({
    where: {
      id: validCode.userId,
    },
    data: {
      password: await hashValue(password),
    },
  });

  appAssert(updatedUser, UNPROCESSABLE_ENTITY, "Failed to reset password!");

  // delete the verification code
  await prisma.verificationCode.deleteMany({
    where: {
      id: validCode.id,
    },
  });

  // delete all sessions
  return updatedUser;
};
