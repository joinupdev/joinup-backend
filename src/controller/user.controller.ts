/* eslint-disable @typescript-eslint/no-unused-vars */
import prisma from "../config/db";
import { NOT_FOUND, OK, BAD_REQUEST } from "../constants/http";
import {
  updateUserProfileSchema,
  updateUserSchema,
} from "../schema/user.schema";
import appAssert from "../utils/appAssert";
import catchError from "../utils/catchError";
import { updateUser } from "../services/updateUser.service";

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

  res.status(OK).json(user);
});

export const updateUserProfileHandler = catchError(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: {
      id: req.userId,
    },
  });

  appAssert(user, NOT_FOUND, "User not found");

  const validatedData = updateUserProfileSchema.parse(req.body);
  appAssert(validatedData, BAD_REQUEST, "Invalid data");

  const updatedUserProfile = await updateUser(validatedData, req.userId);

  res.status(OK).json(updatedUserProfile);
});
