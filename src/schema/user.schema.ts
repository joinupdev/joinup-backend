import { z } from "zod";
import { Gender, Profession, JobTitle } from "@prisma/client";

export const updateUserProfileSchema = z
  .object({
    name: z.string().optional(),
    gender: z.nativeEnum(Gender).optional(),
    profession: z.nativeEnum(Profession).optional(),
    jobTitle: z.nativeEnum(JobTitle).optional(),
    place: z.string().optional(),
    linkedin: z.string().url().optional(),
    linkedinVisibility: z.boolean().optional(),
    github: z.string().url().optional(),
    twitter: z.string().url().optional(),
    website: z.string().url().optional(),
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
