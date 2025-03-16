import catchError from "../utils/catchError";
import {
  CREATED,
  OK,
  UNAUTHORIZED,
  UNPROCESSABLE_ENTITY,
} from "../constants/http";
import { clearAuthCookie, setAuthCookie } from "../utils/cookies";
import { verifyJwt } from "../utils/jwtSession";
import prisma from "../config/db";
import appAssert from "../utils/appAssert";
import {
  authSchema,
  emailSchema,
  resetPasswordSchema,
  verificationCodeSchema,
} from "../schema/auth.schema";
import { registerUser } from "../services/register.service";
import { loginUser } from "../services/login.service";
import { refreshUserAccessToken } from "../services/refresh.service";
import { verifyEmail } from "../services/verifyEmail.service";
import { sendPasswordResetEmail } from "../services/forgotPassword.service";
import { resetPassword } from "../services/resetPassword.service";

export const registerHandler = catchError(async (req, res) => {
  // Validate Request
  const request = authSchema.parse({
    ...req.body,
    userAgent: req.headers["user-agent"],
  });

  // Create User
  const { user, accessToken, refreshToken } = await registerUser(request);

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
  const request = authSchema.parse({
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
  const { payload, error } = verifyJwt(accessToken);

  appAssert(
    !error &&
      payload &&
      typeof payload === "object" &&
      payload !== null &&
      "sessionId" in payload,
    UNAUTHORIZED,
    "Invalid JWT"
  );

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
    message: "Password reset email sent successfully",
  });
});

export const resetPasswordHandler = catchError(async (req, res) => {
  const request = resetPasswordSchema.parse(req.body);

  await resetPassword(request);

  return clearAuthCookie(res).status(OK).json({
    message: "Password reset successful",
  });
});
