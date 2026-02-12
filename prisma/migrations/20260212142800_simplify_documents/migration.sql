/*
  Warnings:

  - You are about to drop the column `main_photo_url` on the `cars` table. All the data in the column will be lost.
  - You are about to drop the column `document_name` on the `visit_documents` table. All the data in the column will be lost.
  - You are about to drop the column `document_url` on the `visit_documents` table. All the data in the column will be lost.
  - You are about to drop the `car_documents` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `car_photos` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `visit_photos` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `file_name` to the `visit_documents` table without a default value. This is not possible if the table is not empty.
  - Added the required column `file_size` to the `visit_documents` table without a default value. This is not possible if the table is not empty.
  - Added the required column `file_url` to the `visit_documents` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mime_type` to the `visit_documents` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "car_documents" DROP CONSTRAINT "car_documents_car_id_fkey";

-- DropForeignKey
ALTER TABLE "car_photos" DROP CONSTRAINT "car_photos_car_id_fkey";

-- DropForeignKey
ALTER TABLE "visit_photos" DROP CONSTRAINT "visit_photos_visit_id_fkey";

-- AlterTable
ALTER TABLE "cars" DROP COLUMN "main_photo_url";

-- AlterTable
ALTER TABLE "visit_documents" DROP COLUMN "document_name",
DROP COLUMN "document_url",
ADD COLUMN     "file_name" TEXT NOT NULL,
ADD COLUMN     "file_size" INTEGER NOT NULL,
ADD COLUMN     "file_url" TEXT NOT NULL,
ADD COLUMN     "mime_type" TEXT NOT NULL;

-- DropTable
DROP TABLE "car_documents";

-- DropTable
DROP TABLE "car_photos";

-- DropTable
DROP TABLE "visit_photos";

-- DropEnum
DROP TYPE "PhotoType";
