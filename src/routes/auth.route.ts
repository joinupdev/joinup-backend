import { Router } from "express";
import { forgotPasswordHandler, loginHandler, logoutHandler, refreshTokenHandler, registerHandler, resetPasswordHandler, verifyEmailHandler } from "../controller/auth.controller";

const authRouter = Router();

authRouter.post("/register", registerHandler);
authRouter.post("/login", loginHandler);
authRouter.get("/logout", logoutHandler);
authRouter.get("/refresh", refreshTokenHandler);
authRouter.get("/email/verify/:code", verifyEmailHandler);
authRouter.post("/password/forgot", forgotPasswordHandler);
authRouter.post("/password/reset", resetPasswordHandler);

export default authRouter;