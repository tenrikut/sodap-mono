/*
  Warnings:

  - You are about to drop the column `resetToken` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `resetTokenExpiry` on the `User` table. All the data in the column will be lost.
  - The `role` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[verificationToken]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "resetToken",
DROP COLUMN "resetTokenExpiry",
ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "storeId" TEXT,
ADD COLUMN     "verificationToken" TEXT,
ADD COLUMN     "verificationTokenExpiry" TIMESTAMP(3),
DROP COLUMN "role",
ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'USER';

-- CreateIndex
CREATE UNIQUE INDEX "User_verificationToken_key" ON "User"("verificationToken");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE;
