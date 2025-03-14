import { z } from "zod";
import catchError from "../utils/catchError";
import { createAccount, loginUser, refreshUserAccessToken } from "../services/auth.service";
import { CREATED, OK, UNAUTHORIZED } from "../constants/http";
import { clearAuthCookie, getAccessTokenCookieOptions, getRefreshTokenCookieOptions, setAuthCookie } from "../utils/cookies";
import { verifyJwt } from "../utils/jwtSession";
import prisma from "../config/db";
import e from "express";
import appAssert from "../utils/appAssert";

const inputSchema = z.object({
  email: z.string().email().min(1).max(255),
  password: z.string().min(6).max(255).optional(),
  userAgent: z.string().optional(),
});

export const registerHandler = catchError(async (req, res) => {
  // Validate Request
  const request = inputSchema.parse({
    ...req.body,
    userAgent: req.headers["user-agent"],
  });

  // Ensure password is not undefined
  const password = request.password || "defaultPassword";

  // Create User
  const { user, accessToken, refreshToken } = await createAccount({
    email: request.email,
    password,
    userAgent: request.userAgent,
  });

  // Return Response
  setAuthCookie({ res, accessToken, refreshToken }).status(CREATED).json({
    message: "Account created successfully",
    email: user.email,
  });
});

export const loginHandler = catchError(async (req, res) => {
  // Validate Request
  const request = inputSchema.parse({
    ...req.body,
    userAgent: req.headers["user-agent"],
  });

  // Login User
  const { user, accessToken, refreshToken } = await loginUser({
    email: request.email,
    password: request.password || "defaultPassword",
    userAgent: request.userAgent,
  });

  // Return Response
  setAuthCookie({ res, accessToken, refreshToken }).status(OK).json({
    message: "Login successful",
    email: user.email,
  });
});

export const logoutHandler = catchError(async (req, res) => {
  const accessToken = req.cookies.accessToken;
  const { payload } = verifyJwt(accessToken);

  if (payload) {
    await prisma.session.delete({
      where: {
        id:
          typeof payload === "object" && "sessionId" in payload
            ? payload.sessionId
            : undefined,
      },
    });
  }

  // Return Response
  clearAuthCookie(res).status(OK).json({
    message: "Logged out successfully",
  });
});

export const refreshTokenHandler = catchError(async (req, res) => {
  const refreshToken = req.cookies.refreshToken as string | undefined;
  appAssert(refreshToken, UNAUTHORIZED, "Missing Refresh Token");
  
  const { accessToken, newRefreshToken } = await refreshUserAccessToken(refreshToken);

  if(newRefreshToken) {
    res.cookie("refreshToken", newRefreshToken, getRefreshTokenCookieOptions());
  }

  res.status(OK).cookie("accessToken", accessToken, getAccessTokenCookieOptions()).json({
    message: "Token refreshed successfully",
  });

});
  
