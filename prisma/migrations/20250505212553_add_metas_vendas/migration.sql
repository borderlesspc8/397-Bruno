/*
  Warnings:

  - You are about to drop the column `stripeCustomerId` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "stripeCustomerId";

-- CreateTable
CREATE TABLE "metas_vendas" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mesReferencia" TIMESTAMP(3) NOT NULL,
    "metaMensal" DOUBLE PRECISION NOT NULL,
    "metaSalvio" DOUBLE PRECISION NOT NULL,
    "metaCoordenador" DOUBLE PRECISION NOT NULL,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "metas_vendas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "metas_vendas_userId_idx" ON "metas_vendas"("userId");

-- CreateIndex
CREATE INDEX "metas_vendas_mesReferencia_idx" ON "metas_vendas"("mesReferencia");

-- CreateIndex
CREATE UNIQUE INDEX "metas_vendas_userId_mesReferencia_key" ON "metas_vendas"("userId", "mesReferencia");

-- AddForeignKey
ALTER TABLE "metas_vendas" ADD CONSTRAINT "metas_vendas_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
