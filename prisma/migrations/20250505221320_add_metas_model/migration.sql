/*
  Warnings:

  - You are about to drop the `metas_vendas` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "metas_vendas" DROP CONSTRAINT "metas_vendas_userId_fkey";

-- DropTable
DROP TABLE "metas_vendas";

-- CreateTable
CREATE TABLE "Meta" (
    "id" TEXT NOT NULL,
    "mesReferencia" TIMESTAMP(3) NOT NULL,
    "metaMensal" DOUBLE PRECISION NOT NULL,
    "metaSalvio" DOUBLE PRECISION NOT NULL,
    "metaCoordenador" DOUBLE PRECISION NOT NULL,
    "criadoPor" TEXT NOT NULL,
    "atualizadoPor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Meta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Meta_mesReferencia_idx" ON "Meta"("mesReferencia");
