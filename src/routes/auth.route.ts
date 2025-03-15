import { Router } from "express";
import { loginHandler, logoutHandler, refreshTokenHandler, registerHandler, verifyEmailHandler } from "../controller/auth.controller";

const authRouter = Router();

authRouter.post("/register", registerHandler);
authRouter.post("/login", loginHandler);
authRouter.get("/logout", logoutHandler);
authRouter.get("/refresh", refreshTokenHandler);
authRouter.get("/email/verify/:code", verifyEmailHandler);


export default authRouter;