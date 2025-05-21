import { z } from "zod";
import { Gender, Profession, SocialLinkType } from "../../generated/prisma";

export const socialLinkSchema = z.object({
  type: z.nativeEnum(SocialLinkType),
  link: z.string().url(),
  isVisible: z.boolean().optional().default(false),
});

export const updateUserProfileSchema = z
  .object({
    name: z.string().optional(),
    phoneNumber: z.string().optional(),
    gender: z.nativeEnum(Gender).optional(),
    profession: z.nativeEnum(Profession).optional(),
    jobTitle: z.string().optional(),
    place: z.string().optional(),
    socialLinks: z.array(socialLinkSchema).optional(),
    bio: z.string().optional(),
    avatar: z.string().optional(),
  })
  .partial();

export const updateUserSchema = z.object({
  email: z.string().email().optional(),
  mobileNo: z.string().optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UpdateUserProfileInput = z.infer<typeof updateUserProfileSchema>;
export type SocialLinkInput = z.infer<typeof socialLinkSchema>;
