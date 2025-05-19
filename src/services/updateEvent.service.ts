import type { Request, Express } from "express";
import prisma from "../config/db";
import AppErrorCode from "../constants/appErrorCode";
import { BAD_REQUEST } from "../constants/http";
import { createEventSchema } from "../schema/event.schema";
import { Event } from "../types/event.types";
import appAssert from "../utils/appAssert";
import { uploadToS3 } from "../utils/uploadToS3";

export const updateEvent = async (
  eventData: Event,
  req: Request,
  existingEvent: Event
) => {
  // Validate input using Zod schema (partial validation for updates)
  // We need to create a partial schema for validation since this is an update
  const partialEventSchema = createEventSchema.partial();
  const result = partialEventSchema.safeParse(eventData);

  appAssert(
    result.success,
    BAD_REQUEST,
    JSON.stringify(result.error?.format() || ""),
    AppErrorCode.BadRequest
  );

  // Extract event data without hosts and guests
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { hosts: _, guests: __, ...restEventData } = result.data;

  // Update event and associated hosts/guests in a transaction
  const updatedEvent = await prisma.$transaction(async (tx) => {
    // Handle poster update if present
    const posterKey =
      (await uploadToS3(
        req.files as Record<string, Express.Multer.File[]>,
        "poster",
        `poster/${existingEvent.id}`,
        0,
        existingEvent.poster ? true : false
      )) || existingEvent.poster;

    // Update the event record in the database
    // Only include poster in the update if it was provided or already exists
    const eventToUpdate = {
      ...restEventData,
    };

    if (posterKey !== undefined) {
      eventToUpdate.poster = posterKey;
    }

    await tx.event.update({
      where: { id: existingEvent.id },
      data: eventToUpdate,
      include: {
        hosts: true,
        guests: true,
      },
    });

    // Return the updated event with all its relations
    return tx.event.findUnique({
      where: { id: existingEvent.id },
      include: {
        hosts: true,
        guests: true,
      },
    });
  });

  return updatedEvent;
};
