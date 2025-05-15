import { Router } from "express";
import authenticate from "../middleware/authenticate";
import { createEventHandler, deleteEventHandler, getEventByIdHandler, getEventHandler, updateEventHandler } from "../controller/event.controller";
const eventRouter = Router();

eventRouter.get("/", getEventHandler);

eventRouter.post("/", authenticate, createEventHandler);
eventRouter.get("/:id", getEventByIdHandler);
eventRouter.put("/:id", authenticate, updateEventHandler);
eventRouter.delete("/:id", authenticate, deleteEventHandler);

export default eventRouter;