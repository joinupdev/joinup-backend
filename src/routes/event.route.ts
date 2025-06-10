import { Router } from "express";
import authenticate from "../middleware/authenticate";
import {
  createEventHandler,
  deleteEventHandler,
  getEventByIdHandler,
  getEventHandler,
  updateEventHandler,
  getEventsByHostIdHandler,
  getMyEventsHandler,
} from "../controller/event.controller";
import { handleImageUpload } from "../middleware/handleImages";
import {
  createSpeakerHandler,
  deleteSpeakerEventHandler,
  getSpeakerHandler,
  updateSpeakerHandler,
  getSpeakersHandler,
} from "../controller/speaker.event.controller";
const eventRouter = Router();

eventRouter.get("/", getEventHandler);
eventRouter.get("/host/:hostId", getEventsByHostIdHandler);
eventRouter.get("/me", authenticate,getMyEventsHandler);

eventRouter.post("/", authenticate, handleImageUpload, createEventHandler);
eventRouter.get("/:id", getEventByIdHandler);
eventRouter.put("/:id", authenticate, handleImageUpload, updateEventHandler);
eventRouter.delete("/:id", authenticate, deleteEventHandler);

eventRouter.get("/:id/speakers", getSpeakersHandler);
eventRouter.get("/:id/speaker/:speakerId", getSpeakerHandler);
eventRouter.post(
  "/:id/speaker",
  authenticate,
  handleImageUpload,
  createSpeakerHandler
);
eventRouter.put(
  "/:id/speaker/:speakerId",
  authenticate,
  handleImageUpload,
  updateSpeakerHandler
);
eventRouter.delete(
  "/:id/speaker/:speakerId",
  authenticate,
  deleteSpeakerEventHandler
);

export default eventRouter;
