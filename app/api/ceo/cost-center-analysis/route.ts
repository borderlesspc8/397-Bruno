/**
 * API: Análise de Centro de Custo Específico - CEO Dashboard
 * 
 * Este endpoint retorna dados detalhados de um centro de custo específico,
 * incluindo pagamentos, receitas e análises de performance.
 */

import { NextRequest, NextResponse } from 'next/server';
import { format } from 'date-fns';
import { CEOGestaoClickService } from '../_lib/gestao-click-service';

export const dynamic = "force-dynamic";

interface CostCenterAnalysis {
  // Identificação
  centroCustoId: string;
  centroCustoNome: string;
  
  // Totais
  totalPagamentos: number;
  quantidadePagamentos: number;
  ticketMedio: number;
  
  // Pagamentos Detalhados
  pagamentos: Array<{
    id: string;
    descricao: string;
    valor: number;
    data: string;
    formaPagamento: string;
    fornecedor: string;
    planoConta: string;
  }>;
  
  // Análise Temporal
  evolucaoMensal: Array<{
    mes: string;
    total: number;
    quantidade: number;
  }>;
  
  // Formas de Pagamento
  formasPagamento: Array<{
    forma: string;
    valor: number;
    percentual: number;
    quantidade: number;
  }>;
  
  // Fornecedores
  fornecedores: Array<{
    nome: string;
    valor: number;
    percentual: number;
    quantidade: number;
  }>;
  
  // Planos de Conta
  planosContas: Array<{
    nome: string;
    valor: number;
    percentual: number;
    quantidade: number;
  }>;
  
  // Metadados
  periodo: {
    inicio: string;
    fim: string;
  };
  timestamp: string;
}

