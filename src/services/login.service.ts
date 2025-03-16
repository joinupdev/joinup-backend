import prisma from "../config/db";
import { UNAUTHORIZED } from "../constants/http";
import { userAccountParams } from "../schema/auth.types";
import appAssert from "../utils/appAssert";
import { compareHash } from "../utils/bcrypt";
import { createJwtSession } from "../utils/jwtSession";

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
