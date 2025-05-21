/*
  Warnings:

  - The `jobTitle` column on the `UserProfile` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "UserProfile" DROP COLUMN "jobTitle",
ADD COLUMN     "jobTitle" TEXT;
