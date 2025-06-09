-- CreateEnum
CREATE TYPE "ApprovalType" AS ENUM ('Manual', 'Auto');

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "approvalType" "ApprovalType" NOT NULL DEFAULT 'Auto';
