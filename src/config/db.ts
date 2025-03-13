import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// Connect to the database
export async function connectToDatabase() {
  try {
    await prisma.$connect();
    console.log("Connected to the database");
  } catch (e) {
    console.log("Could not connect to the database", e);
    process.exit(1);
  }
}

export default prisma;
