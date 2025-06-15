import {
  EventType,
  Profession,
  EventCategory,
  Prisma,
  LocationType,
} from "../../generated/prisma";
import prisma from "../config/db";
import { getObject } from "../config/s3";
import { getCityCoordinates } from "../utils/coordinates";

export const getEvents = async (
  profession?: Profession,
  location?: string,
  eventType?: EventType
) => {
  const baseWhere: Prisma.EventWhereInput = {
    isActive: true,
  };
  if (profession) {
    baseWhere.category = profession as EventCategory;
  }
  if (eventType) {
    baseWhere.type = eventType;
  }

  let finalWhere = { ...baseWhere };

  if (location) {
    if (location.toLowerCase() === "online") {
      finalWhere.location = LocationType.Online;
    } else {
      const locationCoords = await getCityCoordinates(location);

      if (locationCoords) {
        const radiusInKm = 100;
        const earthRadiusKm = 6371;
        const latRad = (locationCoords.latitude * Math.PI) / 180;
        const latDelta = (radiusInKm / earthRadiusKm) * (180 / Math.PI);
        const lonDelta =
          (radiusInKm / (earthRadiusKm * Math.cos(latRad))) * (180 / Math.PI);

        const physicalEventsCondition = {
          location: LocationType.Physical,
          latitude: {
            gte: locationCoords.latitude - latDelta,
            lte: locationCoords.latitude + latDelta,
          },
          longitude: {
            gte: locationCoords.longitude - lonDelta,
            lte: locationCoords.longitude + lonDelta,
          },
        };

        const onlineEventsCondition = {
          location: LocationType.Online,
        };

        finalWhere = {
          ...baseWhere,
          OR: [physicalEventsCondition, onlineEventsCondition],
        };
      } else {
        return [];
      }
    }
  }

  const events = await prisma.event.findMany({
    where: finalWhere,
    select: {
      id: true,
      name: true,
      location: true,
      completeAddress: true,
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
