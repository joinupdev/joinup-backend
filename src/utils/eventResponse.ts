import { getObject } from "../config/s3";
import { Event, Speaker } from "../types/event.types";

// Generate presigned URLs for the event poster and all avatars
export const eventResponse = async (event: Event): Promise<Event> => {

  // Replace poster S3 key with presigned URL if exists
  if (event.poster) {
    event.poster = await getObject(event.poster);
  }

  // Replace hosts' avatar S3 keys with presigned URLs
  if (event.hosts && event.hosts.length > 0) {
    event.hosts = await Promise.all(
      event.hosts.map(async (host: Speaker) => {
        if (host.avatar) {
          return { ...host, avatar: await getObject(host.avatar) };
        }
        return host;
      })
    );
  }

  // Replace guests' avatar S3 keys with presigned URLs
  if (event.guests && event.guests.length > 0) {
    event.guests = await Promise.all(
      event.guests.map(async (guest: Speaker) => {
        if (guest.avatar) {
          return { ...guest, avatar: await getObject(guest.avatar) };
        }
        return guest;
      })
    );
  }

  return event;
};
