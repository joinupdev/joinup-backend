import jwt from "jsonwebtoken";
import prisma from "../config/db";
import { thirtyDaysFromNow } from "./date";
import { JWT_REFRESH_SECRET, JWT_SECRET } from "../constants/env";


export const createJwtSession = async (
  userId: string,
  userAgent: string | undefined
) => {
  // create session
  const session = await prisma.session.create({
    data: {
      userId: userId,
      userAgent: userAgent,
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
      userId: userId,
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
    refreshToken,
  };
};
