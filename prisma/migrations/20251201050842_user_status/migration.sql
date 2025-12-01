-- CreateEnum
CREATE TYPE "UserStatusType" AS ENUM ('ACTIVE', 'SUSPENDED', 'BANNED');

-- CreateTable
CREATE TABLE "UserStatus" (
    "id" SERIAL NOT NULL,
    "status" "UserStatusType" NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserStatus_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "UserStatus" ADD CONSTRAINT "UserStatus_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
