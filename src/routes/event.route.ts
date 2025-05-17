import { Router } from "express";
import authenticate from "../middleware/authenticate";
import { createEventHandler, deleteEventHandler, getEventByIdHandler, getEventHandler, updateEventHandler } from "../controller/event.controller";
import { handleImageUpload } from "../middleware/handleImages";
const eventRouter = Router();

eventRouter.get("/", getEventHandler);

eventRouter.post("/", authenticate, handleImageUpload, createEventHandler);
eventRouter.get("/:id", getEventByIdHandler);
eventRouter.put("/:id", authenticate, handleImageUpload, updateEventHandler);
eventRouter.delete("/:id", authenticate, deleteEventHandler);

export default eventRouter;