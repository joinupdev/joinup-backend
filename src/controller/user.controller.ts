/* eslint-disable @typescript-eslint/no-unused-vars */
import prisma from "../config/db";
import { NOT_FOUND, OK, BAD_REQUEST } from "../constants/http";
import {
  updateUserProfileSchema,
  updateUserSchema,
} from "../schema/user.schema";
import appAssert from "../utils/appAssert";
import catchError from "../utils/catchError";
import { Prisma } from "../../generated/prisma";

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

  // Extract socialLinks before creating the update data
  const { socialLinks, ...otherData } = validatedData;

  // Prepare data for Prisma
  const updateData: Prisma.UserProfileUpdateInput = otherData;

  // Handle socialLinks separately if provided
  if (socialLinks && socialLinks.length > 0) {
    // Get existing social links for this user
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId: req.userId },
      include: { socialLinks: true },
    });

    // Create upsert operations for each social link
    const socialLinkOps = await Promise.all(
      socialLinks.map(async (newLink) => {
        // Check if this link type already exists
        const existingLink = userProfile?.socialLinks.find(
          (link) => link.type === newLink.type
        );

        if (existingLink) {
          // Update existing link
          return prisma.socialLink.update({
            where: { id: existingLink.id },
            data: {
              link: newLink.link,
              isVisible: newLink.isVisible ?? false,
            },
          });
        } else {
          // Create new link
          return prisma.socialLink.create({
            data: {
              type: newLink.type,
              link: newLink.link,
              isVisible: newLink.isVisible ?? false,
              UserProfile: { connect: { userId: req.userId } },
            },
          });
        }
      })
    );
  }

  // Update the user profile
  const updatedUserProfile = await prisma.userProfile.update({
    where: {
      userId: req.userId,
    },
    data: updateData,
    include: {
      socialLinks: true,
    },
  });

  res.status(OK).json(updatedUserProfile);
});
