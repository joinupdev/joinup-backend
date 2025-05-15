/* eslint-disable @typescript-eslint/no-unused-vars */
import prisma from "../config/db";
import { NOT_FOUND, OK } from "../constants/http";
import { USER_PROFILE_SELECT } from "../constants/prisma";
import { updateUserProfileSchema, updateUserSchema } from "../schema/user.schema";
import appAssert from "../utils/appAssert";
import catchError from "../utils/catchError";
import { UserProfile } from "../types/user.types";

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
  const user = (await prisma.userProfile.findUnique({
    where: {
      userId: req.userId,
    },
    select: USER_PROFILE_SELECT,
  })) as UserProfile | null;

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

  const updatedUserProfile = await prisma.userProfile.update({
    where: {
      userId: req.userId,
    },
    data: validatedData,
    select: USER_PROFILE_SELECT,
  });

  res.status(OK).json(updatedUserProfile);
});
