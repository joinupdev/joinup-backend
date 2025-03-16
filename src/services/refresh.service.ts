import prisma from "../config/db";
import { JWT_REFRESH_SECRET, JWT_SECRET } from "../constants/env";
import { UNAUTHORIZED } from "../constants/http";
import appAssert from "../utils/appAssert";
import { oneDayInMS, thirtyDaysFromNow } from "../utils/date";
import { verifyJwt } from "../utils/jwtSession";
import jwt from "jsonwebtoken";

export const refreshUserAccessToken = async (refreshToken: string) => {
  // verify refresh token
  const { payload, error } = verifyJwt(refreshToken, {
    secret: JWT_REFRESH_SECRET,
    audience: ["user"],
  });

  appAssert(
    !error &&
      payload &&
      typeof payload === "object" &&
      payload !== null &&
      "sessionId" in payload,
    UNAUTHORIZED,
    "Invalid JWT"
  );

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
    session.expiresAt.getTime() - Date.now() < oneDayInMS;

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
