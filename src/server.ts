import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import { connectToDatabase } from "./config/db";
import { PORT, FRONTEND_ORIGIN } from "./constants/env";
import errorHandler from "./middleware/errorHandler";
import { OK } from "./constants/http";
import authRouter from "./routes/auth.route";
import authenticate from "./middleware/authenticate";
import userRouter from "./routes/user.route";
import sessionRouter from "./routes/session.route";
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    credentials: true,
  })
);
app.use(cookieParser());

app.get("/", (req, res) => {
  res.status(OK).json({ status: "ok" });
});

app.use("/auth", authRouter);

// protected routes
app.use("/user", authenticate, userRouter);
app.use("/session", authenticate, sessionRouter);

// Catch all errors that are not caught by the route handlers
app.use(errorHandler);

app.listen(PORT, async () => {
  await connectToDatabase();
  console.log(`Server is running on port ${PORT}`);
});
