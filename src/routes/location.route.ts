import { Router } from "express";
import { getCitiesHandler, getPlacesHandler } from "../controller/location.controller";

const locationRouter = Router();

locationRouter.get("/", getPlacesHandler);

locationRouter.get("/city", getCitiesHandler);

export default locationRouter;