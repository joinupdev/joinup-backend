/*
  Warnings:

  - The values [Both] on the enum `EventCategory` will be removed. If these variants are still used in the database, this will fail.
  - The values [Webinar,Bootcamp] on the enum `EventType` will be removed. If these variants are still used in the database, this will fail.
  - The values [Card] on the enum `PaymentMethod` will be removed. If these variants are still used in the database, this will fail.
  - The values [Working] on the enum `Profession` will be removed. If these variants are still used in the database, this will fail.
  - The values [Speaker] on the enum `SpeakerType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the `_EventSpeakers` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "EventCategory_new" AS ENUM ('Design', 'Development', 'Founders');
ALTER TABLE "Event" ALTER COLUMN "category" TYPE "EventCategory_new" USING ("category"::text::"EventCategory_new");
ALTER TYPE "EventCategory" RENAME TO "EventCategory_old";
ALTER TYPE "EventCategory_new" RENAME TO "EventCategory";
DROP TYPE "EventCategory_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "EventType_new" AS ENUM ('Meetup', 'Conference', 'Workshop', 'Hackathon', 'CoWorking');
ALTER TABLE "Event" ALTER COLUMN "type" TYPE "EventType_new" USING ("type"::text::"EventType_new");
ALTER TYPE "EventType" RENAME TO "EventType_old";
ALTER TYPE "EventType_new" RENAME TO "EventType";
DROP TYPE "EventType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "PaymentMethod_new" AS ENUM ('UPI', 'CreditCard', 'DebitCard', 'BankTransfer');
ALTER TABLE "Booking" ALTER COLUMN "paymentMethod" TYPE "PaymentMethod_new" USING ("paymentMethod"::text::"PaymentMethod_new");
ALTER TYPE "PaymentMethod" RENAME TO "PaymentMethod_old";
ALTER TYPE "PaymentMethod_new" RENAME TO "PaymentMethod";
DROP TYPE "PaymentMethod_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "Profession_new" AS ENUM ('Student', 'Professional');
ALTER TABLE "UserProfile" ALTER COLUMN "profession" TYPE "Profession_new" USING ("profession"::text::"Profession_new");
ALTER TABLE "Speaker" ALTER COLUMN "profession" TYPE "Profession_new" USING ("profession"::text::"Profession_new");
ALTER TYPE "Profession" RENAME TO "Profession_old";
ALTER TYPE "Profession_new" RENAME TO "Profession";
DROP TYPE "Profession_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "SpeakerType_new" AS ENUM ('Host', 'Guest');
ALTER TABLE "Speaker" ALTER COLUMN "type" TYPE "SpeakerType_new" USING ("type"::text::"SpeakerType_new");
ALTER TYPE "SpeakerType" RENAME TO "SpeakerType_old";
ALTER TYPE "SpeakerType_new" RENAME TO "SpeakerType";
DROP TYPE "SpeakerType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "_EventSpeakers" DROP CONSTRAINT "_EventSpeakers_A_fkey";

-- DropForeignKey
ALTER TABLE "_EventSpeakers" DROP CONSTRAINT "_EventSpeakers_B_fkey";

-- DropTable
DROP TABLE "_EventSpeakers";

-- CreateTable
CREATE TABLE "_EventGuests" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_EventGuests_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_EventGuests_B_index" ON "_EventGuests"("B");

-- AddForeignKey
ALTER TABLE "_EventGuests" ADD CONSTRAINT "_EventGuests_A_fkey" FOREIGN KEY ("A") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EventGuests" ADD CONSTRAINT "_EventGuests_B_fkey" FOREIGN KEY ("B") REFERENCES "Speaker"("id") ON DELETE CASCADE ON UPDATE CASCADE;
