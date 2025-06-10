import { Router } from "express";
import { getPlacesHandler } from "../controller/location.controller";

const locationRouter = Router();

locationRouter.get("/", getPlacesHandler);

export default locationRouter;