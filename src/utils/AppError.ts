import AppErrorCode from "../constants/appErrorCode";
import { HTTP_STATUS_CODES } from "../constants/http";

export class AppError extends Error {
  constructor(
    public statusCode: HTTP_STATUS_CODES,
    public message: string,
    public errorCode?: AppErrorCode
  ) {
    super(message);
  }
}
