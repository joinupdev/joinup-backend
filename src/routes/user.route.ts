import { Router } from "express";
import {
  getUserHandler,
  getUserProfileHandler,
  updateUserHandler,
  updateUserProfileHandler,
} from "../controller/user.controller";

const userRouter = Router();

userRouter.get("/", getUserHandler);
userRouter.put("/", updateUserHandler);

userRouter.get("/profile", getUserProfileHandler);
userRouter.put("/profile", updateUserProfileHandler);

export default userRouter;
