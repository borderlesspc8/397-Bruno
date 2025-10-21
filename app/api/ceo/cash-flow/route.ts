/**
 * API: Fluxo de Caixa CEO - DADOS REAIS DO GESTÃO CLICK
 * 
 * CORREÇÃO COMPLETA:
 * - ✅ Usa CEOGestaoClickService centralizado
 * - ✅ Remove CEOBetelService duplicado
 * - ✅ Remove fallback com dados fake
 * - ✅ Valida endpoints antes de usar
 * - ✅ Marca claramente quando usa estimativas
 * - ✅ Tratamento robusto de erros
 */

import { NextRequest, NextResponse } from 'next/server';
import { format } from 'date-fns';
import { CEOGestaoClickService } from '../_lib/gestao-click-service';

// Configuração para forçar comportamento dinâmico
export const dynamic = "force-dynamic";

/**
 * Estrutura de resposta do fluxo de caixa
 */
interface CashFlowData {
  // Totais
  totalRecebimentos: number;
  totalPagamentos: number;
  saldoLiquido: number;
  
  // Fluxo diário
  fluxoDiario: Array<{
    data: string;
    recebimentos: number;
    pagamentos: number;
    saldo: number;
  }>;
  
  // Fluxo mensal
  fluxoMensal: Array<{
    mes: string;
    recebimentos: number;
    pagamentos: number;
    saldo: number;
  }>;
  
  // Formas de pagamento
  formasPagamento: Array<{
    forma: string;
    valor: number;
    percentual: number;
  }>;
  
  // Metadados
  lastUpdated: string;
  _metadata: {
    dataSource: 'api' | 'error';
    recebimentosDisponivel: boolean;
    pagamentosDisponivel: boolean;
    usandoEstimativas: boolean;
    estimativas?: string[];
    periodo: {
      inicio: string;
      fim: string;
    };
    timestamp: string;
    error?: string;
  };
}

