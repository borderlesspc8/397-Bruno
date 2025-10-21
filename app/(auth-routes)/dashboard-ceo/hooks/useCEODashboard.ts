'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/_hooks/useAuth';
import { GestaoClickSupabaseService } from '@/app/_services/gestao-click-supabase';
import { 
  CEODashboardData, 
  CEOOperationalMetrics
} from '../types/ceo-dashboard.types';

interface UseCEODashboardProps {
  startDate: Date;
  endDate: Date;
}

interface UseCEODashboardReturn {
  data: CEODashboardData | null;
  operationalMetrics: CEOOperationalMetrics | null;
  cashFlowData: any | null;
  dreData: any | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useCEODashboard({ startDate, endDate }: UseCEODashboardProps): UseCEODashboardReturn {
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<CEODashboardData | null>(null);
  const [operationalMetrics, setOperationalMetrics] = useState<CEOOperationalMetrics | null>(null);
  const [cashFlowData, setCashFlowData] = useState<any | null>(null);
  const [dreData, setDreData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('[useCEODashboard] Iniciando busca de dados...');
      console.log('[useCEODashboard] Período:', { startDate, endDate });
      console.log('[useCEODashboard] User ID:', user?.id);
      
      if (!user?.id) {
        throw new Error('Usuário não autenticado. Faça login para acessar o Dashboard CEO.');
      }
      
      // Buscar dados usando o MESMO serviço que o Dashboard de Vendas usa
      const dados = await GestaoClickSupabaseService.sincronizarVendas({
        dataInicio: startDate,
        dataFim: endDate,
        userId: user.id,
        forceUpdate: false // Usar cache quando possível
      });

      console.log('[useCEODashboard] Dados recebidos do Supabase:', {
        vendas: dados.vendas.length,
        totalValor: dados.totalValor,
        vendedores: dados.vendedores.length,
        produtos: dados.produtosMaisVendidos.length,
        source: dados.syncInfo.source
      });

      // Calcular métricas operacionais a partir dos dados recebidos
      const vendas = dados.vendas;
      
      // Filtrar vendas válidas
      const vendasValidas = vendas.filter(v => 
        v.status && ['Concretizada', 'Em andamento'].includes(v.status)
      );
      
      console.log('[useCEODashboard] Vendas filtradas:', vendasValidas.length);
      
      // Calcular totais
      const totalReceita = vendasValidas.reduce((acc, v) => acc + (v.valor_total || 0), 0);
      
      // Calcular custos (se disponível)
      const totalCustos = vendasValidas.reduce((acc, venda) => {
        const custoVenda = (venda.produtos || []).reduce((sum, prod) => {
          return sum + ((prod.valor_custo || 0) * prod.quantidade);
        }, 0);
        return acc + custoVenda;
      }, 0);
      
      // Estimar despesas operacionais (20% da receita)
      const despesasOperacionais = totalReceita * 0.20;
      const totalCustosCompleto = totalCustos + despesasOperacionais;
      
      // Relação Custos/Receita
      const costRevenueRatio = totalReceita > 0 ? totalCustosCompleto / totalReceita : 0;
      
      // CAC - Custo de Aquisição de Cliente
      const clientesUnicos = new Set(vendasValidas.map(v => v.cliente_id));
      const novosClientes = clientesUnicos.size;
      const investimentoMarketing = totalReceita * 0.05; // 5% estimado
      const customerAcquisitionCost = novosClientes > 0 ? investimentoMarketing / novosClientes : 0;
      
      // Rentabilidade por vendedor (proxy para centro de custo)
      const vendasPorVendedor = new Map<string, { nome: string; receita: number; vendas: number }>();
      
      vendasValidas.forEach(venda => {
        const vendedorId = venda.vendedor_id || 'sem-vendedor';
        const vendedorNome = venda.vendedor_nome || 'Sem Vendedor';
        
        if (!vendasPorVendedor.has(vendedorId)) {
          vendasPorVendedor.set(vendedorId, {
            nome: vendedorNome,
            receita: 0,
            vendas: 0
          });
        }
        
        const vendedor = vendasPorVendedor.get(vendedorId)!;
        vendedor.receita += venda.valor_total || 0;
        vendedor.vendas += 1;
      });
      
      const costCenterProfitability = Array.from(vendasPorVendedor.entries()).map(([id, info]) => {
        const custos = info.receita * 0.65; // Estimar 65% como custos
        const lucro = info.receita - custos;
        const profitability = info.receita > 0 ? lucro / info.receita : 0;
        const margin = profitability * 100;
        
        return {
          id,
          name: info.nome,
          revenue: Math.round(info.receita),
          costs: Math.round(custos),
          profitability: Math.round(profitability * 100) / 100,
          margin: Math.round(margin * 100) / 100
        };
      }).sort((a, b) => b.profitability - a.profitability);

      // Setar métricas operacionais
      const operationalData: CEOOperationalMetrics = {
        costRevenueRatio: Math.round(costRevenueRatio * 100) / 100,
        customerAcquisitionCost: Math.round(customerAcquisitionCost * 100) / 100,
        costCenterProfitability
      };
      
      setOperationalMetrics(operationalData);
      
      // Setar dados principais
      setData({
        period: { 
          startDate: startDate.toISOString(), 
          endDate: endDate.toISOString() 
        },
        financialMetrics: {
          totalRevenue: Math.round(totalReceita),
          totalCosts: Math.round(totalCustosCompleto),
          profitMargin: totalReceita > 0 ? ((totalReceita - totalCustosCompleto) / totalReceita) * 100 : 0,
          revenueGrowth: 0,
          costGrowth: 0,
          grossProfit: Math.round(totalReceita - totalCustos),
          netProfit: Math.round(totalReceita - totalCustosCompleto)
        },
        operationalMetrics: operationalData,
        riskMetrics: {},
        growthMetrics: {},
        alerts: [],
        lastUpdated: new Date().toISOString(),
        metadata: {
          version: '1.0.0',
          generatedBy: 'CEO Dashboard',
          dataQuality: 1.0,
          completeness: 1.0
        }
      });
      
      // Cash flow simplificado
      setCashFlowData({
        totalRecebimentos: Math.round(totalReceita),
        totalPagamentos: Math.round(totalCustosCompleto),
        saldoLiquido: Math.round(totalReceita - totalCustosCompleto),
        source: dados.syncInfo.source
      });
      
      // DRE simplificada
      setDreData({
        receita: Math.round(totalReceita),
        custos: Math.round(totalCustos),
        despesas: Math.round(despesasOperacionais),
        lucroLiquido: Math.round(totalReceita - totalCustosCompleto),
        margemLucro: totalReceita > 0 ? ((totalReceita - totalCustosCompleto) / totalReceita) * 100 : 0,
        source: dados.syncInfo.source
      });

      console.log('[useCEODashboard] ✅ Dados calculados com sucesso:', {
        totalReceita: Math.round(totalReceita),
        totalCustos: Math.round(totalCustosCompleto),
        costRevenueRatio: Math.round(costRevenueRatio * 100) / 100,
        customerAcquisitionCost: Math.round(customerAcquisitionCost * 100) / 100,
        centrosCusto: costCenterProfitability.length
      });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao carregar dados';
      console.error('[useCEODashboard] ERRO FINAL:', errorMessage);
      console.error('[useCEODashboard] Stack:', err);
      setError(errorMessage);
      setOperationalMetrics(null);
      setData(null);
      setCashFlowData(null);
      setDreData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user?.id) {
      fetchData();
    }
  }, [startDate, endDate, user?.id, authLoading]);

  const refetch = () => {
    fetchData();
  };

  return {
    data,
    operationalMetrics,
    cashFlowData,
    dreData,
    loading,
    error,
    refetch
  };
}
