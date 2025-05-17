/*
  Warnings:

  - The `profession` column on the `Speaker` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Speaker" DROP COLUMN "profession",
ADD COLUMN     "profession" TEXT;
