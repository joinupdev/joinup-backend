import prisma from "../config/db";
import { deleteObject } from "../config/s3";
import { Event } from "../types/event.types";
export const deleteEvent = async (event: Event) => {
  // Use a transaction to ensure data consistency
  await prisma.$transaction(async (tx) => {
    // First, delete S3 resources to avoid orphaned files

    // Delete event poster if it exists
    if (event.poster) {
      await deleteObject(event.poster);
    }

    // Delete speaker avatars if they exist
    await Promise.all(
      event.guests.map(async (guest) => {
        if (guest.avatar) {
          await deleteObject(guest.avatar);
        }
      })
    );

    await Promise.all(
      event.hosts.map(async (host) => {
        if (host.avatar) {
          await deleteObject(host.avatar);
        }
      })
    );

    // Delete all speakers associated with the event (will cascade delete the relationship records)
    await tx.speaker.deleteMany({
      where: { eventId: event.id },
    });

    // Finally delete the event
    await tx.event.delete({
      where: { id: event.id },
    });
  });
};
