import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/app/_lib/auth";
import { db } from "@/app/_lib/db";
import { GestaoClickClientService } from "@/app/_services/gestao-click-client-service";
import { ReconciliationService } from "@/app/_services/reconciliation-service";
import { parse, parseISO } from "date-fns";
import { Prisma } from "@prisma/client";

/**
 * API para conciliar transações com vendas do Gestão Click
 */

// Marcador para garantir comportamento dinâmico
export const dynamic = "force-dynamic";

/**
 * POST /api/transactions/conciliate
 * Concilia uma transação com uma venda do Gestão Click
 */
export async function POST(req: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    // Extrair dados do request
    const data = await req.json();
    const { transactionId, salesId, installmentId } = data;

    if (!transactionId || !salesId) {
      return NextResponse.json(
        { error: "IDs de transação e venda são obrigatórios" },
        { status: 400 }
      );
    }

    // Verificar se a transação existe e pertence ao usuário
    const transaction = await db.transaction.findFirst({
      where: {
        id: transactionId,
        userId: session.user.id,
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: "Transação não encontrada" },
        { status: 404 }
      );
    }

    // Verificar se a venda existe e pertence ao usuário
    const sale = await db.sales_records.findFirst({
      where: {
        id: salesId,
        userId: session.user.id,
      },
    });

    if (!sale) {
      return NextResponse.json(
        { error: "Venda não encontrada" },
        { status: 404 }
      );
    }

    // Verificar se já existe uma conciliação para esta transação
    const existingConciliation = await db.sales_transaction.findFirst({
      where: {
        transactionId,
      },
    });

    if (existingConciliation) {
      return NextResponse.json(
        { error: "Esta transação já está conciliada com outra venda" },
        { status: 400 }
      );
    }

    // Criar a conciliação
    const conciliation = await db.sales_transaction.create({
      data: {
        transactionId,
        salesRecordId: salesId,
        installmentId: installmentId || null,
        metadata: {
          reconciliationDate: new Date().toISOString(),
          manualReconciliation: true
        }
      } as any
    });

    return NextResponse.json({
      message: "Conciliação criada com sucesso",
      data: conciliation,
    });
  } catch (error) {
    console.error("Erro ao criar conciliação:", error);
    return NextResponse.json(
      { error: "Erro ao processar requisição" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/transactions/conciliate
 * Remove a conciliação entre uma transação e uma venda
 */
export async function DELETE(req: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    // Extrair dados do request
    const data = await req.json();
    const { transactionId, salesId } = data;

    if (!transactionId || !salesId) {
      return NextResponse.json(
        { error: "IDs de transação e venda são obrigatórios" },
        { status: 400 }
      );
    }

    // Verificar se a transação existe e pertence ao usuário
    const transaction = await db.transaction.findFirst({
      where: {
        id: transactionId,
        userId: session.user.id,
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: "Transação não encontrada" },
        { status: 404 }
      );
    }

    // Buscar a conciliação
    const conciliation = await db.sales_transaction.findFirst({
      where: {
        transactionId,
        salesRecordId: salesId,
      },
    });

    if (!conciliation) {
      return NextResponse.json(
        { error: "Conciliação não encontrada" },
        { status: 404 }
      );
    }

    // Remover a conciliação
    await db.sales_transaction.delete({
      where: {
        id: conciliation.id,
      },
    });

    return NextResponse.json({
      message: "Conciliação removida com sucesso",
    });
  } catch (error) {
    console.error("Erro ao remover conciliação:", error);
    return NextResponse.json(
      { error: "Erro ao processar requisição" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/transactions/conciliate/import
 * Importa vendas do Gestão Click para o banco de dados para conciliação
 */
export async function PUT(req: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    // Extrair dados do request
    const data = await req.json();
    const { startDate, endDate, situationId, autoReconcile = false } = data;

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "Datas de início e fim são obrigatórias" },
        { status: 400 }
      );
    }

    // Configurar o serviço do Gestão Click
    const accessToken = process.env.GESTAO_CLICK_ACCESS_TOKEN || '';
    const secretAccessToken = process.env.GESTAO_CLICK_SECRET_ACCESS_TOKEN || '';
    const apiUrl = process.env.GESTAO_CLICK_API_URL || 'https://api.beteltecnologia.com';

    if (!accessToken) {
      return NextResponse.json(
        { error: "Credenciais do Gestão Click não configuradas" },
        { status: 500 }
      );
    }

    // Inicializar o serviço
    const gestaoClickService = new GestaoClickClientService({
      apiKey: accessToken,
      secretToken: secretAccessToken,
      apiUrl,
      userId: session.user.id,
    });

    // Definir filtros para a importação
    const filtros: any = {};
    if (situationId) {
      filtros.situacao_id = situationId;
    }

    // Importar vendas
    const importResult = await gestaoClickService.importVendas(
      startDate,
      endDate,
      filtros
    );

    // Se autoReconcile estiver habilitado, executar a reconciliação automática
    let reconciliationResult = null;
    if (autoReconcile && importResult.imported > 0) {
      try {
        reconciliationResult = await ReconciliationService.reconcileSalesAndTransactions({
          userId: session.user.id,
          startDate: parseISO(startDate),
          endDate: parseISO(endDate),
        });
      } catch (error) {
        console.error("Erro na reconciliação automática:", error);
      }
    }

    return NextResponse.json({
      message: "Importação concluída com sucesso",
      result: {
        imported: importResult.imported,
        skipped: importResult.skipped,
        errors: importResult.errors,
        details: importResult.details,
      },
      reconciliation: reconciliationResult
    });
  } catch (error) {
    console.error("Erro ao importar vendas:", error);
    return NextResponse.json(
      { error: "Erro ao processar requisição", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 