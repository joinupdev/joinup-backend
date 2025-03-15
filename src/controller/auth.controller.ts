import { z } from "zod";
import catchError from "../utils/catchError";
import {
  createAccount,
  loginUser,
  refreshUserAccessToken,
  resetPassword,
  sendPasswordResetEmail,
  verifyEmail,
} from "../services/auth.service";
import {
  CREATED,
  OK,
  UNAUTHORIZED,
  UNPROCESSABLE_ENTITY,
} from "../constants/http";
import {
  clearAuthCookie,
  setAuthCookie,
} from "../utils/cookies";
import { verifyJwt } from "../utils/jwtSession";
import prisma from "../config/db";
import appAssert from "../utils/appAssert";

const inputSchema = z.object({
  email: z.string().email().min(1).max(255),
  password: z.string().min(6).max(255),
  userAgent: z.string().optional(),
});

const verificationCodeSchema = z.string().min(1).max(255);
const emailSchema = z.string().email().min(1).max(255);

const resetPasswordSchema = z.object({
  password: z.string().min(6).max(255),
  verificationCode: verificationCodeSchema
})

export const registerHandler = catchError(async (req, res) => {
  // Validate Request
  const request = inputSchema.parse({
    ...req.body,
    userAgent: req.headers["user-agent"],
  });

  // Create User
  const { user, accessToken, refreshToken } = await createAccount(request);

  // Return Response
  return setAuthCookie({ res, accessToken, refreshToken })
    .status(CREATED)
    .json({
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
  const { user, accessToken, refreshToken } = await loginUser(request);

  // Return Response
  return setAuthCookie({ res, accessToken, refreshToken }).status(OK).json({
    message: "Login successful",
    email: user.email,
  });
});

export const logoutHandler = catchError(async (req, res) => {
  const accessToken = req.cookies.accessToken;

  // Verify JWT
  const { payload } = verifyJwt(accessToken);

  appAssert(payload, UNAUTHORIZED, "Invalid JWT");
  appAssert(
    typeof payload === "object" && payload !== null,
    UNAUTHORIZED,
    "Invalid JWT"
  );
  appAssert("sessionId" in payload, UNAUTHORIZED, "SessionId not found in JWT");

  // Delete Session
  try {
    await prisma.session.delete({
      where: {
        id: payload.sessionId,
      },
    });
  } catch (error) {
    appAssert(false, UNPROCESSABLE_ENTITY, "Failed to delete session");
  }

  // Return Response
  return clearAuthCookie(res).status(OK).json({
    message: "Logged out successfully",
  });
});

export const refreshTokenHandler = catchError(async (req, res) => {
  const refreshToken = req.cookies.refreshToken as string | undefined;
  appAssert(refreshToken, UNAUTHORIZED, "Missing Refresh Token");

  const { accessToken, newRefreshToken } = await refreshUserAccessToken(
    refreshToken
  );

  return setAuthCookie({ res, accessToken, refreshToken: newRefreshToken })
    .status(OK)
    .json({
      message: "Token refreshed successfully",
    });
});

export const verifyEmailHandler = catchError(async (req, res) => {
  const verificationCode = verificationCodeSchema.parse(req.params.code);

  // Verify Email
  await verifyEmail(verificationCode);

  // Return Response
  return res.status(OK).json({
    message: "Email verified successfully",
  });
});

export const forgotPasswordHandler = catchError(async (req, res) => {
  const email = emailSchema.parse(req.body.email);

  await sendPasswordResetEmail(email);

  return res.status(OK).json({
    "message": "Password reset email sent successfully",
  });
});

export const resetPasswordHandler = catchError(async (req, res) => {
  const request = resetPasswordSchema.parse(req.body);

  await resetPassword(request);

  return clearAuthCookie(res).status(OK).json({
    "message": "Password reset successfully",
  });
});