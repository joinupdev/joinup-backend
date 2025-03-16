import { VerificationCodeType } from "@prisma/client";
import prisma from "../config/db";
import { ResetPasswordParams } from "../schema/auth.types";
import { NOT_FOUND, UNPROCESSABLE_ENTITY } from "../constants/http";
import appAssert from "../utils/appAssert";
import { hashValue } from "../utils/bcrypt";

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
