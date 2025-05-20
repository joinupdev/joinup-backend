import rateLimit from "express-rate-limit";
import { TOO_MANY_REQUESTS } from "../constants/http";
import { AppError } from "../utils/AppError";
import AppErrorCode from "../constants/appErrorCode";

export const oneSecondLimiter = rateLimit({
  windowMs: 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(
      new AppError(
        TOO_MANY_REQUESTS,
        "Too many requests, please try again later.",
        AppErrorCode.TooManyRequests
      )
    );
  },
});

export const oneMinuteLimiter = rateLimit({
  windowMs: 1000 * 60,
  limit: 60,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(
      new AppError(
        TOO_MANY_REQUESTS,
        "Too many requests, please try again later.",
        AppErrorCode.TooManyRequests
      )
    );
  },
});

