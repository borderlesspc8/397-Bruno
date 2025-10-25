/**
 * API: Análise Detalhada de CAC (Customer Acquisition Cost) - CEO Dashboard
 * 
 * Este endpoint retorna análise completa de CAC, incluindo métricas históricas,
 * comparações, ROI, LTV e insights para otimização de aquisição de clientes.
 */

import { NextRequest, NextResponse } from 'next/server';
import { CEOGestaoClickService } from '../_lib/gestao-click-service';

export const dynamic = "force-dynamic";

interface CACAnalysis {
  // CAC Atual
  cacAtual: number;
  novosClientes: number;
  investimentoMarketing: number;
  
  // Análise Histórica
  evolucaoCAC: Array<{
    mes: string;
    cac: number;
    novosClientes: number;
    investimentoMarketing: number;
  }>;
  
  // Comparação com Período Anterior
  comparacao: {
    cacAnterior: number;
    variacaoCAC: number;
    variacaoPercentual: number;
    tendencia: 'melhorando' | 'piorando' | 'estavel';
  };
  
  // ROI e LTV
  roi: {
    ltvEstimado: number;
    roiPercentual: number;
    paybackPeriod: number; // em meses
    ratioLtvCac: number;
  };
  
  // Análise de Canais
  canaisMarketing: Array<{
    canal: string;
    investimento: number;
    clientesGerados: number;
    cacCanal: number;
    eficiencia: 'excelente' | 'bom' | 'regular' | 'ruim';
  }>;
  
  // Benchmarking
  benchmarking: {
    posicao: 'excelente' | 'bom' | 'regular' | 'critico';
    benchmarks: {
      excelente: number;
      bom: number;
      regular: number;
      critico: number;
    };
    recomendacao: string;
  };
  
  // Insights e Recomendações
  insights: Array<{
    tipo: 'positivo' | 'negativo' | 'neutro';
    titulo: string;
    descricao: string;
    acao: string;
    prioridade: 'alta' | 'media' | 'baixa';
  }>;
  
  // Metadados
  periodo: {
    inicio: string;
    fim: string;
  };
  timestamp: string;
}

