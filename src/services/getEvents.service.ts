import {
  EventType,
  LocationType,
  Profession,
  EventCategory,
} from "../../generated/prisma";
import prisma from "../config/db";
import { getObject } from "../config/s3";

export const getEvents = async (
  profession: Profession,
  location: LocationType,
  eventType: EventType
) => {
  const events = await prisma.event.findMany({
    where: {
      category: profession as EventCategory,
      location: location as LocationType,
      type: eventType as EventType,
    },
    select: {
      id: true,
      name: true,
      location: true,
      startTime: true,
      type: true,
      poster: true,
    },
  });

  // Replace S3 keys with signed URLs for posters
  const eventsWithSignedUrls = await Promise.all(
    events.map(async (event) => {
      if (event.poster) {
        const signedUrl = await getObject(event.poster);
        return { ...event, poster: signedUrl };
      }
      return event;
    })
  );

  return eventsWithSignedUrls;
};
