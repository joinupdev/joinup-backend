import { ErrorRequestHandler, Response } from "express";
import { BAD_REQUEST, INTERNAL_SERVER_ERROR } from "../constants/http";
import { z } from "zod";

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

// Error handler middleware
const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  console.log(`PATH: ${req.path}`);
  console.error(err);

  if (err instanceof z.ZodError) {
    handleZodError(err, res);
    return;
  }

  res.status(INTERNAL_SERVER_ERROR).json({ message: "Something went wrong" });
  return;
};

export default errorHandler;
