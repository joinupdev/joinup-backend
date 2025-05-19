import { Request } from "express";
import { Speaker } from "../types/event.types";
import { Prisma } from "@prisma/client";
import type { Express } from "express";
import { uploadToS3 } from "../utils/uploadToS3";

export const createSpeakers = async (
  tx: Prisma.TransactionClient,
  speakers: Speaker[],
  req: Request,
  id: string,
  type: "Host" | "Guest"
) => {
  if (speakers && speakers.length > 0) {
    await Promise.all(
      speakers.map(async (speaker: Speaker, index: number) =>
        createSpeaker(tx, speaker, req, id, type, index)
      )
    );
  }
};

export const createSpeaker = async (
  tx: Prisma.TransactionClient,
  speaker: Speaker,
  req: Request,
  id: string,
  type: "Host" | "Guest",
  index: number
) => {
  // Upload avatar if provided
  const avatarField = type === "Host" ? "hostAvatars" : "guestAvatars";
  const avatarKey =
    (await uploadToS3(
      req.files as Record<string, Express.Multer.File[]>,
      avatarField,
      `speaker/${id}-${type.toLowerCase()}-${index}`,
      index
    )) || null;

  // Create speaker record in the database
  const newSpeaker = await tx.speaker.create({
    data: {
      name: speaker.name,
      profession: speaker.profession || null,
      linkedin: speaker.linkedin || null,
      twitter: speaker.twitter || null,
      avatar: avatarKey,
      type,
      eventId: id,
    },
  });

  // Add the relation between speaker and event
  await tx.event.update({
    where: { id },
    data: {
      [type === "Host" ? "hosts" : "guests"]: {
        connect: { id: newSpeaker.id },
      },
    },
  });

  return newSpeaker;
};