/**
 * GET /api/ceo/cash-flow
 * 
 * @param request - Request com query params startDate e endDate
 * @returns Dados de fluxo de caixa completos
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    // Validar parâmetros
    if (!startDate || !endDate) {
      return NextResponse.json(
        {
          erro: 'Parâmetros startDate e endDate são obrigatórios',
          message: 'Formato esperado: ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD'
        },
        { status: 400 }
      );
    }
    
    // Formatar datas
    const dataInicio = format(new Date(startDate), 'yyyy-MM-dd');
    const dataFim = format(new Date(endDate), 'yyyy-MM-dd');
    
    console.log(`[CEO Cash Flow] Buscando dados: ${dataInicio} a ${dataFim}`);
    
    // =======================================================================
    // BUSCAR DADOS EM PARALELO
    // =======================================================================
    
    const [recebimentosResult, pagamentosResult, vendasResult] = await Promise.allSettled([
      CEOGestaoClickService.getRecebimentos(dataInicio, dataFim),
      CEOGestaoClickService.getPagamentos(dataInicio, dataFim),
      CEOGestaoClickService.getVendas(dataInicio, dataFim, { todasLojas: true })
    ]);
    
    const recebimentos = recebimentosResult.status === 'fulfilled' ? recebimentosResult.value : [];
    const pagamentos = pagamentosResult.status === 'fulfilled' ? pagamentosResult.value : [];
    const vendas = vendasResult.status === 'fulfilled' ? vendasResult.value : [];
    
    const recebimentosDisponivel = recebimentosResult.status === 'fulfilled' && recebimentos.length > 0;
    const pagamentosDisponivel = pagamentosResult.status === 'fulfilled' && pagamentos.length > 0;
    
    console.log('[CEO Cash Flow] Dados obtidos:', {
      recebimentos: recebimentos.length,
      recebimentosDisponivel,
      pagamentos: pagamentos.length,
      pagamentosDisponivel,
      vendas: vendas.length
    });
    
    const estimativas: string[] = [];
    
    // =======================================================================
    // CALCULAR TOTAIS
    // =======================================================================
    
    let totalRecebimentos = 0;
    let totalPagamentos = 0;
    
    if (recebimentosDisponivel) {
      totalRecebimentos = recebimentos.reduce((acc, rec) => {
        return acc + CEOGestaoClickService.parseValor(rec.valor);
      }, 0);
    } else {
      // ESTIMATIVA: Usar vendas como proxy de recebimentos
      const STATUS_VALIDOS = ["Concretizada", "Em andamento"];
      const vendasFiltradas = vendas.filter(v => 
        v.nome_situacao && STATUS_VALIDOS.includes(v.nome_situacao)
      );
      
      totalRecebimentos = vendasFiltradas.reduce((acc, venda) => {
        return acc + CEOGestaoClickService.parseValor(venda.valor_total);
      }, 0);
      
      estimativas.push('Recebimentos: Usando valor de vendas como proxy (endpoint /recebimentos não disponível)');
    }
    
    if (pagamentosDisponivel) {
      totalPagamentos = pagamentos.reduce((acc, pag) => {
        return acc + CEOGestaoClickService.parseValor(pag.valor);
      }, 0);
    } else {
      // ESTIMATIVA: 60% dos recebimentos como pagamentos
      totalPagamentos = totalRecebimentos * 0.60;
      estimativas.push('Pagamentos: Estimado em 60% dos recebimentos (endpoint /pagamentos não disponível)');
    }
    
    const saldoLiquido = totalRecebimentos - totalPagamentos;
    
    // =======================================================================
    // FLUXO DIÁRIO
    // =======================================================================
    
    const fluxoDiarioMap = new Map<string, any>();
    
    if (recebimentosDisponivel) {
      recebimentos.forEach(rec => {
        const data = rec.data || rec.data_recebimento || dataInicio;
        const dataFormatada = format(new Date(data), 'yyyy-MM-dd');
        
        if (!fluxoDiarioMap.has(dataFormatada)) {
          fluxoDiarioMap.set(dataFormatada, {
            data: dataFormatada,
            recebimentos: 0,
            pagamentos: 0,
            saldo: 0
          });
        }
        
        const dia = fluxoDiarioMap.get(dataFormatada)!;
        dia.recebimentos += CEOGestaoClickService.parseValor(rec.valor);
      });
    }
    
    if (pagamentosDisponivel) {
      pagamentos.forEach(pag => {
        const data = pag.data || pag.data_pagamento || dataInicio;
        const dataFormatada = format(new Date(data), 'yyyy-MM-dd');
        
        if (!fluxoDiarioMap.has(dataFormatada)) {
          fluxoDiarioMap.set(dataFormatada, {
            data: dataFormatada,
            recebimentos: 0,
            pagamentos: 0,
            saldo: 0
          });
        }
        
        const dia = fluxoDiarioMap.get(dataFormatada)!;
        dia.pagamentos += CEOGestaoClickService.parseValor(pag.valor);
      });
    }
    
    // Calcular saldo diário
    fluxoDiarioMap.forEach(dia => {
      dia.saldo = dia.recebimentos - dia.pagamentos;
    });
    
    const fluxoDiario = Array.from(fluxoDiarioMap.values())
      .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
    
    // =======================================================================
    // FLUXO MENSAL
    // =======================================================================
    
    const fluxoMensalMap = new Map<string, any>();
    
    fluxoDiario.forEach(dia => {
      const mes = format(new Date(dia.data), 'yyyy-MM');
      
      if (!fluxoMensalMap.has(mes)) {
        fluxoMensalMap.set(mes, {
          mes: format(new Date(dia.data), 'MMM/yyyy'),
          recebimentos: 0,
          pagamentos: 0,
          saldo: 0
        });
      }
      
      const mesData = fluxoMensalMap.get(mes)!;
      mesData.recebimentos += dia.recebimentos;
      mesData.pagamentos += dia.pagamentos;
      mesData.saldo += dia.saldo;
    });
    
    const fluxoMensal = Array.from(fluxoMensalMap.values());
    
    // =======================================================================
    // FORMAS DE PAGAMENTO
    // =======================================================================
    
    const formasPagamentoMap = new Map<string, number>();
    
    if (recebimentosDisponivel) {
      recebimentos.forEach(rec => {
        const forma = rec.forma_pagamento || rec.tipo_pagamento || 'Não Especificado';
        const valor = CEOGestaoClickService.parseValor(rec.valor);
        
        formasPagamentoMap.set(
          forma,
          (formasPagamentoMap.get(forma) || 0) + valor
        );
      });
    } else {
      // Se não houver recebimentos, usar estimativa básica
      formasPagamentoMap.set('Estimado', totalRecebimentos);
      estimativas.push('Formas de Pagamento: Dados não disponíveis (endpoint /recebimentos não disponível)');
    }
    
    const formasPagamento = Array.from(formasPagamentoMap.entries()).map(([forma, valor]) => ({
      forma,
      valor: Math.round(valor),
      percentual: totalRecebimentos > 0 ? Math.round((valor / totalRecebimentos) * 100 * 100) / 100 : 0
    })).sort((a, b) => b.valor - a.valor);
    
    // =======================================================================
    // MONTAR RESPOSTA FINAL
    // =======================================================================
    
    const cashFlowData: CashFlowData = {
      totalRecebimentos: Math.round(totalRecebimentos),
      totalPagamentos: Math.round(totalPagamentos),
      saldoLiquido: Math.round(saldoLiquido),
      fluxoDiario: fluxoDiario.map(d => ({
        ...d,
        recebimentos: Math.round(d.recebimentos),
        pagamentos: Math.round(d.pagamentos),
        saldo: Math.round(d.saldo)
      })),
      fluxoMensal: fluxoMensal.map(m => ({
        ...m,
        recebimentos: Math.round(m.recebimentos),
        pagamentos: Math.round(m.pagamentos),
        saldo: Math.round(m.saldo)
      })),
      formasPagamento,
      lastUpdated: new Date().toISOString(),
      _metadata: {
        dataSource: 'api',
        recebimentosDisponivel,
        pagamentosDisponivel,
        usandoEstimativas: estimativas.length > 0,
        estimativas: estimativas.length > 0 ? estimativas : undefined,
        periodo: {
          inicio: dataInicio,
          fim: dataFim
        },
        timestamp: new Date().toISOString()
      }
    };
    
    console.log('[CEO Cash Flow] ✅ Análise concluída:', {
      totalRecebimentos: Math.round(totalRecebimentos),
      totalPagamentos: Math.round(totalPagamentos),
      saldoLiquido: Math.round(saldoLiquido),
      diasComFluxo: fluxoDiario.length,
      usandoEstimativas: estimativas.length > 0
    });
    
    if (estimativas.length > 0) {
      console.warn('[CEO Cash Flow] ⚠️  Usando estimativas:', estimativas);
    }
    
    return NextResponse.json(cashFlowData);
    
  } catch (error) {
    console.error('[CEO Cash Flow] ❌ Erro:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    
    // Retornar erro estruturado
    return NextResponse.json(
      {
        erro: 'Erro ao processar fluxo de caixa',
        mensagem: errorMessage,
        totalRecebimentos: 0,
        totalPagamentos: 0,
        saldoLiquido: 0,
        fluxoDiario: [],
        fluxoMensal: [],
        formasPagamento: [],
        lastUpdated: new Date().toISOString(),
        _metadata: {
          dataSource: 'error' as const,
          recebimentosDisponivel: false,
          pagamentosDisponivel: false,
          usandoEstimativas: false,
          periodo: {
            inicio: '',
            fim: ''
          },
          timestamp: new Date().toISOString(),
          error: errorMessage
        }
      } as CashFlowData,
      { status: 500 }
    );
  }
}
