-- AlterTable
ALTER TABLE "Book" ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "pageCount" INTEGER,
ADD COLUMN     "pages" TEXT[];
