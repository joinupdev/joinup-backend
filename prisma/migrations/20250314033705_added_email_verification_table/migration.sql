-- CreateEnum
CREATE TYPE "VerificationCodeType" AS ENUM ('Email_Verification', 'Password_Reset', 'Mobile_Verification');

-- CreateTable
CREATE TABLE "verificationCode" (
    "id" TEXT NOT NULL,
    "type" "VerificationCodeType" NOT NULL,
    "code" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verificationCode_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "verificationCode" ADD CONSTRAINT "verificationCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