/**
 * GET /api/ceo/cost-center-analysis
 * 
 * @param request - Request com query params startDate, endDate e centroCustoId
 * @returns Análise detalhada do centro de custo
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const centroCustoId = searchParams.get('centroCustoId');
    
    // Validar parâmetros
    if (!startDate || !endDate) {
      return NextResponse.json(
        {
          erro: 'Parâmetros startDate e endDate são obrigatórios',
          message: 'Formato esperado: ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&centroCustoId=ID'
        },
        { status: 400 }
      );
    }
    
    // Formatar datas
    const dataInicio = format(new Date(startDate), 'yyyy-MM-dd');
    const dataFim = format(new Date(endDate), 'yyyy-MM-dd');
    
    console.log(`[CEO Cost Center Analysis] Buscando dados: ${dataInicio} a ${dataFim}`, {
      centroCustoId: centroCustoId || 'TODOS'
    });
    
    // =======================================================================
    // BUSCAR PAGAMENTOS
    // =======================================================================
    
    const pagamentos = await CEOGestaoClickService.getPagamentos(dataInicio, dataFim);
    
    // Filtrar por centro de custo se especificado
    let pagamentosFiltrados = pagamentos;
    if (centroCustoId && centroCustoId !== 'TODOS') {
      pagamentosFiltrados = pagamentos.filter(p => p.centro_custo_id === centroCustoId);
    }
    
    console.log('[CEO Cost Center Analysis] Pagamentos filtrados:', {
      total: pagamentos.length,
      filtrados: pagamentosFiltrados.length
    });
    
    // Se não houver pagamentos, retornar dados zerados
    if (pagamentosFiltrados.length === 0) {
      return NextResponse.json({
        centroCustoId: centroCustoId || 'TODOS',
        centroCustoNome: 'Sem dados',
        totalPagamentos: 0,
        quantidadePagamentos: 0,
        ticketMedio: 0,
        pagamentos: [],
        evolucaoMensal: [],
        formasPagamento: [],
        fornecedores: [],
        planosContas: [],
        periodo: {
          inicio: dataInicio,
          fim: dataFim
        },
        timestamp: new Date().toISOString()
      } as CostCenterAnalysis);
    }
    
    // =======================================================================
    // CALCULAR TOTAIS
    // =======================================================================
    
    const totalPagamentos = pagamentosFiltrados.reduce((acc, pag) => {
      return acc + CEOGestaoClickService.parseValor(pag.valor);
    }, 0);
    
    const quantidadePagamentos = pagamentosFiltrados.length;
    const ticketMedio = quantidadePagamentos > 0 ? totalPagamentos / quantidadePagamentos : 0;
    
    // Nome do centro de custo (pegar do primeiro pagamento)
    const centroCustoNome = pagamentosFiltrados[0]?.nome_centro_custo || 'Não especificado';
    
    // =======================================================================
    // PAGAMENTOS DETALHADOS
    // =======================================================================
    
    const pagamentosDetalhados = pagamentosFiltrados.map(pag => ({
      id: pag.id,
      descricao: pag.descricao || 'Sem descrição',
      valor: CEOGestaoClickService.parseValor(pag.valor),
      data: pag.data_liquidacao || pag.data_vencimento || dataInicio,
      formaPagamento: pag.nome_forma_pagamento || 'Não especificado',
      fornecedor: pag.nome_fornecedor || 'Não especificado',
      planoConta: pag.nome_plano_conta || 'Não especificado'
    })).sort((a, b) => b.valor - a.valor); // Ordenar por valor
    
    // =======================================================================
    // EVOLUÇÃO MENSAL
    // =======================================================================
    
    const evolucaoMap = new Map<string, { total: number; quantidade: number }>();
    
    pagamentosFiltrados.forEach(pag => {
      const data = pag.data_liquidacao || pag.data_vencimento || dataInicio;
      const mes = format(new Date(data), 'MMM/yyyy');
      
      if (!evolucaoMap.has(mes)) {
        evolucaoMap.set(mes, { total: 0, quantidade: 0 });
      }
      
      const evolucao = evolucaoMap.get(mes)!;
      evolucao.total += CEOGestaoClickService.parseValor(pag.valor);
      evolucao.quantidade += 1;
    });
    
    const evolucaoMensal = Array.from(evolucaoMap.entries()).map(([mes, data]) => ({
      mes,
      total: Math.round(data.total),
      quantidade: data.quantidade
    })).sort((a, b) => a.mes.localeCompare(b.mes));
    
    // =======================================================================
    // FORMAS DE PAGAMENTO
    // =======================================================================
    
    const formasPagamentoMap = new Map<string, { valor: number; quantidade: number }>();
    
    pagamentosFiltrados.forEach(pag => {
      const forma = pag.nome_forma_pagamento || 'Não especificado';
      
      if (!formasPagamentoMap.has(forma)) {
        formasPagamentoMap.set(forma, { valor: 0, quantidade: 0 });
      }
      
      const formaData = formasPagamentoMap.get(forma)!;
      formaData.valor += CEOGestaoClickService.parseValor(pag.valor);
      formaData.quantidade += 1;
    });
    
    const formasPagamento = Array.from(formasPagamentoMap.entries()).map(([forma, data]) => ({
      forma,
      valor: Math.round(data.valor),
      percentual: totalPagamentos > 0 ? Math.round((data.valor / totalPagamentos) * 100 * 100) / 100 : 0,
      quantidade: data.quantidade
    })).sort((a, b) => b.valor - a.valor);
    
    // =======================================================================
    // FORNECEDORES
    // =======================================================================
    
    const fornecedoresMap = new Map<string, { valor: number; quantidade: number }>();
    
    pagamentosFiltrados.forEach(pag => {
      const fornecedor = pag.nome_fornecedor || 'Não especificado';
      
      if (!fornecedoresMap.has(fornecedor)) {
        fornecedoresMap.set(fornecedor, { valor: 0, quantidade: 0 });
      }
      
      const fornecedorData = fornecedoresMap.get(fornecedor)!;
      fornecedorData.valor += CEOGestaoClickService.parseValor(pag.valor);
      fornecedorData.quantidade += 1;
    });
    
    const fornecedores = Array.from(fornecedoresMap.entries()).map(([nome, data]) => ({
      nome,
      valor: Math.round(data.valor),
      percentual: totalPagamentos > 0 ? Math.round((data.valor / totalPagamentos) * 100 * 100) / 100 : 0,
      quantidade: data.quantidade
    })).sort((a, b) => b.valor - a.valor).slice(0, 10); // Top 10 fornecedores
    
    // =======================================================================
    // PLANOS DE CONTAS
    // =======================================================================
    
    const planosContasMap = new Map<string, { valor: number; quantidade: number }>();
    
    pagamentosFiltrados.forEach(pag => {
      const planoConta = pag.nome_plano_conta || 'Não especificado';
      
      if (!planosContasMap.has(planoConta)) {
        planosContasMap.set(planoConta, { valor: 0, quantidade: 0 });
      }
      
      const planoData = planosContasMap.get(planoConta)!;
      planoData.valor += CEOGestaoClickService.parseValor(pag.valor);
      planoData.quantidade += 1;
    });
    
    const planosContas = Array.from(planosContasMap.entries()).map(([nome, data]) => ({
      nome,
      valor: Math.round(data.valor),
      percentual: totalPagamentos > 0 ? Math.round((data.valor / totalPagamentos) * 100 * 100) / 100 : 0,
      quantidade: data.quantidade
    })).sort((a, b) => b.valor - a.valor);
    
    // =======================================================================
    // MONTAR RESPOSTA FINAL
    // =======================================================================
    
    const analysis: CostCenterAnalysis = {
      centroCustoId: centroCustoId || 'TODOS',
      centroCustoNome,
      totalPagamentos: Math.round(totalPagamentos),
      quantidadePagamentos,
      ticketMedio: Math.round(ticketMedio),
      pagamentos: pagamentosDetalhados.slice(0, 50), // Limitar a 50 últimos
      evolucaoMensal,
      formasPagamento,
      fornecedores,
      planosContas,
      periodo: {
        inicio: dataInicio,
        fim: dataFim
      },
      timestamp: new Date().toISOString()
    };
    
    console.log('[CEO Cost Center Analysis] ✅ Análise concluída:', {
      centroCusto: centroCustoNome,
      totalPagamentos: Math.round(totalPagamentos),
      quantidade: quantidadePagamentos
    });
    
    return NextResponse.json(analysis);
    
  } catch (error) {
    console.error('[CEO Cost Center Analysis] ❌ Erro:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    
    return NextResponse.json(
      {
        erro: 'Erro ao processar análise de centro de custo',
        mensagem: errorMessage,
        centroCustoId: '',
        centroCustoNome: '',
        totalPagamentos: 0,
        quantidadePagamentos: 0,
        ticketMedio: 0,
        pagamentos: [],
        evolucaoMensal: [],
        formasPagamento: [],
        fornecedores: [],
        planosContas: [],
        periodo: {
          inicio: '',
          fim: ''
        },
        timestamp: new Date().toISOString()
      } as CostCenterAnalysis,
      { status: 500 }
    );
  }
}

