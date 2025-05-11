import { RequestHandler } from "express";
import appAssert from "../utils/appAssert";
import { UNAUTHORIZED } from "../constants/http";
import AppErrorCode from "../constants/appErrorCode";
import { verifyJwt } from "../utils/jwtSession";

interface JwtPayload {
  userId: string;
  sessionId: string;
}

const authenticate: RequestHandler = (req, res, next) => {
  const accessToken = req.cookies.accessToken as string | undefined;
  appAssert(
    accessToken,
    UNAUTHORIZED,
    "Unauthorized",
    AppErrorCode.InvalidAccessToken
  );

  const { payload, error } = verifyJwt(accessToken);
  appAssert(
    payload,
    UNAUTHORIZED,
    error === "jwt expired" ? "Token expired" : "Invalid Token",
    AppErrorCode.InvalidAccessToken
  );

  req.userId = (payload as JwtPayload).userId;
  req.sessionId = (payload as JwtPayload).sessionId;
  next();
};

export default authenticate;
