import prisma from "../config/db";
import { NOT_FOUND, OK } from "../constants/http";
import appAssert from "../utils/appAssert";
import catchError from "../utils/catchError";
import { z } from "zod";
export const getSessionHandler = catchError(async (req, res) => {
  const { userId, sessionId } = req;

  const sessions = await prisma.session.findMany({
    where: {
      userId,
      expiresAt: {
        gt: new Date(),
      },
    },
    orderBy: {
      expiresAt: "desc",
    },
  });

  res.status(OK).json(
    sessions.map((session) => ({
        ...session,
        ...(
            session.id === sessionId && {
            isCurrent: true,
          }
        ),
    }))
  );
});

export const deleteSessionHandler = catchError(async (req, res) => {
  const sessionId = z.string().uuid().parse(req.params.id);
  const { userId } = req;
  const deletedSession = await prisma.session.delete({
    where: {
      id: sessionId,
      userId,
    },
  });
  appAssert(deletedSession, NOT_FOUND, "Session not found");

  res.status(OK).json({
    message: "Session deleted",
  });
});
