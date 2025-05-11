import { PrismaClient } from "@prisma/client";
import logger from "./logger";
const prisma = new PrismaClient();

// Connect to the database
export async function connectToDatabase() {
  try {
    await prisma.$connect();
    logger.info("Connected to the database");
  } catch (e) {
    logger.error(`Could not connect to the database ${e}`);
    process.exit(1);
  }
}

export default prisma;