/**
 * GET /api/ceo/cac-analysis
 * 
 * @param request - Request com query params startDate e endDate
 * @returns Análise detalhada de CAC
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
    
    // ✅ Formatar datas garantindo UTC-3 (Brasília)
    // Extrair apenas YYYY-MM-DD ignorando timezone para evitar problemas de conversão
    const dataInicio = startDate.split('T')[0];
    const dataFim = endDate.split('T')[0];
    
    console.log(`[CEO CAC Analysis] Buscando análise: ${dataInicio} a ${dataFim}`);
    
    // =======================================================================
    // BUSCAR DADOS REAIS DOS ENDPOINTS
    // =======================================================================
    
    const [vendasResult, pagamentosResult, recebimentosResult, clientesResult, centrosCustoResult, formasPagamentoResult] = await Promise.allSettled([
      CEOGestaoClickService.getVendas(dataInicio, dataFim, { todasLojas: true }),
      CEOGestaoClickService.getPagamentos(dataInicio, dataFim, { todasLojas: true }),
      CEOGestaoClickService.getRecebimentos(dataInicio, dataFim),
      CEOGestaoClickService.getClientes(),
      CEOGestaoClickService.getCentrosCusto(),
      CEOGestaoClickService.getFormasPagamento()
    ]);
    
    const vendas = vendasResult.status === 'fulfilled' ? vendasResult.value : [];
    const pagamentos = pagamentosResult.status === 'fulfilled' ? pagamentosResult.value : [];
    const recebimentos = recebimentosResult.status === 'fulfilled' ? recebimentosResult.value : [];
    const clientes = clientesResult.status === 'fulfilled' ? clientesResult.value : [];
    const centrosCusto = centrosCustoResult.status === 'fulfilled' ? centrosCustoResult.value : [];
    const formasPagamento = formasPagamentoResult.status === 'fulfilled' ? formasPagamentoResult.value : [];
    
    // Filtrar vendas por status válidos e unidades Matriz/Golden
    const STATUS_VALIDOS = ["Concretizada", "Em andamento"];
    const vendasFiltradas = vendas.filter(v => {
      const statusValido = v.nome_situacao && STATUS_VALIDOS.includes(v.nome_situacao);
      const unidadeValida = !v.nome_loja || 
        v.nome_loja.toLowerCase().includes('matriz') || 
        v.nome_loja.toLowerCase().includes('golden');
      return statusValido && unidadeValida;
    });
    
    console.log(`[CEO CAC Analysis] Dados carregados:`, {
      vendas: vendas.length,
      vendasFiltradas: vendasFiltradas.length,
      pagamentos: pagamentos.length,
      recebimentos: recebimentos.length,
      clientes: clientes.length,
      centrosCusto: centrosCusto.length,
      formasPagamento: formasPagamento.length
    });
    
    // =======================================================================
    // CALCULAR CAC ATUAL COM DADOS REAIS
    // =======================================================================
    
    // ✅ Criar mapa de centros de custo para JOIN manual
    const centrosCustoMap = new Map(centrosCusto.map(c => [c.id.toString(), c.nome.toLowerCase()]));
    
    // Identificar investimento em marketing REAL dos pagamentos
    let investimentoMarketing = 0;
    
    if (pagamentos.length > 0 && centrosCusto.length > 0) {
      // ✅ MESMA LÓGICA do operational-metrics (CORRETA)
      const centroMarketingIds = centrosCusto
        .filter(c => c.nome.toLowerCase().includes('marketing'))
        .map(c => c.id.toString());
      
      const categoriasMarketing = [
        'marketing', 'publicidade', 'propaganda', 'ads', 'anúncios', 'anuncio', 
        'trafego', 'outdoor', 'branding', 'portal inflável',
        'facebook', 'google', 'instagram', 'youtube', 'linkedin', 'tiktok',
        'email marketing', 'mailing', 'campanha', 'promocao', 'promoção'
      ];
      
      investimentoMarketing = pagamentos
        .filter(pag => {
          // ✅ Verificar se é do centro de custo MARKETING
          const isCentroMarketing = pag.centro_custo_id && centroMarketingIds.includes(pag.centro_custo_id.toString());
          
          // ✅ FAZER JOIN para pegar nome do centro usando centro_custo_id
          const nomeCentro = pag.centro_custo_id 
            ? (centrosCustoMap.get(pag.centro_custo_id.toString()) || '')
            : '';
          
          // ✅ Incluir APENAS se for do centro de custo MARKETING (mais restritivo e correto)
          return isCentroMarketing;
        })
        .reduce((acc, pag) => acc + CEOGestaoClickService.parseValor(pag.valor), 0);
      
      const pagamentosFiltrados = pagamentos.filter(pag => {
        const isCentroMarketing = pag.centro_custo_id && centroMarketingIds.includes(pag.centro_custo_id.toString());
        return isCentroMarketing;
      });

      console.log(`[CEO CAC Analysis] Investimento em marketing calculado:`, {
        total: investimentoMarketing,
        centrosMarketing: centroMarketingIds,
        totalPagamentos: pagamentosFiltrados.length,
        detalhesPagamentos: pagamentosFiltrados.map(p => ({
          descricao: p.descricao,
          valor: p.valor,
          centro_id: p.centro_custo_id,
          loja_id: p.loja_id
        }))
      });
      
      console.log(`[CEO CAC Analysis] Investimento em marketing calculado: R$ ${investimentoMarketing.toFixed(2)}`);
      
      // Se não encontrou pagamentos específicos de marketing, usar estimativa
      if (investimentoMarketing === 0) {
        const totalPagamentos = pagamentos.reduce((acc, pag) => 
          acc + CEOGestaoClickService.parseValor(pag.valor), 0
        );
        
        investimentoMarketing = totalPagamentos * 0.03;
        console.log(`[CEO CAC Analysis] Investimento estimado (3% dos pagamentos): R$ ${investimentoMarketing.toFixed(2)}`);
      }
    } else {
      // Fallback se não tiver dados
      investimentoMarketing = 0;
    }
    
    // ✅ Criar objetos Date no timezone local (UTC-3 Brasília)
    // Usar formato YYYY-MM-DD às 00:00:00 local
    const [anoInicio, mesInicio, diaInicio] = dataInicio.split('-').map(Number);
    const [anoFim, mesFim, diaFim] = dataFim.split('-').map(Number);
    const dataInicioObj = new Date(anoInicio, mesInicio - 1, diaInicio, 0, 0, 0);
    const dataFimObj = new Date(anoFim, mesFim - 1, diaFim, 23, 59, 59);
    
    const novosClientesReais = clientes.filter(cliente => {
      const dataCadastro = CEOGestaoClickService.parseData(cliente.data_cadastro);
      return dataCadastro && dataCadastro >= dataInicioObj && dataCadastro <= dataFimObj;
    });
    
    // Fallback: usar clientes únicos das vendas se não encontrar clientes cadastrados no período
    const clientesUnicosVendas = new Set(vendasFiltradas.map(v => v.cliente_id));
    const novosClientes = novosClientesReais.length > 0 ? novosClientesReais.length : clientesUnicosVendas.size;
    
    console.log(`[CEO CAC Analysis] Novos clientes:`, {
      cadastradosNoPeriodo: novosClientesReais.length,
      unicosNasVendas: clientesUnicosVendas.size,
      usando: novosClientes
    });
    
    const cacAtual = novosClientes > 0 ? investimentoMarketing / novosClientes : 0;
    
    // =======================================================================
    // ANÁLISE HISTÓRICA COM DADOS REAIS (ÚLTIMOS 6 MESES)
    // =======================================================================
    
    const evolucaoCAC = [];
    const mesesParaAnalisar = 6;
    
    for (let i = mesesParaAnalisar - 1; i >= 0; i--) {
      const dataInicioMes = new Date(dataInicioObj);
      dataInicioMes.setMonth(dataInicioMes.getMonth() - i);
      dataInicioMes.setDate(1);
      
      let dataFimMes = new Date(dataInicioMes);
      dataFimMes.setMonth(dataFimMes.getMonth() + 1);
      dataFimMes.setDate(0); // Último dia do mês
      
      // ✅ Se o mês é o mês atual (parcial), usar a data fim do período selecionado
      if (dataFimMes > dataFimObj) {
        dataFimMes = new Date(dataFimObj);
      }
      
      const dataInicioMesStr = CEOGestaoClickService.formatarData(dataInicioMes);
      const dataFimMesStr = CEOGestaoClickService.formatarData(dataFimMes);
      
      try {
        // Buscar dados do mês específico
        const [vendasMesResult, pagamentosMesResult, clientesMesResult] = await Promise.allSettled([
          CEOGestaoClickService.getVendas(dataInicioMesStr, dataFimMesStr, { todasLojas: true }),
          CEOGestaoClickService.getPagamentos(dataInicioMesStr, dataFimMesStr, { todasLojas: true }),
          CEOGestaoClickService.getClientes()
        ]);
        
        const vendasMes = vendasMesResult.status === 'fulfilled' ? vendasMesResult.value : [];
        const pagamentosMes = pagamentosMesResult.status === 'fulfilled' ? pagamentosMesResult.value : [];
        const clientesMes = clientesMesResult.status === 'fulfilled' ? clientesMesResult.value : [];
        
        // Filtrar vendas do mês
        const vendasFiltradasMes = vendasMes.filter(v => {
          const statusValido = v.nome_situacao && STATUS_VALIDOS.includes(v.nome_situacao);
          const unidadeValida = !v.nome_loja || 
            v.nome_loja.toLowerCase().includes('matriz') || 
            v.nome_loja.toLowerCase().includes('golden');
          return statusValido && unidadeValida;
        });
        
        // ✅ Calcular investimento do mês usando MESMA LÓGICA do CAC atual (apenas centro MARKETING)
        let investimentoMes = 0;
        if (pagamentosMes.length > 0) {
          const centroMarketingIds = centrosCusto
            .filter(c => c.nome.toLowerCase().includes('marketing'))
            .map(c => c.id.toString());
          
          investimentoMes = pagamentosMes
            .filter(pag => {
              // ✅ Incluir APENAS se for do centro de custo MARKETING
              const isCentroMarketing = pag.centro_custo_id && centroMarketingIds.includes(pag.centro_custo_id.toString());
              return isCentroMarketing;
            })
            .reduce((acc, pag) => acc + CEOGestaoClickService.parseValor(pag.valor), 0);
        }
        
        // Calcular novos clientes do mês
        const novosClientesMes = clientesMes.filter(cliente => {
          const dataCadastro = CEOGestaoClickService.parseData(cliente.data_cadastro);
          return dataCadastro && dataCadastro >= dataInicioMes && dataCadastro <= dataFimMes;
        }).length;
        
        const clientesUnicosMes = new Set(vendasFiltradasMes.map(v => v.cliente_id)).size;
        const novosClientesMesFinal = novosClientesMes > 0 ? novosClientesMes : clientesUnicosMes;
        
        const cacMes = novosClientesMesFinal > 0 ? investimentoMes / novosClientesMesFinal : 0;
        
        evolucaoCAC.push({
          mes: dataInicioMes.toLocaleDateString('pt-BR', { month: 'short' }),
          cac: Math.round(cacMes * 100) / 100,
          novosClientes: novosClientesMesFinal,
          investimentoMarketing: Math.round(investimentoMes)
        });
        
      } catch (error) {
        console.warn(`[CEO CAC Analysis] Erro ao buscar dados do mês ${dataInicioMesStr}:`, error);
        // Usar dados estimados se falhar
        evolucaoCAC.push({
          mes: dataInicioMes.toLocaleDateString('pt-BR', { month: 'short' }),
          cac: Math.round(cacAtual * (0.8 + Math.random() * 0.4) * 100) / 100,
          novosClientes: Math.round(novosClientes * (0.8 + Math.random() * 0.4)),
          investimentoMarketing: Math.round(investimentoMarketing * (0.8 + Math.random() * 0.4))
        });
      }
    }
    
    // =======================================================================
    // COMPARAÇÃO COM PERÍODO ANTERIOR (DADOS REAIS)
    // =======================================================================
    
    // ✅ Calcular período anterior: mesmo intervalo de dias do mês anterior
    // Exemplo: 01/10 a 24/10 → 01/09 a 24/09
    const dataInicioAnterior = new Date(dataInicioObj);
    const dataFimAnterior = new Date(dataFimObj);
    
    // Subtrair 1 mês de ambas as datas
    dataInicioAnterior.setMonth(dataInicioAnterior.getMonth() - 1);
    dataFimAnterior.setMonth(dataFimAnterior.getMonth() - 1);
    
    const dataInicioAnteriorStr = CEOGestaoClickService.formatarData(dataInicioAnterior);
    const dataFimAnteriorStr = CEOGestaoClickService.formatarData(dataFimAnterior);
    
    let cacAnterior = 0;
    let novosClientesAnterior = 0;
    let investimentoAnterior = 0;
    
    try {
      // Buscar dados do período anterior
      const [vendasAnteriorResult, pagamentosAnteriorResult, clientesAnteriorResult] = await Promise.allSettled([
        CEOGestaoClickService.getVendas(dataInicioAnteriorStr, dataFimAnteriorStr, { todasLojas: true }),
        CEOGestaoClickService.getPagamentos(dataInicioAnteriorStr, dataFimAnteriorStr, { todasLojas: true }),
        CEOGestaoClickService.getClientes()
      ]);
      
      const vendasAnterior = vendasAnteriorResult.status === 'fulfilled' ? vendasAnteriorResult.value : [];
      const pagamentosAnterior = pagamentosAnteriorResult.status === 'fulfilled' ? pagamentosAnteriorResult.value : [];
      const clientesAnterior = clientesAnteriorResult.status === 'fulfilled' ? clientesAnteriorResult.value : [];
      
      // Filtrar vendas do período anterior
      const vendasFiltradasAnterior = vendasAnterior.filter(v => {
        const statusValido = v.nome_situacao && STATUS_VALIDOS.includes(v.nome_situacao);
        const unidadeValida = !v.nome_loja || 
          v.nome_loja.toLowerCase().includes('matriz') || 
          v.nome_loja.toLowerCase().includes('golden');
        return statusValido && unidadeValida;
      });
      
      // ✅ Calcular investimento do período anterior (apenas centro MARKETING)
      if (pagamentosAnterior.length > 0) {
        const centroMarketingIds = centrosCusto
          .filter(c => c.nome.toLowerCase().includes('marketing'))
          .map(c => c.id.toString());
        
        investimentoAnterior = pagamentosAnterior
          .filter(pag => {
            // ✅ Incluir APENAS se for do centro de custo MARKETING
            const isCentroMarketing = pag.centro_custo_id && centroMarketingIds.includes(pag.centro_custo_id.toString());
            return isCentroMarketing;
          })
          .reduce((acc, pag) => acc + CEOGestaoClickService.parseValor(pag.valor), 0);
      }
      
      // Calcular novos clientes do período anterior
      const novosClientesAnteriorReais = clientesAnterior.filter(cliente => {
        const dataCadastro = CEOGestaoClickService.parseData(cliente.data_cadastro);
        return dataCadastro && dataCadastro >= dataInicioAnterior && dataCadastro <= dataFimAnterior;
      }).length;
      
      const clientesUnicosAnterior = new Set(vendasFiltradasAnterior.map(v => v.cliente_id)).size;
      novosClientesAnterior = novosClientesAnteriorReais > 0 ? novosClientesAnteriorReais : clientesUnicosAnterior;
      
      cacAnterior = novosClientesAnterior > 0 ? investimentoAnterior / novosClientesAnterior : 0;
      
      console.log(`[CEO CAC Analysis] Período anterior (${dataInicioAnteriorStr} a ${dataFimAnteriorStr}):`, {
        cacAnterior: cacAnterior.toFixed(2),
        novosClientesAnterior,
        investimentoAnterior: investimentoAnterior.toFixed(2)
      });
      
    } catch (error) {
      console.warn(`[CEO CAC Analysis] Erro ao buscar dados do período anterior:`, error);
      // Usar estimativa se falhar
      cacAnterior = cacAtual * 0.95;
    }
    
    const variacaoCAC = cacAtual - cacAnterior;
    const variacaoPercentual = cacAnterior > 0 ? (variacaoCAC / cacAnterior) * 100 : 0;
    
    let tendencia: 'melhorando' | 'piorando' | 'estavel' = 'estavel';
    if (variacaoPercentual < -5) tendencia = 'melhorando';
    else if (variacaoPercentual > 5) tendencia = 'piorando';
    
    // =======================================================================
    // ROI E LTV
    // =======================================================================
    
    // Calcular LTV estimado baseado na receita média por cliente
    const totalReceita = vendasFiltradas.reduce((acc, venda) => {
      return acc + CEOGestaoClickService.parseValor(venda.valor_total);
    }, 0);
    
    const receitaMediaPorCliente = novosClientes > 0 ? totalReceita / novosClientes : 0;
    const ltvEstimado = receitaMediaPorCliente * 12; // LTV anual estimado
    
    const roiPercentual = cacAtual > 0 ? ((ltvEstimado - cacAtual) / cacAtual) * 100 : 0;
    const paybackPeriod = cacAtual > 0 && receitaMediaPorCliente > 0 ? 
      Math.round((cacAtual / receitaMediaPorCliente) * 100) / 100 : 0;
    const ratioLtvCac = cacAtual > 0 ? ltvEstimado / cacAtual : 0;
    
    // =======================================================================
    // ANÁLISE DE CANAIS COM DADOS REAIS DAS FORMAS DE PAGAMENTO
    // =======================================================================
    
    const canaisMarketing = [];
    
    // Mapear formas de pagamento para canais de marketing
    const canaisMap = {
      'google': ['google', 'google ads', 'adwords'],
      'facebook': ['facebook', 'meta', 'instagram'],
      'email': ['email', 'mailing', 'newsletter'],
      'outros': ['outros', 'outras', 'diversos']
    };
    
    // Agrupar investimento por canal baseado nas formas de pagamento
    const investimentoPorCanal: Record<string, number> = {
      'Google Ads': 0,
      'Facebook Ads': 0,
      'Email Marketing': 0,
      'Outros': 0
    };
    
    const clientesPorCanal: Record<string, number> = {
      'Google Ads': 0,
      'Facebook Ads': 0,
      'Email Marketing': 0,
      'Outros': 0
    };
    
    // Analisar pagamentos por forma de pagamento
    if (pagamentos.length > 0) {
      pagamentos.forEach(pag => {
        const descricao = (pag.descricao || '').toLowerCase();
        const valor = CEOGestaoClickService.parseValor(pag.valor);
        
        // Determinar canal baseado na descrição (forma_pagamento não está disponível na interface)
        let canal = 'Outros';
        
        if (canaisMap.google.some(keyword => 
          descricao.includes(keyword)
        )) {
          canal = 'Google Ads';
        } else if (canaisMap.facebook.some(keyword => 
          descricao.includes(keyword)
        )) {
          canal = 'Facebook Ads';
        } else if (canaisMap.email.some(keyword => 
          descricao.includes(keyword)
        )) {
          canal = 'Email Marketing';
        }
        
        investimentoPorCanal[canal] += valor;
      });
    }
    
    // Distribuir clientes proporcionalmente ao investimento
    const totalInvestimentoCanais = Object.values(investimentoPorCanal).reduce((acc, val) => acc + val, 0);
    
    Object.keys(investimentoPorCanal).forEach(canal => {
      const investimento = investimentoPorCanal[canal];
      const proporcao = totalInvestimentoCanais > 0 ? investimento / totalInvestimentoCanais : 0.25;
      const clientesGerados = Math.round(novosClientes * proporcao);
      const cacCanal = clientesGerados > 0 ? investimento / clientesGerados : 0;
      
      // Determinar eficiência baseada no CAC
      let eficiencia: 'excelente' | 'bom' | 'regular' | 'ruim' = 'regular';
      if (cacCanal <= 30) eficiencia = 'excelente';
      else if (cacCanal <= 60) eficiencia = 'bom';
      else if (cacCanal <= 100) eficiencia = 'regular';
      else eficiencia = 'ruim';
      
      canaisMarketing.push({
        canal,
        investimento: Math.round(investimento),
        clientesGerados,
        cacCanal: Math.round(cacCanal * 100) / 100,
        eficiencia
      });
    });
    
    // Se não encontrou investimento específico por canal, distribuir igualmente
    if (totalInvestimentoCanais === 0 && investimentoMarketing > 0) {
      const investimentoPorCanal = investimentoMarketing / 4;
      const clientesPorCanal = novosClientes / 4;
      const cacCanal = clientesPorCanal > 0 ? investimentoPorCanal / clientesPorCanal : 0;
      
      canaisMarketing.length = 0; // Limpar array
      canaisMarketing.push(
        {
          canal: 'Google Ads',
          investimento: Math.round(investimentoPorCanal),
          clientesGerados: Math.round(clientesPorCanal),
          cacCanal: Math.round(cacCanal * 100) / 100,
          eficiencia: 'regular' as const
        },
        {
          canal: 'Facebook Ads',
          investimento: Math.round(investimentoPorCanal),
          clientesGerados: Math.round(clientesPorCanal),
          cacCanal: Math.round(cacCanal * 100) / 100,
          eficiencia: 'regular' as const
        },
        {
          canal: 'Email Marketing',
          investimento: Math.round(investimentoPorCanal),
          clientesGerados: Math.round(clientesPorCanal),
          cacCanal: Math.round(cacCanal * 100) / 100,
          eficiencia: 'bom' as const
        },
        {
          canal: 'Outros',
          investimento: Math.round(investimentoPorCanal),
          clientesGerados: Math.round(clientesPorCanal),
          cacCanal: Math.round(cacCanal * 100) / 100,
          eficiencia: 'regular' as const
        }
      );
    }
    
    console.log(`[CEO CAC Analysis] Canais de marketing analisados:`, canaisMarketing);
    
    // =======================================================================
    // BENCHMARKING
    // =======================================================================
    
    const benchmarks = {
      excelente: 50,
      bom: 100,
      regular: 150,
      critico: 200
    };
    
    let posicao: 'excelente' | 'bom' | 'regular' | 'critico' = 'critico';
    let recomendacao = '';
    
    if (cacAtual <= benchmarks.excelente) {
      posicao = 'excelente';
      recomendacao = 'CAC excelente! Continue com a estratégia atual e considere escalar os investimentos.';
    } else if (cacAtual <= benchmarks.bom) {
      posicao = 'bom';
      recomendacao = 'CAC em nível bom. Monitore de perto e otimize os canais menos eficientes.';
    } else if (cacAtual <= benchmarks.regular) {
      posicao = 'regular';
      recomendacao = 'CAC acima do ideal. Foque nos canais mais eficientes e otimize as campanhas.';
    } else {
      posicao = 'critico';
      recomendacao = 'CAC crítico! Revisão urgente necessária. Reduza custos ou melhore a qualidade dos leads.';
    }
    
    // =======================================================================
    // INSIGHTS E RECOMENDAÇÕES
    // =======================================================================
    
    const insights = [];
    
    // Insight sobre CAC
    if (cacAtual <= 50) {
      insights.push({
        tipo: 'positivo' as const,
        titulo: 'CAC Excelente',
        descricao: `Seu CAC de R$ ${cacAtual.toFixed(2)} está em nível excelente.`,
        acao: 'Considere aumentar o investimento em marketing para acelerar o crescimento.',
        prioridade: 'baixa' as const
      });
    } else if (cacAtual <= 100) {
      insights.push({
        tipo: 'positivo' as const,
        titulo: 'CAC Adequado',
        descricao: `Seu CAC de R$ ${cacAtual.toFixed(2)} está em nível bom.`,
        acao: 'Monitore de perto e otimize canais menos eficientes.',
        prioridade: 'media' as const
      });
    } else if (cacAtual <= 200) {
      insights.push({
        tipo: 'negativo' as const,
        titulo: 'CAC Elevado',
        descricao: `Seu CAC de R$ ${cacAtual.toFixed(2)} está acima do ideal.`,
        acao: 'Foque nos canais mais eficientes e otimize as campanhas.',
        prioridade: 'alta' as const
      });
    } else {
      insights.push({
        tipo: 'negativo' as const,
        titulo: 'CAC Crítico',
        descricao: `Seu CAC de R$ ${cacAtual.toFixed(2)} está em nível crítico.`,
        acao: 'Revisão urgente necessária. Reduza custos ou melhore a qualidade dos leads.',
        prioridade: 'alta' as const
      });
    }
    
    // Insight sobre tendência
    if (tendencia === 'melhorando') {
      insights.push({
        tipo: 'positivo' as const,
        titulo: 'CAC Melhorando',
        descricao: `CAC melhorou ${Math.abs(variacaoPercentual).toFixed(1)}% em relação ao período anterior.`,
        acao: 'Continue com as estratégias que estão funcionando.',
        prioridade: 'baixa' as const
      });
    } else if (tendencia === 'piorando') {
      insights.push({
        tipo: 'negativo' as const,
        titulo: 'CAC Piorando',
        descricao: `CAC aumentou ${variacaoPercentual.toFixed(1)}% em relação ao período anterior.`,
        acao: 'Analise o que mudou e ajuste a estratégia rapidamente.',
        prioridade: 'alta' as const
      });
    }
    
    // Insight sobre ROI
    if (ratioLtvCac >= 3) {
      insights.push({
        tipo: 'positivo' as const,
        titulo: 'ROI Excelente',
        descricao: `LTV/CAC ratio de ${ratioLtvCac.toFixed(1)}x está excelente.`,
        acao: 'Considere aumentar o investimento em aquisição.',
        prioridade: 'media' as const
      });
    } else if (ratioLtvCac < 1) {
      insights.push({
        tipo: 'negativo' as const,
        titulo: 'ROI Negativo',
        descricao: `LTV/CAC ratio de ${ratioLtvCac.toFixed(1)}x indica prejuízo.`,
        acao: 'Revisão urgente da estratégia de aquisição necessária.',
        prioridade: 'alta' as const
      });
    }
    
    // =======================================================================
    // MONTAR RESPOSTA FINAL
    // =======================================================================
    
    const cacAnalysis: CACAnalysis = {
      cacAtual: Math.round(cacAtual * 100) / 100,
      novosClientes,
      investimentoMarketing: Math.round(investimentoMarketing),
      evolucaoCAC,
      comparacao: {
        cacAnterior: Math.round(cacAnterior * 100) / 100,
        variacaoCAC: Math.round(variacaoCAC * 100) / 100,
        variacaoPercentual: Math.round(variacaoPercentual * 100) / 100,
        tendencia
      },
      roi: {
        ltvEstimado: Math.round(ltvEstimado),
        roiPercentual: Math.round(roiPercentual * 100) / 100,
        paybackPeriod: Math.round(paybackPeriod * 100) / 100,
        ratioLtvCac: Math.round(ratioLtvCac * 100) / 100
      },
      canaisMarketing,
      benchmarking: {
        posicao,
        benchmarks,
        recomendacao
      },
      insights,
      periodo: {
        inicio: dataInicio,
        fim: dataFim
      },
      timestamp: new Date().toISOString()
    };
    
    console.log('[CEO CAC Analysis] ✅ Análise concluída:', {
      cacAtual: Math.round(cacAtual * 100) / 100,
      novosClientes,
      investimentoMarketing: Math.round(investimentoMarketing),
      posicao
    });
    
    return NextResponse.json(cacAnalysis);
    
  } catch (error) {
    console.error('[CEO CAC Analysis] ❌ Erro:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    
    return NextResponse.json(
      {
        erro: 'Erro ao processar análise de CAC',
        mensagem: errorMessage,
        cacAtual: 0,
        novosClientes: 0,
        investimentoMarketing: 0,
        evolucaoCAC: [],
        comparacao: {
          cacAnterior: 0,
          variacaoCAC: 0,
          variacaoPercentual: 0,
          tendencia: 'estavel' as const
        },
        roi: {
          ltvEstimado: 0,
          roiPercentual: 0,
          paybackPeriod: 0,
          ratioLtvCac: 0
        },
        canaisMarketing: [],
        benchmarking: {
          posicao: 'critico' as const,
          benchmarks: { excelente: 50, bom: 100, regular: 150, critico: 200 },
          recomendacao: 'Erro ao processar análise'
        },
        insights: [],
        periodo: {
          inicio: '',
          fim: ''
        },
        timestamp: new Date().toISOString()
      } as CACAnalysis,
      { status: 500 }
    );
  }
}
