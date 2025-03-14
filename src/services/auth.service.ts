import jwt from "jsonwebtoken";
import prisma from "../config/db";
import { JWT_REFRESH_SECRET, JWT_SECRET } from "../constants/env";
import { compareHash, hashValue } from "../utils/bcrypt";
import { oneYearFromNow, thirtyDaysFromNow } from "../utils/date";
import appAssert from "../utils/appAssert";
import { CONFLICT, UNAUTHORIZED } from "../constants/http";

export type createAccountParams = {
  email: string;
  password: string;
  userAgent?: string;
};

export const createAccount = async (data: createAccountParams) => {
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
  // create session
  const session = await prisma.session.create({
    data: {
      userId: user.id,
      userAgent: data.userAgent,
      expiresAt: thirtyDaysFromNow(),
    },
  });

  // sign access token and refresh token
  const refreshToken = jwt.sign({ sessionId: session.id }, JWT_REFRESH_SECRET, {
    expiresIn: "30d",
    audience: ["user"],
  });

  const accessToken = jwt.sign(
    {
      sessionId: session.id,
      userId: user.id,
    },
    JWT_SECRET,
    {
      expiresIn: "15m",
      audience: ["user"],
    }
  );

  // return user and tokens
  return {
    user,
    accessToken,
    refreshToken,
  };
};

export const loginUser = async (data: createAccountParams) => {
  // get user by email
  const user = await prisma.user.findUnique({
    where: {
      email: data.email,
    },
  });

  // verify user exists
  appAssert(user, UNAUTHORIZED, "Invalid email or password");

  // verify password
  if (data.password && user.password) {
    const isValid = await compareHash(data.password, user.password);
    appAssert(isValid, UNAUTHORIZED, "Invalid email or password");
  }

  // create session
  const session = await prisma.session.create({
    data: {
      userId: user.id,
      userAgent: data.userAgent,
      expiresAt: thirtyDaysFromNow(),
    },
  });

  // sign access token and refresh token
  const refreshToken = jwt.sign(
    {
      sessionId: session.id,
    },
    JWT_REFRESH_SECRET,
    {
      expiresIn: "30d",
      audience: ["user"],
    }
  );

  const accessToken = jwt.sign(
    {
      sessionId: session.id,
      userId: user.id,
    },
    JWT_SECRET,
    {
      expiresIn: "15m",
      audience: ["user"],
    }
  );

  // return user and tokens
  return {
    user,
    accessToken,
    refreshToken,
  };
};
