import { db } from "@/app/_lib/prisma";
import { getAuthSession } from "@/app/_lib/auth";
import { TransactionsPageClient } from "./_components/transactions-page-client";
import { redirect } from "next/navigation";
import { format, startOfDay, endOfDay, subDays, subMonths, addDays } from "date-fns";
import { PredefinedPeriod } from "@/app/_components/ui/period-filter";
import { CashFlowPrediction } from "@/app/_types/transaction";
import { QueryOptimizationService } from "@/app/_services/query-optimization-service";

// Número de itens por página
const ITENS_POR_PAGINA = 15;

// Função para obter intervalo de datas com base no período
function getDateRangeFromPeriod(period: string): { startDate: Date, endDate: Date } {
  const today = startOfDay(new Date());
  
  switch (period) {
    case "15dias":
      return {
        startDate: subDays(today, 14),
        endDate: today
      };
    case "30dias":
      return {
        startDate: subDays(today, 29),
        endDate: today
      };
    case "45dias":
      return {
        startDate: subDays(today, 44),
        endDate: today
      };
    case "trimestre":
      return {
        startDate: subMonths(today, 3),
        endDate: today
      };
    case "semestre":
      return {
        startDate: subMonths(today, 6),
        endDate: today
      };
    case "ano":
      return {
        startDate: subMonths(today, 12),
        endDate: today
      };
    case "todos":
      // Usamos uma data muito antiga para garantir que todas as transações sejam incluídas
      // Mas na prática, este caso não deveria ser usado, pois tratamos "todos" com undefined
      return {
        startDate: new Date(1970, 0, 1), // Data muito antiga
        endDate: today
      };
    default:
      // Padrão é 30 dias
      return {
        startDate: subDays(today, 29),
        endDate: today
      };
  }
}

