import type { Express, Request } from "express";
import prisma from "../config/db";
import { getObject } from "../config/s3";
import { SocialLinkInput, UpdateUserProfileInput } from "../schema/user.schema";
import { uploadToS3 } from "../utils/uploadToS3";

export const updateUser = async (
  validatedData: UpdateUserProfileInput,
  userId: string,
  req: Request
) => {
  const userProfile = await prisma.userProfile.findUnique({
    where: { userId },
    include: { socialLinks: true },
  });
  // Extract socialLinks before creating the update data
  const { socialLinks, ...restData } = validatedData;
  const avatarKey =
    (await uploadToS3(
      req.files as Record<string, Express.Multer.File[]>,
      "avatar",
      `avatar/${userId}`,
      0,
      userProfile?.avatar ? true : false
    )) || userProfile?.avatar;

  const updateData = { ...restData, avatar: avatarKey };

  // Handle socialLinks separately if provided
  if (socialLinks && socialLinks.length > 0) {
    // Get existing social links for this user

    // Create upsert operations for each social link
    await Promise.all(
      socialLinks.map(async (newLink: SocialLinkInput) => {
        // Check if this link type already exists
        const existingLink = userProfile?.socialLinks.find(
          (link: SocialLinkInput) => link.type === newLink.type
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
              UserProfile: { connect: { userId: userId } },
            },
          });
        }
      })
    );
  }

  // Update the user profile
  const updatedUserProfile = await prisma.userProfile.update({
    where: {
      userId: userId,
    },
    data: updateData,
    include: {
      socialLinks: true,
    },
  });

  if (updatedUserProfile.avatar) {
    const signedUrl = await getObject(updatedUserProfile.avatar);
    updatedUserProfile.avatar = signedUrl;
  }

  return updatedUserProfile;
};
