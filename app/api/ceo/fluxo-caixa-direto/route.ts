/**
 * API: Fluxo de Caixa Método Direto - Dashboard CEO
 * 
 * Implementação rigorosa seguindo método direto:
 * - CFO (Cash Flow from Operations): Entradas e saídas operacionais
 * - CFI (Cash Flow from Investments): Investimentos/Capex
 * - CFF (Cash Flow from Financing): Financiamentos, empréstimos, distribuições
 * - FCF (Free Cash Flow): CFO - Capex
 * 
 * Usa DATA DE CAIXA (data_recebimento/data_pagamento)
 */

import { NextRequest, NextResponse } from 'next/server';
import { format, differenceInDays, eachDayOfInterval, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CEOGestaoClickService } from '../_lib/gestao-click-service';
import {
  classificarPlanoContas,
  isInvestimento,
  isFinanciamento,
  ClassificacaoPlanoContas,
  type PagamentoClassificado
} from '../_lib/plano-contas-mapper';

export const dynamic = "force-dynamic";

interface FluxoCaixaDireto {
  // Atividades Operacionais (CFO)
  cfo: {
    recebimentosOperacionais: number;
    pagamentosOperacionais: number;
    fornecedores: number;
    folhaPagamento: number;
    tributosOperacionais: number;
    outros: number;
    total: number; // Líquido CFO
  };
  
  // Atividades de Investimento (CFI)
  cfi: {
    capex: number;  // Negativo (saída)
    vendasAtivos: number; // Positivo (entrada)
    outros: number;
    total: number; // Líquido CFI
  };
  
  // Atividades de Financiamento (CFF)
  cff: {
    emprestimosRecebidos: number; // Positivo
    pagamentoEmprestimos: number; // Negativo
    aporteCapital: number; // Positivo
    distribuicaoLucros: number; // Negativo
    outros: number;
    total: number; // Líquido CFF
  };
  
  // Fluxo de Caixa Livre (Free Cash Flow)
  fcf: number; // CFO - Capex
  
  // Totais
  totais: {
    entradas: number;
    saidas: number;
    saldoLiquido: number;
  };
  
  // Série diária (para gráficos)
  fluxoDiario: Array<{
    data: string;
    entradas: number;
    saidas: number;
    saldo: number;
  }>;
  
  // Série mensal
  fluxoMensal: Array<{
    mes: string;
    cfo: number;
    cfi: number;
    cff: number;
    total: number;
  }>;
  
  // Detalhamento por forma de pagamento
  formasPagamento: Array<{
    forma: string;
    entradas: number;
    saidas: number;
    saldo: number;
  }>;
  
  // Qualidade dos dados
  qualidade: 'real' | 'parcial' | 'estimado';
  observacoes: string[];
  
  // Metadados
  periodo: {
    inicio: string;
    fim: string;
    dias: number;
  };
  lastUpdated: string;
  fonte: {
    recebimentos: boolean;
    pagamentos: boolean;
  };
}

/**
 * Converte valor monetário brasileiro para número
 */
