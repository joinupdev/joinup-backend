import { Router } from "express";
import {
  getUserHandler,
  getUserProfileHandler,
  updateUserHandler,
  updateUserProfileHandler,
} from "../controller/user.controller";
import { handleImageUpload } from "../middleware/handleImages";

const userRouter = Router();

userRouter.get("/", getUserHandler);
userRouter.put("/", updateUserHandler);

userRouter.get("/profile", getUserProfileHandler);
userRouter.put("/profile", handleImageUpload, updateUserProfileHandler);

export default userRouter;
