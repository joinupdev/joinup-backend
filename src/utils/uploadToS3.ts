import { deleteObject, uploadObject } from "../config/s3";
import type { Express } from "express";

export const uploadToS3 = async (
  files: Record<string, Express.Multer.File[]> | undefined,
  field: string,
  key: string,
  index: number,
  deleteExisting: boolean = false
): Promise<string | null> => {
  if (
    files &&
    field in files &&
    files[field] &&
    files[field][index]
  ) {
    const file = files[field][index];
    if (deleteExisting) {
      await deleteObject(key);
    }
    await uploadObject(key, file.buffer, file.mimetype);
    return key;
  }
  return null;
};