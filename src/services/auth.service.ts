import prisma from "../config/db";
import { compareHash, hashValue } from "../utils/bcrypt";
import { oneYearFromNow, thirtyDaysFromNow } from "../utils/date";
import appAssert from "../utils/appAssert";
import { CONFLICT, UNAUTHORIZED } from "../constants/http";
import { createJwtSession } from "../utils/jwtSession";

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

  // create jwt session
  const { accessToken, refreshToken } = await createJwtSession(user.id, data.userAgent);

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
  const { accessToken, refreshToken } = await createJwtSession(user.id, data.userAgent);

  // return user and tokens
  return {
    user,
    accessToken,
    refreshToken,
  };
};