// Função para converter tags com segurança para um array de strings
function safeTagsConverter(tags: any): string[] {
  if (!tags) return [];
  if (!Array.isArray(tags)) return [];
  
  // Filtra valores nulos e converte para string
  return tags
    .filter((tag): tag is string | number | boolean => 
      tag !== null && tag !== undefined)
    .map(tag => String(tag));
}

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  try {
    // Obter a sessão do usuário
    const { user } = await getAuthSession();
    
    if (!user) {
      return redirect("/login");
    }

    // Extrair parâmetros de paginação e filtros da URL
    const pagina = Number(searchParams.page) || Number(searchParams.pagina) || 1;
    const filtroTipo = searchParams.tipo?.toString() || "todos";
    const busca = searchParams.busca?.toString() || "";
    const itensPerPage = Number(searchParams.limite) || ITENS_POR_PAGINA;
    const incluirVendas = searchParams.incluir_vendas?.toString() === "true";
    
    // Processar o filtro de período
    const periodoFiltro = searchParams.periodo?.toString() as PredefinedPeriod | undefined;
    
    // Define as datas baseadas no período ou nos parâmetros específicos
    let dataInicio: string | undefined;
    let dataFim: string | undefined;
    
    const dataInicioParams = searchParams.dataInicio?.toString();
    const dataFimParams = searchParams.dataFim?.toString();
    
    // Se temos um período predefinido, usamos ele para gerar as datas
    if (periodoFiltro) {
      if (periodoFiltro === "todos") {
        // Para "todos", não aplicamos nenhum filtro de data
        console.log('[TRANSACTIONS_PAGE] Período "Todo o período" selecionado - buscando todas as transações sem filtro de data');
        dataInicio = undefined;
        dataFim = undefined;
      } else if (periodoFiltro === "custom") {
        // Usar datas específicas da URL para período personalizado
        dataInicio = dataInicioParams;
        dataFim = dataFimParams;
      } else {
        // Usar período predefinido
        const dateRange = getDateRangeFromPeriod(periodoFiltro);
        dataInicio = format(dateRange.startDate, "yyyy-MM-dd");
        dataFim = format(dateRange.endDate, "yyyy-MM-dd");
      }
    } else {
      // Se não tiver período definido, usar datas específicas ou padrão de 30 dias
      if (dataInicioParams || dataFimParams) {
        dataInicio = dataInicioParams;
        dataFim = dataFimParams;
      } else {
        // Padrão: últimos 30 dias
        const dateRange = getDateRangeFromPeriod("30dias");
        dataInicio = format(dateRange.startDate, "yyyy-MM-dd");
        dataFim = format(dateRange.endDate, "yyyy-MM-dd");
      }
    }
    
    const carteira = searchParams.carteira?.toString();
    const categoria = searchParams.categoria?.toString();
    const ordenacao = searchParams.ordem?.toString() || "desc";
    const tagsString = searchParams.tags?.toString();
    const tags = tagsString ? tagsString.split(',') : undefined;
    const statusConciliacao = searchParams.status_conciliacao?.toString();

    console.log(`[TRANSACTIONS_PAGE] Carregando página ${pagina} de transações com ordenação ${ordenacao}`);
    if (periodoFiltro) {
      console.log(`[TRANSACTIONS_PAGE] Período selecionado: ${periodoFiltro}`);
    }
    if (dataInicio || dataFim) {
      console.log(`[TRANSACTIONS_PAGE] Intervalo de datas: ${dataInicio || 'início'} a ${dataFim || 'hoje'}`);
    }

    // Construir consulta otimizada com QueryOptimizationService
    const where = QueryOptimizationService.buildTransactionWhereClause({
      userId: user.id,
      walletId: carteira,
      startDate: dataInicio ? new Date(dataInicio) : undefined,
      endDate: dataFim ? new Date(dataFim) : undefined,
      type: filtroTipo === "receitas" 
        ? "INCOME" 
        : filtroTipo === "despesas" 
          ? "EXPENSE" 
          : undefined,
      category: categoria && categoria !== "todas" ? categoria : undefined,
      tags,
      search: busca || undefined,
      isReconciled: statusConciliacao === "conciliadas" ? true : 
                   statusConciliacao === "nao_conciliadas" ? false : 
                   undefined
    });

    // Obter parâmetros de paginação otimizados
    const paginationParams = QueryOptimizationService.buildPaginationParams(
      pagina, 
      itensPerPage
    );

    // Obter ordenação otimizada
    const orderBy = QueryOptimizationService.buildTransactionOrderBy(
      'date',
      ordenacao === "desc" ? "desc" : "asc"
    );

    // Selecionar os campos necessários com otimização
    const select = {
      ...QueryOptimizationService.getTransactionSelectFields(true),
      sales: {
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
      }
    };

    // Contar total de transações com os filtros aplicados (para paginação)
    const totalTransacoes = await db.transaction.count({ where });
    const totalPaginas = Math.ceil(totalTransacoes / itensPerPage);

    // Buscar transações com paginação otimizada
    const transactions = await db.transaction.findMany({
      where,
      orderBy,
      select,
      ...paginationParams
    });

    console.log(`[TRANSACTIONS_PAGE] Encontradas ${transactions.length} transações na página ${pagina} de ${totalPaginas}`);

    // Transformar os dados retornados para o formato esperado pelo cliente
    const formattedTransactions = transactions.map(transaction => {
      // Processar anexos de forma segura
      let attachments: {id: string, fileName: string, fileUrl: string}[] = [];
      
      if (transaction.attachments) {
        if (Array.isArray(transaction.attachments)) {
          attachments = transaction.attachments.map((att: any) => {
            if (typeof att === 'string') {
              return {
                id: att,
                fileName: "Anexo",
                fileUrl: `/api/transactions/attachments/${att}`
              };
            } else if (att && typeof att === 'object') {
              return {
                id: att.id || "",
                fileName: att.fileName || "Anexo",
                fileUrl: att.fileUrl || `/api/transactions/attachments/${att.id || ""}`
              };
            }
            return {
              id: "",
              fileName: "Anexo indisponível",
              fileUrl: "#"
            };
          });
        }
      }
      
      // Extrair paymentMethod do metadata de forma segura
      let paymentMethod = "OTHER";
      if (transaction.metadata && typeof transaction.metadata === 'object' && 'paymentMethod' in transaction.metadata) {
        paymentMethod = transaction.metadata.paymentMethod as string;
      }
      
      return {
        id: transaction.id,
        name: transaction.name || "",
        description: transaction.description || transaction.name || "",
        amount: Number(transaction.amount),
        date: transaction.date,
        type: transaction.type,
        category: transaction.category || "",
        paymentMethod,
        metadata: transaction.metadata,
        tags: safeTagsConverter(transaction.tags),
        attachments,
        wallet: {
          id: transaction.wallet?.id || "",
          name: transaction.wallet?.name || "",
          type: transaction.wallet?.type || "",
          color: transaction.wallet?.color || null
        },
        status: transaction.status || "COMPLETED",
        isReconciled: transaction.sales && Array.isArray(transaction.sales) && transaction.sales.length > 0,
        linkedSales: transaction.sales ? transaction.sales.map((sale: any) => ({
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
        fromGestaoClick: !!(transaction.metadata && 
                      typeof transaction.metadata === 'object' && 
                      'source' in transaction.metadata && 
                      transaction.metadata.source === "gestao_click"),
        isFromTransaction: true,
        saleData: null
      };
    });

    // Buscar todas as carteiras para o dropdown de filtro
    const wallets = await db.wallet.findMany({
      where: {
        userId: user.id,
      },
      select: {
        id: true,
        name: true,
      }
    });

    // Método 2: Alternativa - somar diretamente todas as transações com os filtros aplicados
    const todasTransacoes = await db.transaction.findMany({
      where,
      select: {
        type: true,
        amount: true,
      }
    });

    // Calcular totais de forma mais segura
    let totalReceitas = 0;
    let totalDespesas = 0;

    // Usando o método 2 para ter certeza que os totais estão corretos
    todasTransacoes.forEach(transaction => {
      if (transaction.type === 'DEPOSIT' || transaction.type === 'INCOME') {
        totalReceitas += Number(transaction.amount) || 0;
      } else if (transaction.type === 'EXPENSE') {
        // As despesas são armazenadas como valores positivos, mas representam saídas
        totalDespesas += Math.abs(Number(transaction.amount) || 0);
      }
    });

    console.log(`[TRANSACTIONS_PAGE] Total receitas: ${totalReceitas}, Total despesas: ${totalDespesas}`);

    // Buscar todas as categorias usadas pelo usuário (para o filtro)
    const categoriasUsadas = await db.transaction.groupBy({
      by: ['category'],
      where: {
        userId: user.id,
      },
    });

    const todasCategorias = categoriasUsadas
      .map(c => c.category)
      .filter((category): category is string => Boolean(category));

    // Calcular saldo
    const saldo = totalReceitas - totalDespesas;

    // Listar todas as tags usadas pelo usuário
    const allTransactionTags = await db.transaction.findMany({
      where: {
        userId: user.id,
        tags: {
          isEmpty: false
        }
      },
      select: {
        tags: true
      }
    });
    
    // Extrair e unificar todas as tags
    const uniqueTags = new Set<string>();
    allTransactionTags.forEach(t => {
      if (Array.isArray(t.tags)) {
        t.tags.forEach(tag => uniqueTags.add(tag as string));
      }
    });

    return (
      <TransactionsPageClient
        transactions={formattedTransactions}
        totalReceitas={Number(totalReceitas)}
        totalDespesas={Number(totalDespesas)}
        saldo={Number(saldo)}
        wallets={wallets}
        paginacao={{
          paginaAtual: pagina,
          totalPaginas,
          totalItems: totalTransacoes,
          itensPorPagina: itensPerPage,
          total: totalTransacoes
        }}
        filtros={{
          tipo: filtroTipo,
          busca,
          dataInicio: dataInicio,
          dataFim: dataFim,
          carteira_id: carteira,
          categoria_id: categoria,
          periodo: periodoFiltro,
          ordem: ordenacao,
          tags,
          incluir_vendas: incluirVendas,
          status_conciliacao: statusConciliacao
        }}
        categorias={todasCategorias}
      />
    );
  } catch (error) {
    console.error("[TRANSACTIONS_PAGE] Erro ao carregar transações:", error);
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-semibold mb-2">Erro ao carregar transações</h2>
        <p className="text-muted-foreground">
          Ocorreu um problema ao buscar suas transações. Tente novamente mais tarde.
        </p>
      </div>
    );
  }
}
