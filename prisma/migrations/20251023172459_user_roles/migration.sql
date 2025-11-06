-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('ADMIN', 'STUDENT', 'FACULTY');

-- AlterTable
ALTER TABLE "public"."user" ADD COLUMN     "roles" "public"."UserRole"[];
