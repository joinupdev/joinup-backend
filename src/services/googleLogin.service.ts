import { google } from "googleapis";
import oauth2Client from "../config/google";
import prisma from "../config/db";
import { hashValue } from "../utils/bcrypt";
import { generateRandomString } from "../utils/randomString";
import appAssert from "../utils/appAssert";
import { UNAUTHORIZED } from "../constants/http";
import { createJwtSession } from "../utils/jwtSession";

export const googleLogin = async (code: string, userAgent: string) => {
  const { tokens } = await oauth2Client.getToken(code);
  appAssert(tokens, UNAUTHORIZED, "Missing Google Tokens");
  oauth2Client.setCredentials(tokens);

  const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
  const userInfo = await oauth2.userinfo.get();
  appAssert(userInfo, UNAUTHORIZED, "Missing Google User Info");

  const { email, name, picture } = userInfo.data;
  appAssert(email, UNAUTHORIZED, "Missing Google Email");

  let user = await prisma.user.findUnique({
    where: {
      email,
    },
  });
  
  if (!user) {
    const password = generateRandomString(10);
    // hash password
    const hashedPassword = await hashValue(password);

    // create user
    user = await prisma.user.create({
      data: {
        email: email,
        password: hashedPassword,
        verified: true,
      },
    });

    // create user profile
    await prisma.userProfile.create({
      data: {
        userId: user.id,
        name: name,
        avatar: picture,
      },
    });
  }

  // create jwt session
  const { accessToken, refreshToken } = await createJwtSession(user.id, userAgent);

  return {
    user,
    accessToken,
    refreshToken,
  };
};
