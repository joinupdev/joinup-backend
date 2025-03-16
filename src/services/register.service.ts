import { VerificationCodeType } from "@prisma/client";
import prisma from "../config/db";
import { FRONTEND_ORIGIN } from "../constants/env";
import { CONFLICT } from "../constants/http";
import { userAccountParams } from "../schema/auth.types";
import appAssert from "../utils/appAssert";
import { hashValue } from "../utils/bcrypt";
import { oneYearFromNow } from "../utils/date";
import { getVerifyEmailTemplate } from "../utils/emailTemplates";
import { createJwtSession } from "../utils/jwtSession";
import { sendMail } from "../utils/sendMail";

export const registerUser = async (data: userAccountParams) => {
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
      type: VerificationCodeType.Email_Verification,
      expiresAt: oneYearFromNow(),
    },
  });

  const url = `${FRONTEND_ORIGIN}/verify/email/${verificationCode.id}`;

  // send email
  const { error } = await sendMail({
    to: user.email,
    ...getVerifyEmailTemplate(url),
  });

  if(error)
    console.error(error);

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
