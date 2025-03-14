import { Router } from "express";
import { loginHandler, registerHandler } from "../controller/auth.controller";

const authRouter = Router();

authRouter.post("/register", registerHandler);
authRouter.post("/login", loginHandler);
// authRouter.post("/logout", logoutHandler);
// authRouter.post("/refresh-token", refreshTokenHandler);


export default authRouter;