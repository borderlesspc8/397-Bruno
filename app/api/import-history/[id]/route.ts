import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/_lib/auth";
import { ImportHistoryService } from "@/app/_services/import-history-service";
import { prisma } from "@/app/_lib/prisma";

/**
 * API para obter detalhes de uma importação específica
 */
const importHistoryService = new ImportHistoryService();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticação
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { message: "Para ver detalhes da importação, você precisa estar autenticado." },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const id = params.id;

    // Buscar importação no banco de dados
    const importHistory = await importHistoryService.getImportDetails(id, userId);

    if (!importHistory) {
      return NextResponse.json(
        { message: "Registro de importação não encontrado." },
        { status: 404 }
      );
    }

    // Buscar detalhes adicionais como transações
    const transactions = await prisma.transaction.findMany({
      where: {
        metadata: {
          path: ["importId"],
          equals: id,
        },
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 100,
      select: {
        id: true,
        name: true,
        amount: true,
        date: true,
        type: true,
        category: true,
        status: true,
        createdAt: true,
      },
    });

    // Calcular porcentagem de progresso com base no status e contadores
    let progressPercentage = 0;
    const { totalTransactions, importedTransactions, skippedTransactions, errorTransactions } = importHistory;
    
    switch (importHistory.status) {
      case "PENDING":
        progressPercentage = 5;
        break;
      case "IN_PROGRESS":
        if (totalTransactions === 0) {
          // Ainda importando carteiras/estrutura, estimar em 25%
          progressPercentage = 25;
        } else {
          // Calcular com base nas transações processadas
          const processedTransactions = (importedTransactions || 0) + 
                                       (skippedTransactions || 0) + 
                                       (errorTransactions || 0);
          const ratio = totalTransactions > 0 
            ? processedTransactions / totalTransactions 
            : 0;
          
          // Entre 25% e 95%
          progressPercentage = 25 + (ratio * 70);
        }
        break;
      case "COMPLETED":
        progressPercentage = 100;
        break;
      case "FAILED":
      case "CANCELLED":
        // Se houver transações processadas, calcular o progresso atingido
        if (totalTransactions > 0) {
          const processedTransactions = (importedTransactions || 0) + 
                                      (skippedTransactions || 0) + 
                                      (errorTransactions || 0);
          const ratio = processedTransactions / totalTransactions;
          progressPercentage = Math.min(95, 25 + (ratio * 70));
        }
        break;
    }
    
    // Formatar resposta
    const response = {
      import: {
        ...importHistory,
        progress: Math.round(progressPercentage),
      },
      transactions,
      metadata: {
        transactionsProcessed: (importedTransactions || 0) + (skippedTransactions || 0),
        totalTransactions: totalTransactions || 0,
        progress: Math.round(progressPercentage),
        status: importHistory.status,
      }
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Erro ao buscar detalhes da importação:", error);
    return NextResponse.json(
      { message: `Erro ao buscar detalhes: ${error.message}` },
      { status: 500 }
    );
  }
}

/**
 * API para cancelar uma importação em andamento
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticação
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { message: "Para cancelar a importação, você precisa estar autenticado." },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const id = params.id;
    const data = await request.json();
    const { action } = data;

    if (action !== "cancel") {
      return NextResponse.json(
        { message: "Ação não suportada." },
        { status: 400 }
      );
    }

    // Buscar importação no banco de dados
    const importHistory = await importHistoryService.getImportDetails(id, userId);

    if (!importHistory) {
      return NextResponse.json(
        { message: "Registro de importação não encontrado." },
        { status: 404 }
      );
    }

    // Verificar se o status atual permite cancelamento
    if (importHistory.status !== "IN_PROGRESS" && importHistory.status !== "PENDING") {
      return NextResponse.json(
        { message: "Só é possível cancelar importações que estão em andamento ou pendentes." },
        { status: 400 }
      );
    }

    // Atualizar o status para cancelado
    const updatedImport = await importHistoryService.updateImportStatus(
      id, 
      "CANCELLED" as any,
      {
        endTime: new Date(),
      }
    );

    return NextResponse.json({
      import: updatedImport,
      metadata: {
        status: "CANCELLED",
        message: "Importação cancelada com sucesso"
      }
    });
  } catch (error: any) {
    console.error("Erro ao cancelar importação:", error);
    return NextResponse.json(
      { message: `Erro ao cancelar importação: ${error.message}` },
      { status: 500 }
    );
  }
} 