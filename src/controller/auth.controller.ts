import { z } from "zod";
import catchError from "../utils/catchError";
import { createAccount, loginUser } from "../services/auth.service";
import { CREATED, OK } from "../constants/http";
import { setAuthCookie } from "../utils/cookies";
import e from "express";

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
  setAuthCookie({ res, accessToken, refreshToken })
    .status(CREATED)
    .json({
      "message": "Account created successfully",
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
  setAuthCookie({ res, accessToken, refreshToken })
    .status(OK)
    .json({
      "message": "Login successful",
      email: user.email,
    });

});
