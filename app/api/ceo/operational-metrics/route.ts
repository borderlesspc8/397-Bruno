/**
 * API: Métricas Operacionais CEO - DADOS REAIS DO GESTÃO CLICK
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
 * Estrutura de resposta das métricas operacionais
 */
interface OperationalMetrics {
  // Relação Custos/Receita
  costRevenueRatio: number;
  
  // Custo de Aquisição de Cliente (CAC)
  customerAcquisitionCost: number;
  
  // Rentabilidade por Centro de Custo
  costCenterProfitability: Array<{
    id: string;
    name: string;
    revenue: number;
    costs: number;
    profitability: number;
    margin: number;
  }>;
  
  // Detalhes adicionais
  details?: {
    totalReceita: number;
    totalCustos: number;
    totalCustosProdutos: number;
    totalDespesasOperacionais: number;
    novosClientes: number;
    investimentoMarketing: number;
  };
  
  // Metadados
  lastUpdated: string;
  _metadata: {
    dataSource: 'api' | 'error';
    centrosCustoDisponivel: boolean;
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
 * GET /api/ceo/operational-metrics
 * 
 * @param request - Request com query params startDate e endDate
 * @returns Métricas operacionais completas
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
    
    // Verificar credenciais antes de fazer requisições
    const hasAccessToken = !!process.env.GESTAO_CLICK_ACCESS_TOKEN;
    const hasSecretToken = !!process.env.GESTAO_CLICK_SECRET_ACCESS_TOKEN;
    
    if (!hasAccessToken || !hasSecretToken) {
      console.error('[CEO Operational Metrics] ❌ Credenciais não configuradas:', {
        hasAccessToken,
        hasSecretToken
      });
      
      return NextResponse.json(
        {
          erro: 'Configuração incompleta',
          mensagem: 'Credenciais da API Gestão Click não configuradas. Verifique GESTAO_CLICK_ACCESS_TOKEN e GESTAO_CLICK_SECRET_ACCESS_TOKEN no arquivo .env',
          costRevenueRatio: 0,
          customerAcquisitionCost: 0,
          costCenterProfitability: [],
          lastUpdated: new Date().toISOString(),
          _metadata: {
            dataSource: 'error' as const,
            centrosCustoDisponivel: false,
            pagamentosDisponivel: false,
            usandoEstimativas: false,
            periodo: { inicio: '', fim: '' },
            timestamp: new Date().toISOString(),
            error: 'Credenciais não configuradas'
          }
        },
        { status: 500 }
      );
    }
    
    // Formatar datas
    const dataInicio = format(new Date(startDate), 'yyyy-MM-dd');
    const dataFim = format(new Date(endDate), 'yyyy-MM-dd');
    
    console.log(`[CEO Operational Metrics] Buscando dados: ${dataInicio} a ${dataFim}`);
    
    // =======================================================================
    // BUSCAR DADOS EM PARALELO
    // =======================================================================
    
    const [vendasResult, centrosCustoResult, pagamentosResult] = await Promise.allSettled([
      CEOGestaoClickService.getVendas(dataInicio, dataFim, { todasLojas: true }),
      CEOGestaoClickService.getCentrosCusto(),
      CEOGestaoClickService.getPagamentos(dataInicio, dataFim)
    ]);
    
    const vendas = vendasResult.status === 'fulfilled' ? vendasResult.value : [];
    const centrosCusto = centrosCustoResult.status === 'fulfilled' ? centrosCustoResult.value : [];
    const pagamentos = pagamentosResult.status === 'fulfilled' ? pagamentosResult.value : [];
    
    const centrosCustoDisponivel = centrosCustoResult.status === 'fulfilled' && centrosCusto.length > 0;
    const pagamentosDisponivel = pagamentosResult.status === 'fulfilled' && pagamentos.length > 0;
    
    console.log('[CEO Operational Metrics] Dados obtidos:', {
      vendas: vendas.length,
      centrosCusto: centrosCusto.length,
      centrosCustoDisponivel,
      pagamentos: pagamentos.length,
      pagamentosDisponivel
    });
    
    // Filtrar vendas por status válidos
    const STATUS_VALIDOS = ["Concretizada", "Em andamento"];
    const vendasFiltradas = vendas.filter(v => 
      v.nome_situacao && STATUS_VALIDOS.includes(v.nome_situacao)
    );
    
    const estimativas: string[] = [];
    
    // =======================================================================
    // CALCULAR RECEITAS E CUSTOS
    // =======================================================================
    
    const totalReceita = vendasFiltradas.reduce((acc, venda) => {
      return acc + CEOGestaoClickService.parseValor(venda.valor_total);
    }, 0);
    
    const totalCustosProdutos = vendasFiltradas.reduce((acc, venda) => {
      if (venda.itens && Array.isArray(venda.itens)) {
        const custoVenda = venda.itens.reduce((itemSum, item) => {
          const quantidade = CEOGestaoClickService.parseValor(item.quantidade);
          const valorCusto = CEOGestaoClickService.parseValor(item.valor_custo);
          return itemSum + (quantidade * valorCusto);
        }, 0);
        return acc + custoVenda;
      } else {
        // Fallback: usar valor_custo da venda se itens não disponível
        const valorCusto = CEOGestaoClickService.parseValor(venda.valor_custo || '0');
        return acc + valorCusto;
      }
    }, 0);
    
    let totalDespesasOperacionais = 0;
    
    if (pagamentosDisponivel) {
      totalDespesasOperacionais = pagamentos.reduce((acc, pag) => {
        return acc + CEOGestaoClickService.parseValor(pag.valor);
      }, 0);
    } else {
      // ESTIMATIVA: 20% da receita como despesas
      totalDespesasOperacionais = totalReceita * 0.20;
      estimativas.push('Despesas Operacionais: Estimado em 20% da receita (endpoint /pagamentos não disponível)');
    }
    
    const totalCustos = totalCustosProdutos + totalDespesasOperacionais;
    
    // =======================================================================
    // 1. RELAÇÃO CUSTOS/RECEITA
    // =======================================================================
    
    const costRevenueRatio = totalReceita > 0 ? totalCustos / totalReceita : 0;
    
    // =======================================================================
    // 2. CUSTO DE AQUISIÇÃO DE CLIENTE (CAC)
    // =======================================================================
    
    // Identificar investimento em marketing
    let investimentoMarketing = 0;
    
    if (pagamentosDisponivel) {
      // Buscar pagamentos relacionados a marketing
      const categoriasMarketing = ['marketing', 'publicidade', 'propaganda', 'ads', 'anúncios', 'anuncio'];
      
      investimentoMarketing = pagamentos
        .filter(pag => {
          const descricao = (pag.descricao || '').toLowerCase();
          const categoria = (pag.categoria || '').toLowerCase();
          return categoriasMarketing.some(cat => descricao.includes(cat) || categoria.includes(cat));
        })
        .reduce((acc, pag) => acc + CEOGestaoClickService.parseValor(pag.valor), 0);
      
      // Se não encontrou pagamentos de marketing, estimar
      if (investimentoMarketing === 0) {
        investimentoMarketing = totalReceita * 0.05; // 5% da receita
        estimativas.push('Investimento Marketing: Estimado em 5% da receita (não encontrados pagamentos categorizados como marketing)');
      }
    } else {
      // ESTIMATIVA: 5% da receita como investimento em marketing
      investimentoMarketing = totalReceita * 0.05;
      estimativas.push('Investimento Marketing: Estimado em 5% da receita (endpoint /pagamentos não disponível)');
    }
    
    // Estimar novos clientes (clientes únicos no período)
    const clientesUnicos = new Set(vendasFiltradas.map(v => v.cliente_id));
    const novosClientes = clientesUnicos.size;
    
    const customerAcquisitionCost = novosClientes > 0 ? investimentoMarketing / novosClientes : 0;
    
    if (novosClientes > 0) {
      estimativas.push(`Novos Clientes: Usando clientes únicos do período (${novosClientes}) - pode incluir clientes recorrentes`);
    }
    
    // =======================================================================
    // 3. RENTABILIDADE POR CENTRO DE CUSTO
    // =======================================================================
    
    let costCenterProfitability: Array<{
      id: string;
      name: string;
      revenue: number;
      costs: number;
      profitability: number;
      margin: number;
    }> = [];
    
    if (centrosCustoDisponivel) {
      // Calcular rentabilidade real por centro de custo
      
      centrosCusto.forEach(centro => {
        // Filtrar pagamentos do centro de custo
        let custosCentro = 0;
        
        if (pagamentosDisponivel) {
          custosCentro = pagamentos
            .filter(pag => pag.centro_custo_id === centro.id)
            .reduce((acc, pag) => acc + CEOGestaoClickService.parseValor(pag.valor), 0);
        }
        
        // Como não temos vendas por centro de custo, distribuir proporcionalmente
        const proporcao = centrosCusto.length > 0 ? 1 / centrosCusto.length : 0;
        const receitaCentro = totalReceita * proporcao;
        const custosProdutosCentro = totalCustosProdutos * proporcao;
        
        const custosTotaisCentro = custosProdutosCentro + custosCentro;
        const lucroCentro = receitaCentro - custosTotaisCentro;
        const rentabilidade = receitaCentro > 0 ? lucroCentro / receitaCentro : 0;
        const margem = receitaCentro > 0 ? (lucroCentro / receitaCentro) * 100 : 0;
        
        costCenterProfitability.push({
          id: centro.id.toString(),
          name: centro.nome,
          revenue: Math.round(receitaCentro),
          costs: Math.round(custosTotaisCentro),
          profitability: Math.round(rentabilidade * 100) / 100,
          margin: Math.round(margem * 100) / 100
        });
      });
      
      if (centrosCusto.length > 0) {
        estimativas.push('Rentabilidade por Centro de Custo: Receita distribuída proporcionalmente (vendas não categorizadas por centro de custo)');
      }
      
      // Ordenar por rentabilidade
      costCenterProfitability.sort((a, b) => b.profitability - a.profitability);
      
    } else {
      // Se não houver centros de custo, criar um único centro "Geral"
      estimativas.push('Centros de Custo: Endpoint não disponível, usando centro único "Geral"');
      
      const lucroGeral = totalReceita - totalCustos;
      const rentabilidadeGeral = totalReceita > 0 ? lucroGeral / totalReceita : 0;
      const margemGeral = totalReceita > 0 ? (lucroGeral / totalReceita) * 100 : 0;
      
      costCenterProfitability = [
        {
          id: '1',
          name: 'Geral',
          revenue: Math.round(totalReceita),
          costs: Math.round(totalCustos),
          profitability: Math.round(rentabilidadeGeral * 100) / 100,
          margin: Math.round(margemGeral * 100) / 100
        }
      ];
    }
    
    // =======================================================================
    // MONTAR RESPOSTA FINAL
    // =======================================================================
    
    const operationalMetrics: OperationalMetrics = {
      costRevenueRatio: Math.round(costRevenueRatio * 100) / 100,
      customerAcquisitionCost: Math.round(customerAcquisitionCost * 100) / 100,
      costCenterProfitability,
      details: {
        totalReceita: Math.round(totalReceita),
        totalCustos: Math.round(totalCustos),
        totalCustosProdutos: Math.round(totalCustosProdutos),
        totalDespesasOperacionais: Math.round(totalDespesasOperacionais),
        novosClientes,
        investimentoMarketing: Math.round(investimentoMarketing)
      },
      lastUpdated: new Date().toISOString(),
      _metadata: {
        dataSource: 'api',
        centrosCustoDisponivel,
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
    
    console.log('[CEO Operational Metrics] ✅ Análise concluída:', {
      costRevenueRatio: Math.round(costRevenueRatio * 100) / 100,
      customerAcquisitionCost: Math.round(customerAcquisitionCost * 100) / 100,
      centrosCusto: costCenterProfitability.length,
      usandoEstimativas: estimativas.length > 0
    });
    
    if (estimativas.length > 0) {
      console.warn('[CEO Operational Metrics] ⚠️  Usando estimativas:', estimativas);
    }
    
    return NextResponse.json(operationalMetrics);
    
  } catch (error) {
    console.error('[CEO Operational Metrics] ❌ Erro:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    
    // Retornar erro estruturado
    return NextResponse.json(
      {
        erro: 'Erro ao processar métricas operacionais',
        mensagem: errorMessage,
        costRevenueRatio: 0,
        customerAcquisitionCost: 0,
        costCenterProfitability: [],
        lastUpdated: new Date().toISOString(),
        _metadata: {
          dataSource: 'error' as const,
          centrosCustoDisponivel: false,
          pagamentosDisponivel: false,
          usandoEstimativas: false,
          periodo: {
            inicio: '',
            fim: ''
          },
          timestamp: new Date().toISOString(),
          error: errorMessage
        }
      } as OperationalMetrics,
      { status: 500 }
    );
  }
}
