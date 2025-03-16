import { VerificationCodeType } from "@prisma/client";
import prisma from "../config/db";
import { NOT_FOUND, UNPROCESSABLE_ENTITY } from "../constants/http";
import appAssert from "../utils/appAssert";

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
