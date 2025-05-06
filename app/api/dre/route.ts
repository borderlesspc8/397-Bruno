import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/app/_lib/auth";
import { prisma } from "@/app/_lib/prisma";
import { DREService } from "@/app/_services/dre-service";
import { GestaoClickService } from "@/app/_services/gestao-click-service";
import { formatISO, parseISO, format, startOfMonth, endOfMonth } from "date-fns";

// Configuração para forçar o comportamento dinâmico
export const dynamic = "force-dynamic";


/**
 * API para obter dados do DRE (Demonstrativo de Resultado do Exercício)
 * 
 * Parâmetros:
 * - period: 'month' | 'year' (padrão: 'month')
 * - date: data de referência no formato YYYY-MM-DD (padrão: data atual)
 * - includeEstimates: 'true' | 'false' (padrão: 'false')
 * - compareWithPrevious: 'true' | 'false' (padrão: 'false')
 * - includeGestaoClick: 'true' | 'false' (padrão: 'true')
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    // Obter parâmetros da requisição
    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get("period") || "month";
    const dateParam = searchParams.get("date") || formatISO(new Date(), { representation: "date" });
    const includeEstimates = searchParams.get("includeEstimates") === "true";
    const compareWithPrevious = searchParams.get("compareWithPrevious") === "true";
    const includeGestaoClick = searchParams.get("includeGestaoClick") !== "false"; // default: true

    // Parsear a data de referência
    const referenceDate = parseISO(dateParam);
    
    // Verificar integração com Gestão Click
    const hasGestaoClickIntegration = await checkGestaoClickIntegration(session.user.id);
    
    // Se solicitou dados do Gestão Click mas não tem integração
    if (includeGestaoClick && !hasGestaoClickIntegration) {
      return NextResponse.json(
        {
          error: "Integração com Gestão Click não configurada",
          data: { contaRapida: await getContaRapidaDREData(session.user.id, period, referenceDate, includeEstimates, compareWithPrevious) },
        },
        { status: 200 }
      );
    }

    // Obter DRE da ContaRápida
    const contaRapidaData = await getContaRapidaDREData(
      session.user.id,
      period,
      referenceDate,
      includeEstimates,
      compareWithPrevious
    );

    // Se não precisamos incluir dados do Gestão Click, retornamos apenas os dados internos
    if (!includeGestaoClick) {
      return NextResponse.json({ data: { contaRapida: contaRapidaData } }, { status: 200 });
    }

    // Obter DRE do Gestão Click
    const gestaoClickData = await getGestaoClickDREData(
      session.user.id,
      period,
      referenceDate
    );

    // Combinar os dados
    const combinedData = combineFinancialData(contaRapidaData, gestaoClickData);

    return NextResponse.json(
      {
        data: {
          contaRapida: contaRapidaData,
          gestaoClick: gestaoClickData,
          consolidated: combinedData,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Erro ao gerar DRE:", error);
    return NextResponse.json(
      { error: `Erro ao gerar DRE: ${error.message}` },
      { status: 500 }
    );
  }
}

/**
 * Verifica se o usuário tem integração com o Gestão Click configurada
 */
async function checkGestaoClickIntegration(userId: string): Promise<boolean> {
  try {
    // Verificar se há configurações de integração salvas
    const settingsCount = await prisma.wallet.count({
      where: {
        userId,
        name: "GESTAO_CLICK_GLOBAL",
        type: "EXTERNAL_INTEGRATION"
      }
    });

    return settingsCount > 0;
  } catch (error) {
    console.error("Erro ao verificar integração com Gestão Click:", error);
    return false;
  }
}

/**
 * Obtém dados do DRE a partir do sistema ContaRápida
 */
