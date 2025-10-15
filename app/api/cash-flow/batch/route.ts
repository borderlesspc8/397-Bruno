import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/app/_lib/supabase-server";
import { CashFlowPredictionSource, InstallmentStatus, TransactionType } from "@/app/_types/transaction";

export async function POST(req: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Não autorizado" },
        { status: 401 }
      );
    }

    // Obter dados do corpo da requisição
    const data = await req.json();
    const { predictions } = data;

    if (!predictions || !Array.isArray(predictions) || predictions.length === 0) {
      return NextResponse.json(
        { message: "Nenhuma previsão fornecida" },
        { status: 400 }
      );
    }

    // Validar número máximo de previsões por requisição
    if (predictions.length > 100) {
      return NextResponse.json(
        { message: "Número máximo de previsões por requisição é 100" },
        { status: 400 }
      );
    }

    // Validar carteira para cada previsão
    const walletIds = new Set(predictions.map(p => p.walletId).filter(Boolean));
    if (walletIds.size > 0) {
      const wallets = await prisma.wallet.findMany({
        where: {
          id: { in: Array.from(walletIds) },
          userId: session.user.id
        },
        select: { id: true }
      });

      const foundWalletIds = new Set(wallets.map(w => w.id));
      const missingWalletIds = Array.from(walletIds).filter(id => !foundWalletIds.has(id as string));

      if (missingWalletIds.length > 0) {
        return NextResponse.json(
          { message: `Carteiras inválidas: ${missingWalletIds.join(', ')}` },
          { status: 400 }
        );
      }
    }

    // Mapear previsões para o formato do banco de dados
    const predictionsToCreate = predictions.map(prediction => {
      // Validação básica
      if (!prediction.description || !prediction.amount || !prediction.date) {
        throw new Error("Todas as previsões precisam ter descrição, valor e data");
      }

      // Verificar se é um formato de data válido
      const date = new Date(prediction.date);
      if (isNaN(date.getTime())) {
        throw new Error(`Data inválida: ${prediction.date}`);
      }

      // Estruturar dados para criação
      return {
        userId: session.user.id,
        walletId: prediction.walletId,
        description: prediction.description,
        amount: parseFloat(prediction.amount.toString()),
        date,
        type: prediction.type || "INCOME",
        category: prediction.category || "OTHERS",
        source: prediction.source || CashFlowPredictionSource.MANUAL,
        probability: prediction.probability || 1.0,
        metadata: {
          ...(prediction.installmentInfo ? {
            installmentInfo: {
              saleId: prediction.installmentInfo.saleId,
              installmentNumber: prediction.installmentInfo.installmentNumber,
              totalInstallments: prediction.installmentInfo.totalInstallments,
              status: prediction.installmentInfo.status || InstallmentStatus.PENDING,
              originalDueDate: prediction.installmentInfo.originalDueDate
            }
          } : {}),
          createdAt: new Date(),
          createdBy: session.user.id,
          createdMethod: "API_BATCH"
        }
      };
    });

    // Criar as previsões no banco de dados
    const createdPredictions = await prisma.cashFlowPrediction.createMany({
      data: predictionsToCreate
    });

    return NextResponse.json({
      message: `${createdPredictions.count} previsões criadas com sucesso`,
      count: createdPredictions.count
    }, { status: 201 });
  } catch (error) {
    console.error("[API] Erro ao criar previsões em lote:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Erro ao processar previsões" },
      { status: 500 }
    );
  }
} 
