import prisma from "../config/db";
import { v4 as uuidv4 } from "uuid";
import { createEventSchema } from "../schema/event.schema";
import appAssert from "../utils/appAssert";
import { BAD_REQUEST } from "../constants/http";
import AppErrorCode from "../constants/appErrorCode";
import type { Request, Express } from "express";
import { Speaker } from "../types/event.types";
import { createSpeakers } from "../services/speaker.service";
import { uploadToS3 } from "../utils/uploadToS3";

export const createEvent = async (
  eventData: Event,
  hosts: Speaker[],
  guests: Speaker[],
  req: Request
) => {
  // Validate input using Zod schema
  const result = createEventSchema.safeParse(eventData);

  appAssert(
    result.success,
    BAD_REQUEST,
    JSON.stringify(result.error?.format()),
    AppErrorCode.BadRequest
  );
  // Extract event data without hosts and guests
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { hosts: _, guests: __, ...restEventData } = result.data;

  // Create event and associated hosts/guests in a transaction
  const event = await prisma.$transaction(async (tx) => {
    // Upload poster to S3 if provided
    const id = uuidv4();
    const posterKey = await uploadToS3(
      req.files as Record<string, Express.Multer.File[]>,
      "poster",
      `poster/${id}`,
      0
    );

    // Create the event record in the database
    const newEvent = await tx.event.create({
      data: {
        id,
        ...restEventData,
        poster: posterKey || null, // Use null if empty string
        userId: req.userId, // From the authenticate middleware
      },
    });

    // Process and create hosts - this stores host data in the database
    await createSpeakers(tx, hosts, req, id, "Host");

    // Process and create guests - this stores guest data in the database
    await createSpeakers(tx, guests, req, id, "Guest");

    // Return the created event with all its relations
    return tx.event.findUnique({
      where: { id: newEvent.id },
      include: {
        hosts: true,
        guests: true,
      },
    });
  });

  return event;
};
