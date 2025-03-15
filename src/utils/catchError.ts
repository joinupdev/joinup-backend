import { Request, Response, NextFunction } from "express";

// AsyncController is a type that represents an async function that takes in a Request, Response, and NextFunction and returns a Promise that resolves to void.
type AsyncController = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<any>;

// catchError is a higher-order function that takes in an AsyncController and returns an AsyncController.
// The returned AsyncController catches any errors thrown by the original controller and passes them to the next middleware function.
const catchError =
  (controller: AsyncController): AsyncController =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await controller(req, res, next);
    } catch (error) {
      next(error);
    }
  };

export default catchError;
