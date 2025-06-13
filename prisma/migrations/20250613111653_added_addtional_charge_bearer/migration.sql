-- CreateEnum
CREATE TYPE "ChargeBearer" AS ENUM ('Attendee', 'Organizer');

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "additionalChargeBearer" "ChargeBearer" DEFAULT 'Attendee';
