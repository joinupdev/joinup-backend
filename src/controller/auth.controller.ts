import { z } from "zod";
import catchError from "../utils/catchError";
import { createAccount } from "../services/auth.service";
import { CREATED } from "../constants/http";
import { setAuthCookie } from "../utils/cookies";

const registerSchema = z.object({
  email: z.string().email().min(1).max(255),
  password: z.string().min(6).max(255).optional(),
  userAgent: z.string().optional(),
});

export const registerHandler = catchError(async (req, res) => {
  // Validate Request
  const request = registerSchema.parse({
    ...req.body,
    userAgent: req.headers["user-agent"],
  });

  // Ensure password is not undefined
  const password = request.password || "defaultPassword";

  // Create User
  const { user, accessToken, refreshToken } = await createAccount({
    email: request.email,
    password,
    userAgent: request.userAgent || "",
  });

  // Return Response
  setAuthCookie({ res, accessToken, refreshToken })
    .status(CREATED)
    .json(user);
});
