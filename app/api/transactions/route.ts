import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/app/_lib/auth";
import { TransactionService, TransactionFilters } from "@/app/_services/transaction-service";
import { ErrorCode, ErrorHandlingService } from "@/app/_services/error-handling-service";
import { db } from "@/app/_lib/db";

// Configuração para forçar o comportamento dinâmico
export const dynamic = "force-dynamic";


export async function GET(req: NextRequest) {
  try {
    const { user } = await getAuthSession();

    if (!user?.id) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    // Obter parâmetros da URL
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const walletId = searchParams.get("walletId");
    const categoryId = searchParams.get("categoryId");
    const type = searchParams.get("type");
    const search = searchParams.get("search");
    const status = searchParams.get("status");
    const includeSales = searchParams.get("incluir_vendas") === "true"; // Usa o mesmo nome do parâmetro do frontend
    const statusConciliacao = searchParams.get("status_conciliacao");
    
    console.log(`[DEBUG] Buscando transações com parâmetros:`, { 
      page, limit, startDate, endDate, walletId, categoryId, type, search, status, includeSales, statusConciliacao
    });

    // Construir condições de busca
    const where: any = {
      userId: user.id,
    };

    // Filtro por data
    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate);
      }
      if (endDate) {
        const endDateObj = new Date(endDate);
        // Ajustar para final do dia
        endDateObj.setHours(23, 59, 59, 999);
        where.date.lte = endDateObj;
      }
    }

    // Filtro por carteira
    if (walletId) {
      where.walletId = walletId;
    }

    // Filtro por categoria
    if (categoryId) {
      where.categoryId = categoryId;
    }

    // Filtro por tipo
    if (type) {
      where.type = type;
    }

    // Filtro por status
    if (status) {
      where.status = status;
    }

    // Filtro por status de conciliação
    if (statusConciliacao) {
      // Se for solicitado apenas transações conciliadas
      if (statusConciliacao === "conciliadas") {
        where.sales = {
          some: {}  // Transações que têm pelo menos uma venda associada
        };
      } 
      // Se for solicitado apenas transações não conciliadas
      else if (statusConciliacao === "nao_conciliadas") {
        where.sales = {
          none: {}  // Transações que não têm vendas associadas
        };
      }
    }

    // Filtro por termo de busca
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    // Buscar total de registros
    const total = await db.transaction.count({ where });

    // Buscar transações com paginação
    const transactions = await db.transaction.findMany({
      where,
      include: {
        wallet: true,
        categoryObj: true,
        sales: includeSales ? {
          include: {
            salesRecord: {
              select: {
                id: true,
                code: true,
                externalId: true,
                date: true,
                totalAmount: true,
                status: true,
                customerName: true,
                storeName: true,
                source: true,
                installments: {
                  select: {
                    id: true,
                    number: true,
                    amount: true,
                    dueDate: true,
                    status: true
                  }
                }
              }
            },
            installment: {
              select: {
                id: true,
                number: true,
                amount: true,
                dueDate: true,
                status: true
              }
            }
          }
        } : false,
      },
      orderBy: {
        date: "desc",
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Buscar vendas do Gestão Click que não estão associadas a transações (se solicitado)
    let nonLinkedSales: any[] = [];
    
    if (includeSales) {
      // Construir where para vendas
      const salesWhere: any = {
        userId: user.id,
        source: "GESTAO_CLICK"
      };
      
      // Aplicar os mesmos filtros de data das transações
      if (where.date) {
        salesWhere.date = where.date;
      }
      
      // Buscar vendas que não estão vinculadas a transações
      nonLinkedSales = await db.sales_records.findMany({
        where: {
          ...salesWhere,
          transactions: {
            none: {}  // Vendas sem transações associadas
          }
        },
        select: {
          id: true,
          code: true,
          externalId: true,
          date: true,
          totalAmount: true,
          status: true,
          customerName: true,
          storeName: true,
          source: true,
          installments: {
            select: {
              id: true,
              number: true,
              amount: true,
              dueDate: true,
              status: true
            }
          }
        },
        orderBy: {
          date: "desc"
        }
      });
      
      console.log(`[DEBUG] Encontradas ${nonLinkedSales.length} vendas não vinculadas`);
    }

    // Combinar transações e vendas não vinculadas
    const combinedResults = [
      // Transações reais do banco
      ...transactions.map((tx) => ({
        ...tx,
        isFromTransaction: true,
        // Dados de vendas associadas, se existirem
        linkedSales: tx.sales ? tx.sales.map((sale: any) => ({
          id: sale.salesRecord?.id,
          code: sale.salesRecord?.code,
          externalId: sale.salesRecord?.externalId,
          date: sale.salesRecord?.date,
          totalAmount: sale.salesRecord?.totalAmount,
          status: sale.salesRecord?.status,
          customerName: sale.salesRecord?.customerName,
          storeName: sale.salesRecord?.storeName,
          source: sale.salesRecord?.source,
          installment: sale.installment,
          installments: sale.salesRecord?.installments
        })) : [],
        // Marcador de conciliação
        isReconciled: tx.sales && tx.sales.length > 0
      })),
      
      // Vendas não vinculadas a transações (representadas como transações virtuais)
      ...(includeSales ? nonLinkedSales.map(sale => ({
        id: `virtual-${sale.id}`,
        name: `Venda ${sale.code || sale.id} - ${sale.customerName || 'Cliente não informado'}`,
        amount: sale.totalAmount,
        date: sale.date,
        type: "INCOME", // Assumimos que vendas são sempre receitas
        category: "OPERATIONAL",
        status: mapSaleStatusToTransactionStatus(sale.status),
        isFromTransaction: false, // Indica que é uma venda virtual, não uma transação real
        source: "GESTAO_CLICK",
        wallet: null, // Não tem carteira associada
        categoryObj: null, // Não tem categoria associada
        isReconciled: false, // Vendas virtuais nunca estão conciliadas
        // Dados originais da venda
        saleData: {
          id: sale.id,
          code: sale.code,
          externalId: sale.externalId,
          date: sale.date,
          totalAmount: sale.totalAmount,
          status: sale.status,
          customerName: sale.customerName,
          storeName: sale.storeName,
          source: sale.source,
          installments: sale.installments
        }
      })) : [])
    ];

    // Ordenar resultados combinados por data (mais recentes primeiro)
    const sortedResults = combinedResults.sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    // Limitar resultados conforme paginação
    const paginatedResults = sortedResults.slice(0, limit);

    return NextResponse.json({
      transactions: paginatedResults,
      pagination: {
        total: total + (includeSales ? nonLinkedSales.length : 0),
        page,
        limit,
        pages: Math.ceil((total + (includeSales ? nonLinkedSales.length : 0)) / limit),
      },
    });
  } catch (error) {
    console.error("[API_ERROR]", error);
    return NextResponse.json(
      { error: "Erro ao buscar transações" },
      { status: 500 }
    );
  }
}

/**
 * Mapeia o status de venda para um status de transação
 */
function mapSaleStatusToTransactionStatus(saleStatus: string): string {
  switch (saleStatus?.toLowerCase()) {
    case 'cancelado':
    case 'cancelada':
      return 'CANCELLED';
    case 'pago':
    case 'paga':
    case 'concluído':
    case 'concluída':
      return 'COMPLETED';
    case 'pendente':
      return 'PENDING';
    case 'em análise':
    case 'em processamento':
      return 'PROCESSING';
    default:
      return 'COMPLETED'; // Por padrão, considerar como concluída
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    
    if (!session?.user) {
      return ErrorHandlingService.respondWithError(ErrorCode.UNAUTHORIZED);
    }

    const body = await request.json();
    console.log("[TRANSACTION_DEBUG] Dados recebidos:", body);
    
    // Validar campos obrigatórios
    const validation = ErrorHandlingService.validateData(
      body, 
      ["amount", "walletId", "type"]
    );
    
    if (!validation.valid) {
      return validation.error;
    }

    // Converter valores
    const amount = parseFloat(body.amount);
    
    // Validar valores
    if (isNaN(amount) || amount <= 0) {
      return ErrorHandlingService.respondWithError(
        ErrorCode.INVALID_AMOUNT,
        "O valor deve ser um número positivo",
        { providedAmount: body.amount }
      );
    }
    
    // Corrigir o tipo da transação com base no valor
    // Se o tipo é EXPENSE mas o valor é positivo, convertemos para DEPOSIT
    if (body.type === "EXPENSE" && amount > 0) {
      console.log(`[API_DEBUG] Corrigindo tipo da transação para DEPOSIT (valor positivo: ${amount})`);
      body.type = "DEPOSIT";
    }
    // Se o tipo é DEPOSIT mas o valor é negativo, convertemos para EXPENSE
    else if (body.type === "DEPOSIT" && amount < 0) {
      console.log(`[API_DEBUG] Corrigindo tipo da transação para EXPENSE (valor negativo: ${amount})`);
      body.type = "EXPENSE";
    }

    // Criar transação usando o serviço
    const result = await TransactionService.createTransaction({
      userId: session.user.id,
      walletId: body.walletId,
      amount,
      description: body.description || "",
      date: body.date ? new Date(body.date) : new Date(),
      type: body.type,
      category: body.category || "Outros", // Categoria padrão
      paymentMethod: body.paymentMethod,
      isReconciled: body.isReconciled || false,
      metadata: body.metadata,
      tags: body.tags
    });

    if (!result.success) {
      // Mapear erros comuns para códigos de erro estruturados
      let errorCode = ErrorCode.VALIDATION_ERROR;
      
      if (result.error?.includes("Carteira não encontrada")) {
        errorCode = ErrorCode.WALLET_NOT_FOUND;
      } else if (result.error?.includes("Tipo de transação inválido")) {
        errorCode = ErrorCode.INVALID_FORMAT;
      } else if (result.error?.includes("Valor inválido")) {
        errorCode = ErrorCode.INVALID_AMOUNT;
      } else if (result.error?.includes("Saldo insuficiente")) {
        errorCode = ErrorCode.INSUFFICIENT_FUNDS;
      }
      
      return ErrorHandlingService.respondWithError(
        errorCode,
        result.error,
        { transactionDetails: { ...body, amount } }
      );
    }

    return NextResponse.json(result.transaction);
  } catch (error) {
    console.error("Erro ao criar transação:", error);
    return ErrorHandlingService.handleException(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return ErrorHandlingService.respondWithError(ErrorCode.UNAUTHORIZED);
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return ErrorHandlingService.respondWithError(
        ErrorCode.MISSING_REQUIRED_FIELDS,
        "ID da transação não fornecido"
      );
    }

    const body = await request.json();
    
    // Validar valores se fornecidos
    if (body.amount !== undefined) {
      const amount = parseFloat(body.amount);
      if (isNaN(amount) || amount <= 0) {
        return ErrorHandlingService.respondWithError(
          ErrorCode.INVALID_AMOUNT,
          "O valor deve ser um número positivo",
          { providedAmount: body.amount }
        );
      }
    }
    
    if (body.type !== undefined) {
      const validTypes = ["EXPENSE", "INCOME", "TRANSFER"];
      if (!validTypes.includes(body.type)) {
        return ErrorHandlingService.respondWithError(
          ErrorCode.INVALID_FORMAT,
          "Tipo de transação inválido",
          { allowedTypes: validTypes, providedType: body.type }
        );
      }
    }

    // Atualizar transação usando o serviço
    const result = await TransactionService.updateTransaction(id, session.user.id, body);

    if (!result.success) {
      // Mapear erros comuns para códigos de erro estruturados
      let errorCode = ErrorCode.VALIDATION_ERROR;
      
      if (result.error?.includes("Transação não encontrada")) {
        errorCode = ErrorCode.TRANSACTION_NOT_FOUND;
      } else if (result.error?.includes("Carteira não encontrada")) {
        errorCode = ErrorCode.WALLET_NOT_FOUND;
      } else if (result.error?.includes("Tipo de transação inválido")) {
        errorCode = ErrorCode.INVALID_FORMAT;
      } else if (result.error?.includes("Valor inválido")) {
        errorCode = ErrorCode.INVALID_AMOUNT;
      } else if (result.error?.includes("Saldo insuficiente")) {
        errorCode = ErrorCode.INSUFFICIENT_FUNDS;
      }
      
      return ErrorHandlingService.respondWithError(
        errorCode,
        result.error,
        { transactionId: id, updateData: body }
      );
    }

    return NextResponse.json(result.transaction);
  } catch (error) {
    console.error("Erro ao atualizar transação:", error);
    return ErrorHandlingService.handleException(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return ErrorHandlingService.respondWithError(ErrorCode.UNAUTHORIZED);
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return ErrorHandlingService.respondWithError(
        ErrorCode.MISSING_REQUIRED_FIELDS,
        "ID da transação não fornecido"
      );
    }

    // Excluir transação usando o serviço
    const result = await TransactionService.deleteTransaction(id, session.user.id);

    if (!result.success) {
      // Mapear erros comuns para códigos de erro estruturados
      let errorCode = ErrorCode.VALIDATION_ERROR;
      
      if (result.error?.includes("Transação não encontrada")) {
        errorCode = ErrorCode.TRANSACTION_NOT_FOUND;
      }
      
      return ErrorHandlingService.respondWithError(
        errorCode,
        result.error,
        { transactionId: id }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao excluir transação:", error);
    return ErrorHandlingService.handleException(error);
  }
} 
