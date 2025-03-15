import prisma from "../config/db";
import { compareHash, hashValue } from "../utils/bcrypt";
import { oneYearFromNow, thirtyDaysFromNow } from "../utils/date";
import appAssert from "../utils/appAssert";
import { CONFLICT, UNAUTHORIZED } from "../constants/http";
import { createJwtSession, verifyJwt } from "../utils/jwtSession";
import jwt from "jsonwebtoken";
import { JWT_REFRESH_SECRET, JWT_SECRET } from "../constants/env";

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
      code: "123456",
      type: "Email_Verification",
      expiresAt: oneYearFromNow(),
    },
  });

  // send email

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
