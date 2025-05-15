import { OK } from "../constants/http";
import logger from "../config/logger";
import catchError from "../utils/catchError";

const getEventHandler = catchError(async (req, res) => {
  const profession = req.query.profession as string;
  const location = req.query.location as string;
  const eventType = req.query.eventType as string;
  logger.info(`Getting events by profession: ${profession}, location: ${location}, event type: ${eventType}`);
  res.status(OK).json({ message: "Events fetched successfully" });
});

const createEventHandler = catchError(async (req, res) => {
  logger.info("Creating event");
  res.status(OK).json({ message: "Event created successfully" });
});

const getEventByIdHandler = catchError(async (req, res) => {
  const { id } = req.params;
  logger.info(`Getting event by id: ${id}`);
  res.status(OK).json({ message: "Event fetched successfully" });
});

const updateEventHandler = catchError(async (req, res) => {
  const { id } = req.params;
  logger.info(`Updating event by id: ${id}`);
  res.status(OK).json({ message: "Event updated successfully" });
});

const deleteEventHandler = catchError(async (req, res) => {
  const { id } = req.params;
  logger.info(`Deleting event by id: ${id}`);
  res.status(OK).json({ message: "Event deleted successfully" });
});

export { getEventHandler, createEventHandler, getEventByIdHandler, updateEventHandler, deleteEventHandler };
