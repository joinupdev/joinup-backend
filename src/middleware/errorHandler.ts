import { ErrorRequestHandler, Response } from "express";
import { BAD_REQUEST, INTERNAL_SERVER_ERROR } from "../constants/http";
import { z } from "zod";
import { AppError } from "../utils/AppError";
import { clearAuthCookie, REFRESH_PATH } from "../utils/cookies";

// Zod error handler
const handleZodError = (err: z.ZodError, res: Response) => {
  const errors = err.issues.map((error) => ({
    path: error.path.join("."),
    message: error.message,
  }));
  return res.status(BAD_REQUEST).json({
    message: err.message,
    errors,
  });
};

// App error handler
const handleAppError = (err: AppError, res: Response) => {
  return res.status(err.statusCode).json({
    message: err.message,
    errorCode: err.errorCode,
  });
};

// Error handler middleware
const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  console.log(`PATH: ${req.path}`);
  console.error(err);

  if (req.path === REFRESH_PATH) {
    clearAuthCookie(res);
  }

  if (err instanceof z.ZodError) {
    handleZodError(err, res);
    return;
  }

  if (err instanceof AppError) {
    handleAppError(err, res);
    return;
  }

  res.status(INTERNAL_SERVER_ERROR).json({ message: "Something went wrong" });
  return;
};

export default errorHandler;
