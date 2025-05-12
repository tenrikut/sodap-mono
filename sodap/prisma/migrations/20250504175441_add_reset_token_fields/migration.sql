-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('super_root_admin', 'platform_admin', 'store_owner', 'store_admin', 'end_user');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'end_user',
    "walletAddress" TEXT,
    "resetToken" TEXT,
    "resetTokenExpiry" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoreOwner" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoreOwner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoreAdmin" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoreAdmin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EndUser" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "loyaltyBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "preferredStore" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EndUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Store" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "ownerId" TEXT NOT NULL,
    "walletAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Store_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "storeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "StoreOwner_userId_key" ON "StoreOwner"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "StoreAdmin_userId_key" ON "StoreAdmin"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "EndUser_userId_key" ON "EndUser"("userId");

-- AddForeignKey
ALTER TABLE "StoreOwner" ADD CONSTRAINT "StoreOwner_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreAdmin" ADD CONSTRAINT "StoreAdmin_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreAdmin" ADD CONSTRAINT "StoreAdmin_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EndUser" ADD CONSTRAINT "EndUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Store" ADD CONSTRAINT "Store_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "StoreOwner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
