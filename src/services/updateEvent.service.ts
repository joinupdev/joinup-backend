import { Request } from "express";
import prisma from "../config/db";
import AppErrorCode from "../constants/appErrorCode";
import { BAD_REQUEST } from "../constants/http";
import { createEventSchema } from "../schema/event.schema";
import { Event, Speaker } from "../types/event.types";
import appAssert from "../utils/appAssert";
import { uploadObject, deleteObject } from "../config/s3";
import { v4 as uuidv4 } from "uuid";

export const updateEvent = async (
  eventData: Event,
  hosts: Speaker[],
  guests: Speaker[],
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
    result.success ? "" : JSON.stringify(result.error.format()),
    AppErrorCode.BadRequest
  );

  // Extract event data without hosts and guests
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { hosts: _, guests: __, ...restEventData } = result.data;

  // Update event and associated hosts/guests in a transaction
  const updatedEvent = await prisma.$transaction(async (tx) => {
    // Handle poster update if present
    let posterKey = existingEvent.poster;
    if (
      req.files &&
      "poster" in req.files &&
      req.files.poster &&
      req.files.poster[0]
    ) {
      const posterFile = req.files.poster[0];

      // If there's an existing poster, delete it from S3
      if (existingEvent.poster) {
        await deleteObject(existingEvent.poster);
      }

      // Upload new poster
      posterKey = `poster/${uuidv4()}-${posterFile.originalname}`;
      await uploadObject(posterKey, posterFile.buffer, posterFile.mimetype);
    }

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
    });

    // Process updated/new hosts
    if (hosts && hosts.length > 0) {
      // Keep track of processed host IDs to determine which ones to delete
      const processedHostIds = new Set();

      await Promise.all(
        hosts.map(async (host: Speaker, index: number) => {
          // Determine if this is an update or new host
          const isExistingHost =
            host.id && existingEvent.hosts.some((h) => h.id === host.id);

          // Handle host avatar
          let avatarKey = isExistingHost
            ? existingEvent.hosts.find((h) => h.id === host.id)?.avatar || null
            : null;

          // Check for new avatar upload
          if (
            req.files &&
            "hostAvatars" in req.files &&
            req.files.hostAvatars &&
            req.files.hostAvatars[index]
          ) {
            const avatarFile = req.files.hostAvatars[index];

            // If updating a host with an existing avatar, delete old one
            if (isExistingHost && avatarKey) {
              await deleteObject(avatarKey);
            }

            // Upload new avatar
            avatarKey = `speaker/${uuidv4()}-${avatarFile.originalname}`;
            await uploadObject(
              avatarKey,
              avatarFile.buffer,
              avatarFile.mimetype
            );
          }

          if (isExistingHost) {
            // Update existing host
            processedHostIds.add(host.id);
            await tx.speaker.update({
              where: { id: host.id },
              data: {
                name: host.name,
                profession: host.profession || null,
                linkedin: host.linkedin || null,
                twitter: host.twitter || null,
                avatar: avatarKey,
              },
            });
          } else {
            // Create new host
            const newHost = await tx.speaker.create({
              data: {
                name: host.name,
                profession: host.profession || null,
                linkedin: host.linkedin || null,
                twitter: host.twitter || null,
                avatar: avatarKey,
                type: "Host",
                eventId: existingEvent.id,
              },
            });

            processedHostIds.add(newHost.id);

            // Add relation between new host and event
            await tx.event.update({
              where: { id: existingEvent.id },
              data: {
                hosts: {
                  connect: { id: newHost.id },
                },
              },
            });
          }
        })
      );

      // Remove hosts that were not included in the update
      const hostsToRemove = existingEvent.hosts.filter(
        (h) => !processedHostIds.has(h.id)
      );
      for (const hostToRemove of hostsToRemove) {
        // Delete avatar if it exists
        if (hostToRemove.avatar) {
          await deleteObject(hostToRemove.avatar);
        }

        // Delete the host
        await tx.speaker.delete({
          where: { id: hostToRemove.id },
        });
      }
    }

    // Process updated/new guests
    if (guests && guests.length > 0) {
      // Keep track of processed guest IDs to determine which ones to delete
      const processedGuestIds = new Set();

      await Promise.all(
        guests.map(async (guest: Speaker, index: number) => {
          // Determine if this is an update or new guest
          const isExistingGuest =
            guest.id && existingEvent.guests.some((g) => g.id === guest.id);

          // Handle guest avatar
          let avatarKey = isExistingGuest
            ? existingEvent.guests.find((g) => g.id === guest.id)?.avatar ||
              null
            : null;

          // Check for new avatar upload
          if (
            req.files &&
            "guestAvatars" in req.files &&
            req.files.guestAvatars &&
            req.files.guestAvatars[index]
          ) {
            const avatarFile = req.files.guestAvatars[index];

            // If updating a guest with an existing avatar, delete old one
            if (isExistingGuest && avatarKey) {
              await deleteObject(avatarKey);
            }

            // Upload new avatar
            avatarKey = `speaker/${uuidv4()}-${avatarFile.originalname}`;
            await uploadObject(
              avatarKey,
              avatarFile.buffer,
              avatarFile.mimetype
            );
          }

          if (isExistingGuest) {
            // Update existing guest
            processedGuestIds.add(guest.id);
            await tx.speaker.update({
              where: { id: guest.id },
              data: {
                name: guest.name,
                profession: guest.profession || null,
                linkedin: guest.linkedin || null,
                twitter: guest.twitter || null,
                avatar: avatarKey,
              },
            });
          } else {
            // Create new guest
            const newGuest = await tx.speaker.create({
              data: {
                name: guest.name,
                profession: guest.profession || null,
                linkedin: guest.linkedin || null,
                twitter: guest.twitter || null,
                avatar: avatarKey,
                type: "Guest",
                eventId: existingEvent.id,
              },
            });

            processedGuestIds.add(newGuest.id);

            // Add relation between new guest and event
            await tx.event.update({
              where: { id: existingEvent.id },
              data: {
                guests: {
                  connect: { id: newGuest.id },
                },
              },
            });
          }
        })
      );

      // Remove guests that were not included in the update
      const guestsToRemove = existingEvent.guests.filter(
        (g) => !processedGuestIds.has(g.id)
      );
      for (const guestToRemove of guestsToRemove) {
        // Delete avatar if it exists
        if (guestToRemove.avatar) {
          await deleteObject(guestToRemove.avatar);
        }

        // Delete the guest
        await tx.speaker.delete({
          where: { id: guestToRemove.id },
        });
      }
    }

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
