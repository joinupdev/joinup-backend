import prisma from "../config/db";
import { SocialLinkInput, UpdateUserProfileInput } from "../schema/user.schema";

export const updateUser = async (validatedData: UpdateUserProfileInput, userId: string) => {
      // Extract socialLinks before creating the update data
  const { socialLinks, ...updateData } = validatedData;
    // Handle socialLinks separately if provided
    if (socialLinks && socialLinks.length > 0) {
        // Get existing social links for this user
        const userProfile = await prisma.userProfile.findUnique({
          where: { userId: userId },
          include: { socialLinks: true },
        });
    
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

      return updatedUserProfile;
};