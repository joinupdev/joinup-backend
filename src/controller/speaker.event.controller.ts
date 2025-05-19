import prisma from "../config/db";
import { deleteObject, getObject } from "../config/s3";
import AppErrorCode from "../constants/appErrorCode";
import { BAD_REQUEST, FORBIDDEN, NOT_FOUND, OK } from "../constants/http";
import { createSpeakerSchema } from "../schema/speaker.event.schema";
import { createSpeaker } from "../services/speaker.service";
import appAssert from "../utils/appAssert";
import catchError from "../utils/catchError";
import { uploadObject } from "../config/s3";
import type { Express, Request } from "express";

const validateInput = async (req: Request) => {
  const { id } = req.params;
  const { speakerId } = req.params;

  const existingEvent = await prisma.event.findUnique({ where: { id } });
  appAssert(existingEvent, NOT_FOUND, "Event not found");

  appAssert(
    existingEvent.userId === req.userId,
    FORBIDDEN,
    "You are not authorized to update this event. Only the event creator can update it.",
    AppErrorCode.Unauthorized
  );

  const existingSpeaker = await prisma.speaker.findUnique({
    where: { id: speakerId },
  });
  appAssert(existingSpeaker, NOT_FOUND, "Speaker not found");

  return existingSpeaker;
};

export const getSpeakerHandler = catchError(async (req, res) => {
  const { speakerId } = req.params;
  appAssert(speakerId, BAD_REQUEST, "Speaker ID is required");
  const speaker = await prisma.speaker.findUnique({
    where: {
      id: speakerId,
    },
  });
  appAssert(speaker, NOT_FOUND, "Speaker not found");
  if (speaker.avatar) {
    const signedUrl = await getObject(speaker.avatar);
    speaker.avatar = signedUrl;
  }
  res.status(OK).json(speaker);
});

export const createSpeakerHandler = catchError(async (req, res) => {
  const { id } = req.params;
  const existingEvent = await prisma.event.findUnique({ where: { id } });
  appAssert(existingEvent, NOT_FOUND, "Event not found");

  appAssert(
    existingEvent.userId === req.userId,
    FORBIDDEN,
    "You are not authorized to update this event. Only the event creator can update it.",
    AppErrorCode.Unauthorized
  );

  const result = createSpeakerSchema.safeParse(req.body);
  appAssert(
    result.success,
    BAD_REQUEST,
    JSON.stringify(result.error?.flatten().fieldErrors)
  );

  // Validate speaker type
  appAssert(
    req.body.type === "Host" || req.body.type === "Guest",
    BAD_REQUEST,
    "Speaker type must be either 'Host' or 'Guest'"
  );

  const speaker = await prisma.$transaction(async (tx) => {
    return await createSpeaker(tx, req.body, req, id, req.body.type, 0);
  });

  if (speaker.avatar) {
    const signedUrl = await getObject(speaker.avatar);
    speaker.avatar = signedUrl;
  }

  res.status(OK).json(speaker);
});

export const updateSpeakerHandler = catchError(async (req, res) => {
  const { id, speakerId } = req.params;
  const existingSpeaker = await validateInput(req);

  const partialSpeaker = createSpeakerSchema.partial().safeParse(req.body);
  appAssert(
    partialSpeaker.success,
    BAD_REQUEST,
    JSON.stringify(partialSpeaker.error?.flatten().fieldErrors)
  );

  // If type is being updated, validate it
  if (partialSpeaker.data.type) {
    appAssert(
      partialSpeaker.data.type === "Host" ||
        partialSpeaker.data.type === "Guest",
      BAD_REQUEST,
      "Speaker type must be either 'Host' or 'Guest'"
    );
  }

  const type = existingSpeaker.type as "Host" | "Guest";
  const newType = partialSpeaker.data.type || type;
  const avatarField = type === "Host" ? "hostAvatars" : "guestAvatars";
  let avatarKey = existingSpeaker.avatar;

  // Use transaction for all operations
  const updatedSpeaker = await prisma.$transaction(async (tx) => {
    // If a new avatar is uploaded, delete the old one and upload the new one
    const files = req.files as Record<string, Express.Multer.File[]>;
    if (files && files[avatarField] && files[avatarField][0]) {
      try {
        // delete if the avatar is present and it is not inside default folder
        if (avatarKey && !avatarKey.includes("default")) {
          await deleteObject(avatarKey);
        }
        const file = files[avatarField][0];
        avatarKey = `speaker/${id}-${type.toLowerCase()}-updated-0`;
        await uploadObject(avatarKey, file.buffer, file.mimetype);
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        throw new Error(`Failed to process avatar: ${errorMessage}`);
      }
    }

    // Update speaker record
    const updated = await tx.speaker.update({
      where: { id: speakerId },
      data: {
        ...partialSpeaker.data,
        avatar: avatarKey,
      },
    });

    // If type changed, update the event-speaker relationship
    if (type !== newType) {
      // Remove from old relationship
      await tx.event.update({
        where: { id },
        data: {
          [type === "Host" ? "hosts" : "guests"]: {
            disconnect: { id: speakerId },
          },
        },
      });

      // Add to new relationship
      await tx.event.update({
        where: { id },
        data: {
          [newType === "Host" ? "hosts" : "guests"]: {
            connect: { id: speakerId },
          },
        },
      });
    }

    return updated;
  });

  // Return signed URL for avatar if present
  if (updatedSpeaker.avatar) {
    updatedSpeaker.avatar = await getObject(updatedSpeaker.avatar);
  }

  res.status(OK).json(updatedSpeaker);
});

export const deleteSpeakerEventHandler = catchError(async (req, res) => {
  const { id, speakerId } = req.params;
  const existingSpeaker = await validateInput(req);
  const type = existingSpeaker.type as "Host" | "Guest";

  await prisma.$transaction(async (tx) => {
    // First, disconnect the speaker from event
    await tx.event.update({
      where: { id },
      data: {
        [type === "Host" ? "hosts" : "guests"]: {
          disconnect: { id: speakerId },
        },
      },
    });

    // Then, delete avatar if exists
    try {
      if (
        existingSpeaker.avatar &&
        !existingSpeaker.avatar.includes("default")
      ) {
        await deleteObject(existingSpeaker.avatar);
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error(`Failed to delete avatar: ${errorMessage}`);
      // Continue with deletion even if avatar deletion fails
    }

    // Finally, delete the speaker record
    await tx.speaker.delete({
      where: {
        id: speakerId,
      },
    });
  });

  res.status(OK).json({ message: "Speaker deleted successfully" });
});
