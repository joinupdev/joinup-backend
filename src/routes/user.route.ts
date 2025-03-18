import { Router } from "express";
import { getUserHandler } from "../controller/user.controller";

const userRouter = Router();

userRouter.get("/", getUserHandler);

export default userRouter;
