/*
  Warnings:

  - The primary key for the `Category` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Category` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Image` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Image` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `userId` on the `Listing` table. All the data in the column will be lost.
  - The primary key for the `_CategoryToListing` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Changed the type of `A` on the `_CategoryToListing` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "public"."Listing" DROP CONSTRAINT "Listing_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."_CategoryToListing" DROP CONSTRAINT "_CategoryToListing_A_fkey";

-- AlterTable
ALTER TABLE "Category" DROP CONSTRAINT "Category_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Category_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Image" DROP CONSTRAINT "Image_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Image_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Listing" DROP COLUMN "userId";

-- AlterTable
ALTER TABLE "_CategoryToListing" DROP CONSTRAINT "_CategoryToListing_AB_pkey",
DROP COLUMN "A",
ADD COLUMN     "A" INTEGER NOT NULL,
ADD CONSTRAINT "_CategoryToListing_AB_pkey" PRIMARY KEY ("A", "B");

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CategoryToListing" ADD CONSTRAINT "_CategoryToListing_A_fkey" FOREIGN KEY ("A") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
