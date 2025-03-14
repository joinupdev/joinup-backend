import assert from "node:assert";
import { HTTP_STATUS_CODES } from "../constants/http";
import AppErrorCode from "../constants/appErrorCode";
import { AppError } from "./AppError";

type AppAssert = (
  condition: any,
  httpStatusCode: HTTP_STATUS_CODES,
  message: string,
  appErrorCode?: AppErrorCode
) => asserts condition;

/**
 * Asserts a condition that throws an error if the condition is falsy.
 */

const appAssert: AppAssert = (
  condition,
  httpStatusCode,
  message,
  appErrorCode
) => assert(condition, new AppError(httpStatusCode, message, appErrorCode));

export default appAssert;
