import { z } from "zod";
import {
  EventCategory,
  EventType,
  LocationType
} from "../../generated/prisma";

export const createEventSchema = z.object({
  name: z.string().min(1, "Event name is required"),
  description: z.string().min(1, "Event description is required"),
  poster: z.string().url("Invalid poster URL").optional().nullable(),
  type: z.nativeEnum(EventType, {
    errorMap: () => ({ message: "Invalid event type" }),
  }),
  category: z.nativeEnum(EventCategory, {
    errorMap: () => ({ message: "Invalid event category" }),
  }),
  startTime: z.coerce.date(),
  duration: z.number().positive("Duration must be positive"),
  location: z.nativeEnum(LocationType, {
    errorMap: () => ({ message: "Invalid location type" }),
  }),
  completeAddress: z.string().min(1, "Complete address is required"),
  isPaid: z.boolean(),
  seats: z.number().int().positive("Number of seats must be positive"),
  ticketPrice: z.array(
    z.number().nonnegative("Ticket price must be non-negative")
  ),
  accountNumber: z.string().optional().nullable(),
  accountName: z.string().optional().nullable(),
  IFSCCode: z.string().optional().nullable(),
  termsConditions: z.string().optional().nullable(),
  // Nested objects for speakers and hosts
  hosts: z.array(
    z.object({
      name: z.string().min(1, "Host name is required"),
      profession: z.string().optional().nullable(),
      linkedin: z.string().url("Invalid LinkedIn URL").optional().nullable(),
      twitter: z.string().url("Invalid Twitter URL").optional().nullable(),
      avatar: z.string().url("Invalid avatar URL").optional().nullable(),
    })
  ),
  guests: z.array(
    z.object({
      name: z.string().min(1, "Speaker name is required"),
      profession: z.string().optional().nullable(),
      linkedin: z.string().url("Invalid LinkedIn URL").optional().nullable(),
      twitter: z.string().url("Invalid Twitter URL").optional().nullable(),
      avatar: z.string().url("Invalid avatar URL").optional().nullable(),
    })
  ),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
