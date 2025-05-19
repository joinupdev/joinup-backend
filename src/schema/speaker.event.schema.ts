import { z } from "zod";
import { SpeakerType } from "../../generated/prisma";

export const createSpeakerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  profession: z.string().min(1, "Profession is required"),
  linkedin: z.string().url("Invalid LinkedIn URL").optional().nullable(),
  twitter: z.string().url("Invalid Twitter URL").optional().nullable(),
  avatar: z.string().url("Invalid avatar URL").optional().nullable(),
  type: z.nativeEnum(SpeakerType, {
    errorMap: () => ({ message: "Invalid speaker type" }),
  }),
});

export type CreateSpeakerInput = z.infer<typeof createSpeakerSchema>;