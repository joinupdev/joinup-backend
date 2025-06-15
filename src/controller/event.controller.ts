import { BAD_REQUEST, FORBIDDEN, NOT_FOUND, OK } from "../constants/http";
import logger from "../config/logger";
import catchError from "../utils/catchError";
import appAssert from "../utils/appAssert";
import { EventCategory, EventType, Profession } from "../../generated/prisma";
import prisma from "../config/db";
import AppErrorCode from "../constants/appErrorCode";
import { getEvents } from "../services/getEvents.service";
import { createEvent } from "../services/createEvent.service";
import { eventResponse } from "../utils/eventResponse";
import { Event } from "../types/event.types";
import { deleteEvent } from "../services/deleteEvent.service";
import { updateEvent } from "../services/updateEvent.service";

export const getEventHandler = catchError(async (req, res) => {
  const profession = req.query.profession as string | undefined;
  const location = req.query.location as string | undefined;
  const eventType = req.query.eventType as string | undefined;
  logger.info(
    `Getting events by profession: ${profession}, location: ${location}, event type: ${eventType}`
  );

  if (profession) {
    appAssert(
      Object.values(EventCategory).includes(profession as EventCategory),
      BAD_REQUEST,
      "Invalid profession"
    );
  }

  // Only assert eventType if present
  if (eventType) {
    appAssert(
      Object.values(EventType).includes(eventType as EventType),
      BAD_REQUEST,
      "Invalid event type"
    );
  }

  const events = await getEvents(
    profession ? (profession as Profession) : undefined,
    location ? String(location) : undefined,
    eventType ? (eventType as EventType) : undefined
  );

  res.status(OK).json({ events });
});

export const createEventHandler = catchError(async (req, res) => {
  logger.info("Creating event");

  // Parse JSON data from form
  let eventData;
  let hosts = [];
  let guests = [];

  try {
    eventData = JSON.parse(req.body.eventData);
    if (eventData.hosts) hosts = eventData.hosts;
    if (eventData.guests) guests = eventData.guests;
  } catch {
    appAssert(false, BAD_REQUEST, "Invalid event data format");
  }

  // Create event in the database
  const event = await createEvent(eventData, hosts, guests, req);

  // Generate presigned URLs for event poster and speakers/hosts avatars
  const enrichedEvent = await eventResponse(event as Event);

  // Return the event with presigned URLs
  res.status(OK).json({ event: enrichedEvent });
});

export const getEventByIdHandler = catchError(async (req, res) => {
  const { id } = req.params;
  logger.info(`Getting event by id: ${id}`);
  const event = await prisma.event.findUnique({
    where: {
      id: id,
    },
    include: {
      guests: true,
      hosts: true,
    },
  });

  appAssert(event, NOT_FOUND, "Event not found");

  // Generate presigned URLs for event poster and speakers/hosts avatars
  const enrichedEvent = await eventResponse(event as Event);

  res.status(OK).json({ event: enrichedEvent });
});

export const updateEventHandler = catchError(async (req, res) => {
  const { id } = req.params;
  logger.info(`Updating event by id: ${id}`);

  // First check if the event exists and belongs to the logged-in user
  const existingEvent = await prisma.event.findUnique({
    where: { id },
    include: {
      hosts: true,
      guests: true,
    },
  });

  appAssert(existingEvent, NOT_FOUND, "Event not found");

  // Authorization check: Verify the logged-in user is the event creator
  appAssert(
    existingEvent.userId === req.userId,
    FORBIDDEN,
    "You are not authorized to update this event. Only the event creator can update it.",
    AppErrorCode.Unauthorized
  );

  // Handle multipart form data if present, otherwise handle JSON
  let eventData;

  // Check if this is a multipart request (has files)
  const hasFiles = req.files && Object.keys(req.files).length > 0;

  if (hasFiles) {
    // Parse JSON data from form
    try {
      eventData = JSON.parse(req.body.eventData || "{}");
    } catch {
      return res
        .status(BAD_REQUEST)
        .json({ error: "Invalid event data format" });
    }
  } else {
    // Direct JSON payload
    eventData = req.body;
  }

  const updatedEvent = await updateEvent(
    eventData,
    req,
    existingEvent as Event
  );

  // Generate presigned URLs for the event poster and all avatars
  const enrichedEvent = await eventResponse(updatedEvent as Event);

  res.status(OK).json({ event: enrichedEvent });
});

export const deleteEventHandler = catchError(async (req, res) => {
  const { id } = req.params;
  logger.info(`Deleting event by id: ${id}`);

  // Find the event first to verify it exists
  const event = await prisma.event.findUnique({
    where: { id },
    include: { guests: true, hosts: true },
  });

  appAssert(event, NOT_FOUND, "Event not found");

  // Authorization check: Verify the logged-in user is the event creator
  appAssert(
    event.userId === req.userId,
    FORBIDDEN,
    "You are not authorized to delete this event. Only the event creator can delete it.",
    AppErrorCode.Unauthorized
  );

  await deleteEvent(event as Event);

  res.status(OK).json({ message: "Event deleted successfully" });
});

export const getEventsByHostIdHandler = catchError(async (req, res) => {
  const { hostId } = req.params;
  logger.info(`Getting events by host id: ${hostId}`);
  const events = await prisma.event.findMany({
    where: { hosts: { some: { id: hostId } } },
    include: {
      hosts: true,
      guests: true,
    },
  });
  appAssert(events, NOT_FOUND, "No events found");

  const enrichedEvents = await Promise.all(
    events.map(async (event) => {
      return await eventResponse(event as Event);
    })
  );

  res.status(OK).json({ events: enrichedEvents });
});

export const getMyEventsHandler = catchError(async (req, res) => {
  const userId = req.userId;
  logger.info(`Getting events by user id: ${userId}`);
  const events = await prisma.event.findMany({
    where: { userId },
    include: {
      hosts: true,
      guests: true,
    },
  });

  const enrichedEvents = await Promise.all(
    events.map(async (event) => {
      return await eventResponse(event as Event);
    })
  );

  res.status(OK).json({ events: enrichedEvents });
});
