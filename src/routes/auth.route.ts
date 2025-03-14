import { Router } from "express";
import { registerHandler } from "../controller/auth.controller";

const authRouter = Router();

authRouter.post("/register", registerHandler);
// authRouter.post("/login", loginHandler);
// authRouter.post("/logout", logoutHandler);
// authRouter.post("/refresh-token", refreshTokenHandler);


export default authRouter;