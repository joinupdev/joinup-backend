/* eslint-disable @typescript-eslint/no-unused-vars */
import prisma from "../config/db";
import { NOT_FOUND, OK, BAD_REQUEST, FORBIDDEN } from "../constants/http";
import {
  updateUserProfileSchema,
  updateUserSchema,
} from "../schema/user.schema";
import appAssert from "../utils/appAssert";
import catchError from "../utils/catchError";
import { updateUser } from "../services/updateUser.service";
import AppErrorCode from "../constants/appErrorCode";
import { Request } from "express";
import { getObject } from "../config/s3";

export const getUserHandler = catchError(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: {
      id: req.userId,
    },
  });

  appAssert(user, NOT_FOUND, "User not found");

  const { password, ...userWithoutPassword } = user;
  res.status(OK).json(userWithoutPassword);
});

export const updateUserHandler = catchError(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: {
      id: req.userId,
    },
  });

  appAssert(user, NOT_FOUND, "User not found");

  const validatedData = updateUserSchema.parse(req.body);

  const updatedUser = await prisma.user.update({
    where: {
      id: req.userId,
    },
    data: validatedData,
  });

  const { password, ...userWithoutPassword } = updatedUser;

  res.status(OK).json(userWithoutPassword);
});

export const getUserProfileHandler = catchError(async (req, res) => {
  const user = await prisma.userProfile.findUnique({
    where: {
      userId: req.userId,
    },
    include: {
      socialLinks: true,
    },
  });

  appAssert(user, NOT_FOUND, "User not found");

  if (user.avatar) {
    const signedUrl = await getObject(user.avatar);
    user.avatar = signedUrl;
  }

  res.status(OK).json(user);
});

export const updateUserProfileHandler = catchError(
  async (req: Request, res) => {
    const user = await prisma.user.findUnique({
      where: {
        id: req.userId,
      },
    });

    appAssert(user, NOT_FOUND, "User not found");

    appAssert(
      user.id === req.userId,
      FORBIDDEN,
      "You are not authorized to update this user profile"
    );

    let userData;

    const hasFiles = req.files && Object.keys(req.files).length > 0;
    if (hasFiles) {
      try {
        userData = JSON.parse(req.body.body || "{}");
      } catch {
        return res
          .status(BAD_REQUEST)
          .json({ error: "Invalid user profile data format" });
      }
    } else {
      userData = req.body;
    }

    const validatedData = updateUserProfileSchema.parse(userData);

    const updatedUserProfile = await updateUser(validatedData, req.userId, req);

    res.status(OK).json(updatedUserProfile);
  }
);
