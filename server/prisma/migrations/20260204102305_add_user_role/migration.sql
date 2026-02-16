-- CreateEnum
CREATE TYPE "Role" AS ENUM ('user', 'doctor', 'admin');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'user';
