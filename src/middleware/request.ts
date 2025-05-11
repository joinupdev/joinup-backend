import { Request, Response, NextFunction } from "express";
import logger from "../config/logger";

const request = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  res.on("finish", () => {
    const endTime = Date.now();
    logger.info(
      `${req.method} ${req.originalUrl} - ${endTime - startTime}ms - ${
        res.statusCode
      }`,
      { label: "request-count" }
    );
  });

  next();
};

export default request;
