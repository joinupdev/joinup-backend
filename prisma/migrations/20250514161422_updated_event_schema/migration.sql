/*
  Warnings:

  - You are about to drop the column `hostId` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Speaker` table. All the data in the column will be lost.
  - Added the required column `mode` to the `Event` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `Speaker` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "SpeakerType" AS ENUM ('Host', 'Speaker');

-- DropForeignKey
ALTER TABLE "Event" DROP CONSTRAINT "Event_hostId_fkey";

-- AlterTable
ALTER TABLE "Event" DROP COLUMN "hostId",
DROP COLUMN "location",
ADD COLUMN     "IFSCCode" TEXT,
ADD COLUMN     "accountName" TEXT,
ADD COLUMN     "accountNumber" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "mode" "LocationType" NOT NULL,
ADD COLUMN     "poster" TEXT,
ADD COLUMN     "userId" TEXT;

-- AlterTable
ALTER TABLE "Speaker" DROP COLUMN "description",
ADD COLUMN     "avatar" TEXT,
ADD COLUMN     "profession" "Profession",
ADD COLUMN     "type" "SpeakerType" NOT NULL;

-- CreateTable
CREATE TABLE "_EventHost" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_EventHost_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_EventSpeakers" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_EventSpeakers_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_EventHost_B_index" ON "_EventHost"("B");

-- CreateIndex
CREATE INDEX "_EventSpeakers_B_index" ON "_EventSpeakers"("B");

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EventHost" ADD CONSTRAINT "_EventHost_A_fkey" FOREIGN KEY ("A") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EventHost" ADD CONSTRAINT "_EventHost_B_fkey" FOREIGN KEY ("B") REFERENCES "Speaker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EventSpeakers" ADD CONSTRAINT "_EventSpeakers_A_fkey" FOREIGN KEY ("A") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EventSpeakers" ADD CONSTRAINT "_EventSpeakers_B_fkey" FOREIGN KEY ("B") REFERENCES "Speaker"("id") ON DELETE CASCADE ON UPDATE CASCADE;
