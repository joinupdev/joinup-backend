import prisma from "../config/db";
import { NOT_FOUND, OK } from "../constants/http";
import appAssert from "../utils/appAssert";
import catchError from "../utils/catchError";

export const getUserHandler = catchError(
    async (req, res) => {
        const user = await prisma.user.findUnique({
            where: {
                id: req.userId,
            },
        });

        appAssert(user, NOT_FOUND, "User not found");

        const { password, ...userWithoutPassword } = user;
        res.status(OK).json(userWithoutPassword);
    }
)