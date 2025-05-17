import multer from "multer";
import { BAD_REQUEST } from "../constants/http";
import { NextFunction, Request, Response } from "express";

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Middleware to handle multipart form data with one poster and multiple avatar images
const eventUpload = upload.fields([
  { name: "poster", maxCount: 1 },
  { name: "hostAvatars", maxCount: 10 },
  { name: "guestAvatars", maxCount: 20 },
]);

// Middleware wrapper for multer
export const handleImageUpload = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  eventUpload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res
          .status(BAD_REQUEST)
          .json({ error: `Upload error: ${err.message}` });
      } else if (err) {
        return res
          .status(BAD_REQUEST)
          .json({ error: `Unknown error: ${err.message}` });
      }
      next();
    });
  };