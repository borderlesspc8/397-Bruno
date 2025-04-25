import { NextRequest, NextResponse } from "next/server";
import { validateSessionForAPI } from "@/app/_utils/auth";
import { GestaoClickService } from "@/app/_services/gestao-click-service";
import { prisma } from "@/app/_lib/prisma";

/**
 * Rota para importar dados do Gestão Click
 * 
 * Esta rota permite importar:
 * - Carteiras a partir de contas bancárias
 * - Carteiras a partir de centros de custo (como tipo diferente)
 * - Transações apenas para carteiras de contas bancárias
 * 
 * @param request Requisição Next.js
 * @returns Resposta com dados importados ou erro
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar sessão do usuário
    const session = await validateSessionForAPI();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { error: "Não autorizado: sessão inválida" },
        { status: 401 }
      );
    }

    // Obter parâmetros da requisição
    const body = await request.json();
    const { apiKey, secretToken, apiUrl } = body;

    // Validar parâmetros
    if (!apiKey || !secretToken || !apiUrl) {
      return NextResponse.json(
        { error: "Parâmetros inválidos: apiKey, secretToken e apiUrl são obrigatórios" },
        { status: 400 }
      );
    }

    // Criar entrada no histórico de importação (status inicial: IN_PROGRESS)
    const importHistory = await prisma.importHistory.create({
      data: {
        userId,
        source: "GESTAO_CLICK",
        status: "IN_PROGRESS",
        startTime: new Date(),
        totalTransactions: 0,
        importedTransactions: 0,
        skippedTransactions: 0,
        errorTransactions: 0,
        metadata: { 
          credentials: {
            apiKey: "***", // Não armazenar a chave real
            secretToken: "***", // Não armazenar o token real
            apiUrl: apiUrl
          }
        }
      }
    });

    console.log(`[API] Iniciando importação do Gestão Click para usuário ${userId} (ID: ${importHistory.id})`);

    // Criar serviço do Gestão Click
    const service = new GestaoClickService({
      apiKey,
      secretToken,
      apiUrl,
      userId
    });

    try {
      // Iniciar processo de importação
      const result = await service.importAllData();

      // Atualizar o histórico com sucesso
      await prisma.importHistory.update({
        where: { id: importHistory.id },
        data: {
          status: "COMPLETED",
          endTime: new Date(),
          totalTransactions: result.transactions.totalImported + result.transactions.skipped,
          importedTransactions: result.transactions.totalImported,
          skippedTransactions: result.transactions.skipped,
          errorTransactions: result.transactions.failed,
          metadata: {
            wallets: {
              fromAccounts: {
                created: result.wallets.fromAccounts.totalCreated,
                skipped: result.wallets.fromAccounts.skipped,
                total: result.wallets.fromAccounts.wallets.length
              },
              fromCostCenters: {
                created: result.wallets.fromCostCenters.totalCreated,
                skipped: result.wallets.fromCostCenters.skipped,
                total: result.wallets.fromCostCenters.wallets.length
              }
            },
            transactions: {
              total: result.transactions.totalImported + result.transactions.skipped + result.transactions.failed,
              imported: result.transactions.totalImported,
              skipped: result.transactions.skipped,
              failed: result.transactions.failed
            }
          }
        }
      });

      // Retornar resultado
      return NextResponse.json({
        success: true,
        importId: importHistory.id,
        data: result
      });
    } catch (error: any) {
      // Atualizar o histórico com falha
      await prisma.importHistory.update({
        where: { id: importHistory.id },
        data: {
          status: "FAILED",
          endTime: new Date(),
          error: error.message || "Erro desconhecido",
          metadata: {
            error: error.message || "Erro desconhecido",
            stack: error.stack
          }
        }
      });

      console.error("[API] Erro na importação do Gestão Click:", error);
      
      return NextResponse.json(
        { error: `Erro na importação: ${error.message}`, importId: importHistory.id },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("[API] Erro na API de importação do Gestão Click:", error);
    
    return NextResponse.json(
      { error: `Erro na importação: ${error.message}` },
      { status: 500 }
    );
  }
} 