function parseValorMonetario(valor: any): number {
  if (typeof valor === 'number') return valor;
  if (!valor) return 0;
  
  const valorStr = String(valor)
    .replace(/[^\d,.-]/g, '')
    .replace('.', '')
    .replace(',', '.');
  
  const numero = parseFloat(valorStr);
  return isNaN(numero) ? 0 : numero;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!startDate || !endDate) {
      return NextResponse.json(
        { erro: 'Parâmetros startDate e endDate são obrigatórios' },
        { status: 400 }
      );
    }

    const dataInicio = new Date(startDate);
    const dataFim = new Date(endDate);
    const numeroDias = differenceInDays(dataFim, dataInicio) + 1;

    console.log(`[CEO Fluxo Caixa] Calculando fluxo de caixa direto: ${format(dataInicio, 'dd/MM/yyyy')} a ${format(dataFim, 'dd/MM/yyyy')} (${numeroDias} dias)`);

    const observacoes: string[] = [];
    let qualidade: 'real' | 'parcial' | 'estimado' = 'real';

    // =========================================================================
    // 1) BUSCAR RECEBIMENTOS E PAGAMENTOS (POR DATA DE CAIXA)
    // =========================================================================
    
    const [recebimentosResult, pagamentosResult] = await Promise.allSettled([
      CEOGestaoClickService.getRecebimentos(
        format(dataInicio, 'yyyy-MM-dd'),
        format(dataFim, 'yyyy-MM-dd')
      ),
      CEOGestaoClickService.getPagamentos(
        format(dataInicio, 'yyyy-MM-dd'),
        format(dataFim, 'yyyy-MM-dd')
      )
    ]);

    const recebimentos = recebimentosResult.status === 'fulfilled' ? recebimentosResult.value : [];
    const pagamentos = pagamentosResult.status === 'fulfilled' ? pagamentosResult.value : [];

    const fontesDisponiveis = {
      recebimentos: recebimentosResult.status === 'fulfilled' && recebimentos.length > 0,
      pagamentos: pagamentosResult.status === 'fulfilled' && pagamentos.length > 0
    };

    if (!fontesDisponiveis.recebimentos && !fontesDisponiveis.pagamentos) {
      observacoes.push('Nenhum dado de caixa disponível no período');
      qualidade = 'estimado';
    }

    // =========================================================================
    // 2) CALCULAR TOTAL DE RECEBIMENTOS
    // =========================================================================
    
    const totalRecebimentos = recebimentos.reduce((acc, rec) => {
      return acc + parseValorMonetario(rec.valor_recebido || rec.valor);
    }, 0);

    // =========================================================================
    // 3) CLASSIFICAR E PROCESSAR PAGAMENTOS
    // =========================================================================
    
    const pagamentosClassificados: PagamentoClassificado[] = pagamentos.map(pag => ({
      id: pag.id || '',
      valor: parseValorMonetario(pag.valor_pago || pag.valor),
      descricao: pag.descricao || '',
      planoConta: pag.plano_conta_nome || pag.plano_conta || '',
      classificacao: classificarPlanoContas(pag.plano_conta_nome || pag.plano_conta || ''),
      data: pag.data_pagamento || pag.data || ''
    }));

    // =========================================================================
    // 4) CALCULAR CFO (CASH FLOW FROM OPERATIONS)
    // =========================================================================
    
    const cfo = {
      recebimentosOperacionais: totalRecebimentos,
      pagamentosOperacionais: 0,
      fornecedores: 0,
      folhaPagamento: 0,
      tributosOperacionais: 0,
      outros: 0,
      total: 0
    };

    // Separar pagamentos operacionais
    for (const pag of pagamentosClassificados) {
      // Ignorar investimentos e financiamentos
      if (isInvestimento(pag.classificacao) || isFinanciamento(pag.classificacao)) {
        continue;
      }
      
      // Classificar por tipo de despesa operacional
      if (pag.classificacao === ClassificacaoPlanoContas.IMPOSTO_VENDA ||
          pag.classificacao === ClassificacaoPlanoContas.IMPOSTO_RENDA) {
        cfo.tributosOperacionais += pag.valor;
      } else if (pag.classificacao === ClassificacaoPlanoContas.DESPESA_RH ||
                 pag.planoConta.toLowerCase().includes('salário') ||
                 pag.planoConta.toLowerCase().includes('folha')) {
        cfo.folhaPagamento += pag.valor;
      } else if (pag.descricao.toLowerCase().includes('fornecedor') ||
                 pag.planoConta.toLowerCase().includes('fornecedor')) {
        cfo.fornecedores += pag.valor;
      } else {
        cfo.outros += pag.valor;
      }
      
      cfo.pagamentosOperacionais += pag.valor;
    }
    
    cfo.total = cfo.recebimentosOperacionais - cfo.pagamentosOperacionais;
    
    observacoes.push('CFO: Calculado a partir de recebimentos e pagamentos operacionais');

    // =========================================================================
    // 5) CALCULAR CFI (CASH FLOW FROM INVESTMENTS)
    // =========================================================================
    
    const cfi = {
      capex: 0,
      vendasAtivos: 0,
      outros: 0,
      total: 0
    };

    for (const pag of pagamentosClassificados) {
      if (isInvestimento(pag.classificacao)) {
        // Saída de caixa para investimentos (negativo)
        cfi.capex -= pag.valor;
      }
    }
    
    // Entradas de vendas de ativos (se houver campo específico)
    // Por enquanto, assumir zero
    cfi.vendasAtivos = 0;
    
    cfi.total = cfi.capex + cfi.vendasAtivos + cfi.outros;
    
    if (cfi.capex !== 0) {
      observacoes.push('CFI: Capex identificado por plano de contas');
    } else {
      observacoes.push('CFI: Nenhum investimento identificado no período');
    }

    // =========================================================================
    // 6) CALCULAR CFF (CASH FLOW FROM FINANCING)
    // =========================================================================
    
    const cff = {
      emprestimosRecebidos: 0,
      pagamentoEmprestimos: 0,
      aporteCapital: 0,
      distribuicaoLucros: 0,
      outros: 0,
      total: 0
    };

    for (const pag of pagamentosClassificados) {
      if (isFinanciamento(pag.classificacao)) {
        const planoBaixo = pag.planoConta.toLowerCase();
        const descBaixo = pag.descricao.toLowerCase();
        
        if (planoBaixo.includes('empréstimo') || planoBaixo.includes('financiamento')) {
          if (descBaixo.includes('receb') || descBaixo.includes('entrada')) {
            cff.emprestimosRecebidos += pag.valor; // Positivo
          } else {
            cff.pagamentoEmprestimos -= pag.valor; // Negativo
          }
        } else if (planoBaixo.includes('capital') || planoBaixo.includes('aporte')) {
          cff.aporteCapital += pag.valor; // Positivo
        } else if (planoBaixo.includes('dividendo') || planoBaixo.includes('distribuição')) {
          cff.distribuicaoLucros -= pag.valor; // Negativo
        } else {
          cff.outros += pag.valor;
        }
      }
    }
    
    cff.total = cff.emprestimosRecebidos + cff.pagamentoEmprestimos + 
                cff.aporteCapital + cff.distribuicaoLucros + cff.outros;
    
    if (cff.total !== 0) {
      observacoes.push('CFF: Atividades de financiamento identificadas por plano de contas');
    } else {
      observacoes.push('CFF: Nenhuma atividade de financiamento no período');
    }

    // =========================================================================
    // 7) CALCULAR FCF (FREE CASH FLOW)
    // =========================================================================
    
    const fcf = cfo.total + cfi.capex; // CFO - Capex (capex já é negativo)
    
    observacoes.push(`FCF: R$ ${fcf.toFixed(2)} (CFO - Capex)`);

    // =========================================================================
    // 8) CALCULAR TOTAIS
    // =========================================================================
    
    const totalSaidas = pagamentos.reduce((acc, pag) => {
      return acc + parseValorMonetario(pag.valor_pago || pag.valor);
    }, 0);
    
    const totais = {
      entradas: totalRecebimentos,
      saidas: totalSaidas,
      saldoLiquido: totalRecebimentos - totalSaidas
    };

    // =========================================================================
    // 9) GERAR SÉRIE DIÁRIA
    // =========================================================================
    
    const diasDoIntervalo = eachDayOfInterval({ start: dataInicio, end: dataFim });
    const fluxoDiario = diasDoIntervalo.map(dia => {
      const diaStr = format(dia, 'yyyy-MM-dd');
      
      const entradasDia = recebimentos
        .filter(rec => {
          const dataRec = startOfDay(new Date(rec.data_recebimento || rec.data || diaStr));
          return dataRec.getTime() === startOfDay(dia).getTime();
        })
        .reduce((acc, rec) => acc + parseValorMonetario(rec.valor_recebido || rec.valor), 0);
      
      const saidasDia = pagamentos
        .filter(pag => {
          const dataPag = startOfDay(new Date(pag.data_pagamento || pag.data || diaStr));
          return dataPag.getTime() === startOfDay(dia).getTime();
        })
        .reduce((acc, pag) => acc + parseValorMonetario(pag.valor_pago || pag.valor), 0);
      
      return {
        data: diaStr,
        entradas: entradasDia,
        saidas: saidasDia,
        saldo: entradasDia - saidasDia
      };
    });

    // =========================================================================
    // 10) GERAR SÉRIE MENSAL
    // =========================================================================
    
    const fluxoMensalMap = new Map<string, { cfo: number; cfi: number; cff: number }>();
    
    // Processar recebimentos por mês
    for (const rec of recebimentos) {
      const mes = format(new Date(rec.data_recebimento || rec.data || dataInicio), 'MMM/yyyy', { locale: ptBR });
      const valor = parseValorMonetario(rec.valor_recebido || rec.valor);
      
      if (!fluxoMensalMap.has(mes)) {
        fluxoMensalMap.set(mes, { cfo: 0, cfi: 0, cff: 0 });
      }
      
      const dados = fluxoMensalMap.get(mes)!;
      dados.cfo += valor;
    }
    
    // Processar pagamentos por mês e classificação
    for (const pag of pagamentosClassificados) {
      const mes = format(new Date(pag.data || dataInicio), 'MMM/yyyy', { locale: ptBR });
      
      if (!fluxoMensalMap.has(mes)) {
        fluxoMensalMap.set(mes, { cfo: 0, cfi: 0, cff: 0 });
      }
      
      const dados = fluxoMensalMap.get(mes)!;
      
      if (isInvestimento(pag.classificacao)) {
        dados.cfi -= pag.valor;
      } else if (isFinanciamento(pag.classificacao)) {
        dados.cff -= pag.valor;
      } else {
        dados.cfo -= pag.valor;
      }
    }
    
    const fluxoMensal = Array.from(fluxoMensalMap.entries()).map(([mes, dados]) => ({
      mes,
      cfo: dados.cfo,
      cfi: dados.cfi,
      cff: dados.cff,
      total: dados.cfo + dados.cfi + dados.cff
    }));

    // =========================================================================
    // 11) AGRUPAR POR FORMA DE PAGAMENTO
    // =========================================================================
    
    const formasPagamentoMap = new Map<string, { entradas: number; saidas: number }>();
    
    for (const rec of recebimentos) {
      const forma = rec.forma_pagamento || rec.forma || 'Outros';
      if (!formasPagamentoMap.has(forma)) {
        formasPagamentoMap.set(forma, { entradas: 0, saidas: 0 });
      }
      formasPagamentoMap.get(forma)!.entradas += parseValorMonetario(rec.valor_recebido || rec.valor);
    }
    
    for (const pag of pagamentos) {
      const forma = pag.forma_pagamento || pag.forma || 'Outros';
      if (!formasPagamentoMap.has(forma)) {
        formasPagamentoMap.set(forma, { entradas: 0, saidas: 0 });
      }
      formasPagamentoMap.get(forma)!.saidas += parseValorMonetario(pag.valor_pago || pag.valor);
    }
    
    const formasPagamento = Array.from(formasPagamentoMap.entries()).map(([forma, dados]) => ({
      forma,
      entradas: dados.entradas,
      saidas: dados.saidas,
      saldo: dados.entradas - dados.saidas
    }));

    // =========================================================================
    // 12) MONTAR RESPOSTA
    // =========================================================================
    
    const fluxoCaixa: FluxoCaixaDireto = {
      cfo,
      cfi,
      cff,
      fcf,
      totais,
      fluxoDiario,
      fluxoMensal,
      formasPagamento,
      qualidade,
      observacoes,
      periodo: {
        inicio: format(dataInicio, 'yyyy-MM-dd'),
        fim: format(dataFim, 'yyyy-MM-dd'),
        dias: numeroDias
      },
      lastUpdated: new Date().toISOString(),
      fonte: fontesDisponiveis
    };

    console.log(`[CEO Fluxo Caixa] Fluxo calculado - CFO: R$ ${cfo.total.toFixed(2)}, CFI: R$ ${cfi.total.toFixed(2)}, CFF: R$ ${cff.total.toFixed(2)}, FCF: R$ ${fcf.toFixed(2)}`);

    return NextResponse.json(fluxoCaixa);

  } catch (error: any) {
    console.error('[CEO Fluxo Caixa] Erro:', error);
    return NextResponse.json(
      {
        erro: 'Erro ao calcular fluxo de caixa',
        mensagem: error.message,
        qualidade: 'estimado' as const,
        observacoes: ['Erro ao processar dados: ' + error.message]
      },
      { status: 500 }
    );
  }
}