async function getContaRapidaDREData(
  userId: string,
  period: string,
  referenceDate: Date,
  includeEstimates: boolean,
  compareWithPrevious: boolean
): Promise<any> {
  if (period === "month") {
    if (compareWithPrevious) {
      // Comparação mensal (mês atual vs anterior)
      return await DREService.generateDREComparison(userId, referenceDate);
    } else {
      // Dados de um único mês
      return await DREService.generateMonthlyDRE(userId, referenceDate, includeEstimates);
    }
  } else if (period === "year") {
    // Dados do ano inteiro
    const year = referenceDate.getFullYear();
    return await DREService.generateAnnualDRE(userId, year);
  } else if (period === "forecast") {
    // Previsão para o próximo mês
    return await DREService.generateNextMonthDREForecast(userId);
  }
  
  // Caso inválido
  throw new Error("Período inválido. Use 'month', 'year' ou 'forecast'.");
}

/**
 * Obtém dados do DRE a partir do Gestão Click
 */
async function getGestaoClickDREData(
  userId: string,
  period: string,
  referenceDate: Date
): Promise<any> {
  try {
    // Buscar configurações da integração
    const integration = await prisma.wallet.findFirst({
      where: {
        userId,
        name: "GESTAO_CLICK_GLOBAL",
        type: "EXTERNAL_INTEGRATION"
      },
      select: {
        metadata: true
      }
    });

    if (!integration || !integration.metadata) {
      throw new Error("Configuração da integração não encontrada");
    }

    // Extrair configurações
    const metadata = integration.metadata as any;
    const apiKey = metadata.apiKey || "";
    const secretToken = metadata.secretToken || undefined;
    const apiUrl = metadata.apiUrl || undefined;

    // Inicializar serviço
    const gestaoClickService = new GestaoClickService({
      apiKey,
      secretToken,
      apiUrl,
      userId,
    });

    if (period === "month") {
      // Dados mensais
      const year = referenceDate.getFullYear();
      const month = referenceDate.getMonth() + 1;
      return await gestaoClickService.getMonthlyDREData(year, month);
    } else if (period === "year") {
      // Dados anuais
      const year = referenceDate.getFullYear();
      return await gestaoClickService.getAnnualDREData(year);
    }
    
    return null;
  } catch (error) {
    console.error("Erro ao obter dados do Gestão Click:", error);
    return null;
  }
}

/**
 * Combina dados financeiros de diferentes fontes
 */
