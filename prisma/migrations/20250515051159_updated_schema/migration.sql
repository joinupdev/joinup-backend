/*
  Warnings:

  - You are about to drop the column `city` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `faq` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `mode` on the `Event` table. All the data in the column will be lost.
  - The `ticketPrice` column on the `Event` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `mobileNo` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `github` on the `UserProfile` table. All the data in the column will be lost.
  - You are about to drop the column `linkedin` on the `UserProfile` table. All the data in the column will be lost.
  - You are about to drop the column `linkedinVisibility` on the `UserProfile` table. All the data in the column will be lost.
  - You are about to drop the column `twitter` on the `UserProfile` table. All the data in the column will be lost.
  - You are about to drop the column `website` on the `UserProfile` table. All the data in the column will be lost.
  - Added the required column `price` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `location` to the `Event` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "SocialLinkType" AS ENUM ('LinkedIn', 'Twitter', 'GitHub', 'Website', 'Instagram', 'Facebook', 'Peerlist');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('UPI', 'Card', 'BankTransfer');

-- AlterEnum
ALTER TYPE "EventCategory" ADD VALUE 'Founders';

-- AlterEnum
ALTER TYPE "JobTitle" ADD VALUE 'Founder';

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "paymentMethod" "PaymentMethod",
ADD COLUMN     "price" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "razorpayOrderId" TEXT;

-- AlterTable
ALTER TABLE "Event" DROP COLUMN "city",
DROP COLUMN "faq",
DROP COLUMN "mode",
ADD COLUMN     "location" "LocationType" NOT NULL,
DROP COLUMN "ticketPrice",
ADD COLUMN     "ticketPrice" DOUBLE PRECISION[];

-- AlterTable
ALTER TABLE "Speaker" ADD COLUMN     "twitter" TEXT;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "mobileNo";

-- AlterTable
ALTER TABLE "UserProfile" DROP COLUMN "github",
DROP COLUMN "linkedin",
DROP COLUMN "linkedinVisibility",
DROP COLUMN "twitter",
DROP COLUMN "website",
ADD COLUMN     "phoneNumber" TEXT;

-- CreateTable
CREATE TABLE "SocialLink" (
    "id" TEXT NOT NULL,
    "type" "SocialLinkType" NOT NULL,
    "link" TEXT NOT NULL,
    "isVisible" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,

    CONSTRAINT "SocialLink_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SocialLink" ADD CONSTRAINT "SocialLink_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
