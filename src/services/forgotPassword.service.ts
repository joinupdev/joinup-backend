import { VerificationCodeType } from "@prisma/client";
import prisma from "../config/db";
import {
  INTERNAL_SERVER_ERROR,
  NOT_FOUND,
  TOO_MANY_REQUESTS,
} from "../constants/http";
import appAssert from "../utils/appAssert";
import { fifteenMinutesFromNow, fiveMinutesAgoFromNow } from "../utils/date";
import { sendMail } from "../utils/sendMail";
import { getPasswordResetTemplate } from "../utils/emailTemplates";

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