function combineFinancialData(contaRapidaData: any, gestaoClickData: any): any {
  // Se não tiver dados do Gestão Click, retorna apenas os dados da ContaRápida
  if (!gestaoClickData) {
    return contaRapidaData;
  }

  // Implementação simplificada - uma versão mais robusta precisaria mapear
  // categorias e outros detalhes entre os sistemas
  
  // Para relatório mensal
  if ('month' in contaRapidaData && 'period' in gestaoClickData) {
    return {
      month: contaRapidaData.month,
      monthLabel: contaRapidaData.monthLabel,
      revenue: {
        total: contaRapidaData.revenue.total + gestaoClickData.revenues.total,
        byCategory: mergeCategories(
          contaRapidaData.revenue.byCategory,
          gestaoClickData.revenues.byCategory,
          'receita'
        ),
        byWallet: mergeCategories(
          contaRapidaData.revenue.byWallet,
          gestaoClickData.revenues.byStore,
          'carteira'
        ),
        byCostCenter: mergeCategories(
          contaRapidaData.revenue.byCostCenter,
          gestaoClickData.revenues.byCostCenter,
          'centro'
        ),
      },
      expenses: {
        total: contaRapidaData.expenses.total + gestaoClickData.expenses.total,
        byCategory: mergeCategories(
          contaRapidaData.expenses.byCategory,
          gestaoClickData.expenses.byCategory,
          'despesa'
        ),
        byWallet: mergeCategories(
          contaRapidaData.expenses.byWallet,
          gestaoClickData.expenses.byStore,
          'carteira'
        ),
        byCostCenter: mergeCategories(
          contaRapidaData.expenses.byCostCenter,
          gestaoClickData.expenses.byCostCenter,
          'centro'
        ),
      },
      grossProfit: (contaRapidaData.revenue.total + gestaoClickData.revenues.total) - 
                   (contaRapidaData.expenses.total + gestaoClickData.expenses.total),
      netProfit: (contaRapidaData.revenue.total + gestaoClickData.revenues.total) - 
                 (contaRapidaData.expenses.total + gestaoClickData.expenses.total),
      margin: calculateMargin(
        contaRapidaData.revenue.total + gestaoClickData.revenues.total,
        contaRapidaData.expenses.total + gestaoClickData.expenses.total
      ),
      sources: ['contaRapida', 'gestaoClick']
    };
  }
  
  // Para relatório anual (array de meses)
  if (Array.isArray(contaRapidaData) && Array.isArray(gestaoClickData)) {
    const combined: any[] = [];
    
    // Mapear períodos disponíveis em ambas as fontes
    const allPeriods = new Set();
    contaRapidaData.forEach((item: any) => allPeriods.add(item.month));
    gestaoClickData.forEach((item: any) => allPeriods.add(item.period));
    
    // Para cada período, combinar os dados
    Array.from(allPeriods).forEach(period => {
      const crData = contaRapidaData.find((item: any) => item.month === period);
      const gcData = gestaoClickData.find((item: any) => item.period === period);
      
      if (crData && gcData) {
        // Se temos dados de ambas as fontes, combinamos
        combined.push(combineFinancialData(crData, gcData));
      } else if (crData) {
        // Se só temos dados da ContaRápida
        combined.push({...crData, sources: ['contaRapida']});
      } else if (gcData) {
        // Se só temos dados do Gestão Click
        // Converter formato do Gestão Click para o formato da ContaRápida
        combined.push({
          month: gcData.period,
          monthLabel: formatMonthLabel(gcData.period),
          revenue: {
            total: gcData.revenues.total,
            byCategory: gcData.revenues.byCategory,
            byWallet: gcData.revenues.byStore,
            byCostCenter: gcData.revenues.byCostCenter,
          },
          expenses: {
            total: gcData.expenses.total,
            byCategory: gcData.expenses.byCategory,
            byWallet: gcData.expenses.byStore,
            byCostCenter: gcData.expenses.byCostCenter,
          },
          grossProfit: gcData.revenues.total - gcData.expenses.total,
          netProfit: gcData.revenues.total - gcData.expenses.total,
          margin: calculateMargin(gcData.revenues.total, gcData.expenses.total),
          sources: ['gestaoClick']
        });
      }
    });
    
    // Ordenar por período
    return combined.sort((a, b) => a.month.localeCompare(b.month));
  }
  
  // Caso de comparação mensal ou outro formato
  return contaRapidaData;
}

/**
 * Mescla categorias de diferentes fontes
 */
function mergeCategories(
  list1: any[], 
  list2: any[], 
  source: string
): any[] {
  const merged = [...list1];
  
  list2.forEach(item => {
    // Procurar categoria correspondente
    const existing = merged.find(m => 
      m.name.toLowerCase() === item.name.toLowerCase() ||
      m.id === item.id
    );
    
    if (existing) {
      // Se encontrou, soma os valores
      existing.amount += item.amount;
    } else {
      // Se não encontrou, adiciona com prefixo da fonte
      merged.push({
        ...item,
        name: `[GC] ${item.name}`,
        source
      });
    }
  });
  
  return merged;
}

/**
 * Calcula a margem percentual
 */
function calculateMargin(revenue: number, expense: number): number {
  if (revenue === 0) return 0;
  return ((revenue - expense) / revenue) * 100;
}

/**
 * Formata o rótulo do mês a partir de um período (YYYY-MM)
 */
function formatMonthLabel(period: string): string {
  // Formato esperado: YYYY-MM
  const [year, month] = period.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  
  return format(date, 'MMMM yyyy', { locale: require('date-fns/locale/pt-BR') });
} 
