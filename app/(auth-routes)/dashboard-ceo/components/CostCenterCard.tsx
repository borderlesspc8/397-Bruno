'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/app/_components/ui/button';
import { Badge } from '@/app/_components/ui/badge';
import { Input } from '@/app/_components/ui/input';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  RefreshCw, 
  ChevronDown,
  Building2,
  DollarSign,
  Receipt,
  Percent,
  Search,
  AlertTriangle,
  PieChart,
  Wallet,
  ShoppingCart,
  ArrowLeft,
  Download
} from 'lucide-react';
import { CEODashboardParams } from '../types/ceo-dashboard.types';
import { CardSkeleton, ErrorState } from './loading-states';

interface CostCenter {
  id: string;
  nome: string;
  cadastrado_em: string;
}

interface CostCenterExpense {
  id: string;
  nome: string;
  totalGasto: number;
  percentualTotal: number;
  categoria: 'operacional' | 'produto' | 'investimento';
}

interface CostCenterAnalysis {
  centroCustoId: string;
  centroCustoNome: string;
  totalPagamentos: number;
  quantidadePagamentos: number;
  ticketMedio: number;
  pagamentos: Array<{
    id: string;
    descricao: string;
    valor: number;
    data: string;
    formaPagamento: string;
    fornecedor: string;
    planoConta: string;
  }>;
  evolucaoMensal: Array<{
    mes: string;
    total: number;
    quantidade: number;
  }>;
  formasPagamento: Array<{
    forma: string;
    valor: number;
    percentual: number;
    quantidade: number;
  }>;
  fornecedores: Array<{
    nome: string;
    valor: number;
    percentual: number;
    quantidade: number;
  }>;
  planosContas: Array<{
    nome: string;
    valor: number;
    percentual: number;
    quantidade: number;
  }>;
  periodo: {
    inicio: string;
    fim: string;
  };
  timestamp: string;
}

interface OperationalMetrics {
  costCenterProfitability: Array<{
    id: string;
    name: string;
    costs: number;
  }>;
  details?: {
    totalCustos: number;
  };
}

interface CostCenterCardProps {
  params: CEODashboardParams;
  isLoading?: boolean;
  error?: Error | string;
  onRefresh?: () => void;
}

export function CostCenterCard({ 
  params, 
  isLoading = false,
  error,
  onRefresh 
}: CostCenterCardProps) {
  const [centrosCusto, setCentrosCusto] = useState<CostCenter[]>([]);
  const [selectedCentroCusto, setSelectedCentroCusto] = useState<string>('');
  const [analysisData, setAnalysisData] = useState<CostCenterAnalysis | null>(null);
  const [costCenterExpenses, setCostCenterExpenses] = useState<CostCenterExpense[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCentros, setLoadingCentros] = useState(true);
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'operacional' | 'produto' | 'investimento'>('all');

  // Carregar lista de centros de custo
  useEffect(() => {
    const loadCentrosCusto = async () => {
      try {
        setLoadingCentros(true);
        const response = await fetch('/api/ceo/data/centros-custos');
        const data = await response.json();
        
        if (data.data && Array.isArray(data.data)) {
          setCentrosCusto(data.data);
        }
      } catch (err) {
        console.error('[CostCenterCard] Erro ao carregar centros:', err);
      } finally {
        setLoadingCentros(false);
      }
    };

    loadCentrosCusto();
  }, []);

  // Carregar visão geral dos centros de custo
  useEffect(() => {
    const loadOverview = async () => {
      try {
        setLoadingOverview(true);
        const response = await fetch(
          `/api/ceo/operational-metrics?startDate=${params.startDate.toISOString()}&endDate=${params.endDate.toISOString()}`
        );

        if (!response.ok) {
          throw new Error('Erro ao carregar visão geral');
        }

        const data: OperationalMetrics = await response.json();
        
        // Processar despesas por centro de custo
        if (data.costCenterProfitability) {
          const expenses = data.costCenterProfitability.map((center) => {
            const nome = center.name.toLowerCase();
            let categoria: 'operacional' | 'produto' | 'investimento' = 'operacional';
            
            if (nome.includes('fornecedor') || nome.includes('equipamentos') || nome.includes('acessórios')) {
              categoria = 'produto';
            } else if (nome.includes('investimento')) {
              categoria = 'investimento';
            }
            
            return {
              id: center.id,
              nome: center.name,
              totalGasto: center.costs,
              percentualTotal: data.details ? (center.costs / data.details.totalCustos) * 100 : 0,
              categoria
            };
          }).sort((a, b) => b.totalGasto - a.totalGasto);
          
          setCostCenterExpenses(expenses);
        }
      } catch (err) {
        console.error('[CostCenterCard] Erro ao carregar visão geral:', err);
      } finally {
        setLoadingOverview(false);
      }
    };

    loadOverview();
  }, [params.startDate, params.endDate]);

  // Carregar análise do centro de custo selecionado
  useEffect(() => {
    const loadAnalysis = async () => {
      if (!selectedCentroCusto) {
        setAnalysisData(null);
        return;
      }

      try {
        setLoading(true);
        setAnalysisError(null);

        const response = await fetch(
          `/api/ceo/cost-center-analysis?startDate=${params.startDate.toISOString()}&endDate=${params.endDate.toISOString()}&centroCustoId=${selectedCentroCusto}`
        );

        if (!response.ok) {
          throw new Error('Erro ao carregar análise');
        }

        const data = await response.json();
        setAnalysisData(data);
      } catch (err) {
        setAnalysisError(err instanceof Error ? err.message : 'Erro ao carregar análise');
        console.error('[CostCenterCard] Erro:', err);
      } finally {
        setLoading(false);
      }
    };

    loadAnalysis();
  }, [selectedCentroCusto, params.startDate, params.endDate]);

  // Filtrar centros
  const filteredExpenses = useMemo(() => {
    let filtered = costCenterExpenses;
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(exp => exp.categoria === selectedCategory);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(exp =>
        exp.nome.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  }, [costCenterExpenses, selectedCategory, searchTerm]);

  // Calcular totais por categoria
  const { topSpenders, totalOperacional, totalProdutos, totalInvestimentos } = useMemo(() => {
    const operacionais = costCenterExpenses.filter(c => c.categoria === 'operacional');
    const produtos = costCenterExpenses.filter(c => c.categoria === 'produto');
    const investimentos = costCenterExpenses.filter(c => c.categoria === 'investimento');
    
    return {
      topSpenders: costCenterExpenses.slice(0, 5),
      totalOperacional: operacionais.reduce((sum, c) => sum + c.totalGasto, 0),
      totalProdutos: produtos.reduce((sum, c) => sum + c.totalGasto, 0),
      totalInvestimentos: investimentos.reduce((sum, c) => sum + c.totalGasto, 0)
    };
  }, [costCenterExpenses]);

  // Formatadores
  const formatCurrency = (value: number) => {
    const formatted = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
    
    return formatted.replace(',00', '');
  };

  const formatPercentage = (value: number) => {
    const formatted = value.toFixed(2);
    return formatted.endsWith('.00') ? `${Math.round(value)}%` : `${formatted}%`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getCategoryColor = (categoria: string) => {
    switch (categoria) {
      case 'operacional': return 'bg-blue-100 text-blue-700';
      case 'produto': return 'bg-purple-100 text-purple-700';
      case 'investimento': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getCategoryLabel = (categoria: string) => {
    switch (categoria) {
      case 'operacional': return 'Despesa Operacional';
      case 'produto': return 'Custo de Produto';
      case 'investimento': return 'Investimento';
      default: return 'Outros';
    }
  };

  // Exportar dados
  const handleExport = () => {
    const data = {
      periodo: {
        inicio: params.startDate.toISOString(),
        fim: params.endDate.toISOString()
      },
      centrosCusto: costCenterExpenses,
      analiseDetalhada: analysisData
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `centros-custo-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Estado de Loading inicial
  if (loadingCentros || loadingOverview || isLoading) {
    return <CardSkeleton showHeader={true} contentRows={8} className="h-full" />;
  }

  // Estado de Erro
  if (error) {
    return (
      <ErrorState
        title="Erro nos Centros de Custo"
        message="Não foi possível carregar a análise de centros de custo."
        error={error}
        onRetry={onRefresh}
        variant="card"
        className="w-full h-full"
      />
    );
  }

  return (
    <div className="ios26-card p-6 ios26-animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div className="flex flex-col space-y-1">
          <div className="flex items-center space-x-2">
            <Building2 className="h-5 w-5 text-[#faba33]" />
            <h3 className="text-lg font-semibold">
              {selectedCentroCusto ? 'Análise Detalhada do Centro' : 'Centros de Custo'}
            </h3>
          </div>
          <p className="text-sm text-muted-foreground">
            {params.startDate.toLocaleDateString('pt-BR')} até {params.endDate.toLocaleDateString('pt-BR')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedCentroCusto && (
            <Button
              onClick={() => {
                setSelectedCentroCusto('');
                setAnalysisData(null);
                setSearchTerm('');
              }}
              variant="outline"
              size="sm"
              className="ios26-button"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          )}
          <Button
            onClick={handleExport}
            variant="outline"
            size="sm"
            className="ios26-button"
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button
            onClick={() => {
              setSelectedCentroCusto('');
              setAnalysisData(null);
              onRefresh?.();
            }}
            variant="outline"
            size="sm"
            disabled={loading}
            className="ios26-button"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {!selectedCentroCusto ? (
          /* VISÃO GERAL DE TODOS OS CENTROS */
          <>
            {/* Distribuição por Categoria */}
            <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <PieChart className="h-5 w-5 text-purple-600" />
                <h4 className="text-md font-semibold text-gray-900">Distribuição de Custos por Categoria</h4>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Wallet className="h-4 w-4 text-blue-600" />
                    <p className="text-xs font-medium text-blue-700">Despesas Operacionais</p>
                  </div>
                  <p className="text-2xl font-bold text-blue-900">{formatCurrency(totalOperacional)}</p>
                  <p className="text-xs text-blue-600 mt-1">
                    {costCenterExpenses.filter(c => c.categoria === 'operacional').length} centros
                  </p>
                </div>
                
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <ShoppingCart className="h-4 w-4 text-purple-600" />
                    <p className="text-xs font-medium text-purple-700">Custos de Produtos</p>
                  </div>
                  <p className="text-2xl font-bold text-purple-900">{formatCurrency(totalProdutos)}</p>
                  <p className="text-xs text-purple-600 mt-1">
                    {costCenterExpenses.filter(c => c.categoria === 'produto').length} centros
                  </p>
                </div>
                
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <p className="text-xs font-medium text-green-700">Investimentos</p>
                  </div>
                  <p className="text-2xl font-bold text-green-900">{formatCurrency(totalInvestimentos)}</p>
                  <p className="text-xs text-green-600 mt-1">
                    {costCenterExpenses.filter(c => c.categoria === 'investimento').length} centros
                  </p>
                </div>
              </div>
            </div>

            {/* Top 5 Maiores Gastadores */}
            {topSpenders.length > 0 && (
              <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6 border-2 border-orange-200">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  <h4 className="text-md font-semibold text-gray-900">Top 5 Centros com Maiores Gastos</h4>
                </div>
                
                <div className="space-y-3">
                  {topSpenders.map((center, index) => (
                    <button
                      key={center.id}
                      onClick={() => setSelectedCentroCusto(center.id)}
                      className="w-full flex items-center justify-between bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-orange-200 hover:bg-white hover:border-orange-400 transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                          index === 0 ? 'bg-orange-500 text-white' :
                          index === 1 ? 'bg-orange-400 text-white' :
                          index === 2 ? 'bg-orange-300 text-orange-900' :
                          'bg-orange-200 text-orange-800'
                        }`}>
                          {index + 1}
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-semibold text-gray-900">{center.nome}</p>
                          <Badge className={`${getCategoryColor(center.categoria)} text-xs mt-1`}>
                            {getCategoryLabel(center.categoria)}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">
                          {formatCurrency(center.totalGasto)}
                        </p>
                        <p className="text-xs text-orange-600 font-medium">
                          {formatPercentage(center.percentualTotal)} do total
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Lista Completa de Centros */}
            <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                  <h4 className="text-md font-semibold text-gray-900">Todos os Centros de Custo</h4>
                </div>
                <Badge className="bg-gray-100 text-gray-700">
                  {filteredExpenses.length} centros
                </Badge>
              </div>

              {/* Filtros e Busca */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                <div className="relative md:col-span-2">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Buscar centro de custo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as any)}
                  className="px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="all">Todas as categorias</option>
                  <option value="operacional">Despesas Operacionais</option>
                  <option value="produto">Custos de Produtos</option>
                  <option value="investimento">Investimentos</option>
                </select>
              </div>

              {/* Lista de Centros */}
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {filteredExpenses.length > 0 ? (
                  filteredExpenses.map((center, index) => (
                    <button
                      key={center.id}
                      onClick={() => setSelectedCentroCusto(center.id)}
                      className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-purple-50 rounded-lg transition-colors border border-gray-200 hover:border-purple-300 cursor-pointer"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="text-sm font-medium text-gray-500 min-w-[30px]">
                          #{index + 1}
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-sm font-semibold text-gray-900">{center.nome}</p>
                          <Badge className={`${getCategoryColor(center.categoria)} text-xs mt-1`}>
                            {getCategoryLabel(center.categoria)}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">
                          {formatCurrency(center.totalGasto)}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-20 bg-gray-200 rounded-full h-1.5">
                            <div
                              className="h-full bg-purple-600 rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(center.percentualTotal * 5, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-purple-600 font-semibold min-w-[45px]">
                            {formatPercentage(center.percentualTotal)}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Search className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm">Nenhum centro de custo encontrado</p>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          /* ANÁLISE DETALHADA DO CENTRO SELECIONADO */
          <>
            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center space-y-3">
                  <RefreshCw className="h-8 w-8 mx-auto text-orange-600 animate-spin" />
                  <p className="text-sm text-gray-600">Carregando análise...</p>
                </div>
              </div>
            )}

            {analysisError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 text-red-800">
                  <TrendingDown className="h-5 w-5" />
                  <p className="font-medium">Erro ao carregar análise</p>
                </div>
                <p className="text-sm text-red-600 mt-1">{analysisError}</p>
              </div>
            )}

            {analysisData && !loading && (
              <div className="space-y-6">
                {/* Resumo do Centro */}
                <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl p-6 border-2 border-orange-200">
                  <h3 className="text-lg font-semibold text-orange-900 mb-4">
                    {analysisData.centroCustoNome}
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <div className="flex items-center space-x-1 text-orange-600 mb-1">
                        <DollarSign className="h-4 w-4" />
                        <span className="text-xs font-medium">Total Pago</span>
                      </div>
                      <div className="text-2xl font-bold text-orange-900">
                        {formatCurrency(analysisData.totalPagamentos)}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center space-x-1 text-orange-600 mb-1">
                        <Receipt className="h-4 w-4" />
                        <span className="text-xs font-medium">Pagamentos</span>
                      </div>
                      <div className="text-2xl font-bold text-orange-900">
                        {analysisData.quantidadePagamentos}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center space-x-1 text-orange-600 mb-1">
                        <TrendingUp className="h-4 w-4" />
                        <span className="text-xs font-medium">Ticket Médio</span>
                      </div>
                      <div className="text-2xl font-bold text-orange-900">
                        {formatCurrency(analysisData.ticketMedio)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Toggle Detalhes */}
                <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-900">Análises Detalhadas</h4>
                  <Button
                    onClick={() => setShowDetails(!showDetails)}
                    variant="outline"
                    size="sm"
                  >
                    {showDetails ? 'Ocultar' : 'Mostrar'} Detalhes
                  </Button>
                </div>

                {showDetails && (
                  <div className="space-y-6">
                    {/* Evolução Mensal */}
                    {analysisData.evolucaoMensal.length > 0 && (
                      <div className="bg-white rounded-xl border-2 border-gray-200 p-5">
                        <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-4">
                          <TrendingUp className="h-4 w-4 text-orange-600" />
                          Evolução Mensal
                        </h4>
                        <div className="space-y-2">
                          {analysisData.evolucaoMensal.map((mes, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                              <span className="text-sm font-medium text-gray-700">{mes.mes}</span>
                              <div className="flex items-center space-x-3">
                                <span className="text-xs text-gray-600">{mes.quantidade} pag.</span>
                                <span className="text-sm font-bold text-orange-600">
                                  {formatCurrency(mes.total)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Formas de Pagamento */}
                    {analysisData.formasPagamento.length > 0 && (
                      <div className="bg-white rounded-xl border-2 border-gray-200 p-5">
                        <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-4">
                          <Percent className="h-4 w-4 text-green-600" />
                          Formas de Pagamento
                        </h4>
                        <div className="space-y-3">
                          {analysisData.formasPagamento.map((forma, index) => (
                            <div key={index} className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-900">{forma.forma}</span>
                                <div className="flex items-center gap-3">
                                  <Badge className="bg-green-100 text-green-900 font-semibold">
                                    {forma.percentual.toFixed(1)}%
                                  </Badge>
                                  <span className="text-sm font-bold text-gray-900 min-w-[100px] text-right">
                                    {formatCurrency(forma.valor)}
                                  </span>
                                </div>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full"
                                  style={{ width: `${forma.percentual}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Top Fornecedores */}
                    {analysisData.fornecedores.length > 0 && (
                      <div className="bg-white rounded-xl border-2 border-gray-200 p-5">
                        <h4 className="text-sm font-semibold text-gray-900 mb-4">Top Fornecedores</h4>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {analysisData.fornecedores.map((fornecedor, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <span className="text-sm text-gray-900 truncate flex-1">{fornecedor.nome}</span>
                              <div className="flex items-center gap-3 ml-4">
                                <span className="text-xs text-gray-600">{fornecedor.percentual.toFixed(1)}%</span>
                                <span className="text-sm font-bold text-gray-900 min-w-[100px] text-right">
                                  {formatCurrency(fornecedor.valor)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Planos de Contas */}
                    {analysisData.planosContas.length > 0 && (
                      <div className="bg-white rounded-xl border-2 border-gray-200 p-5">
                        <h4 className="text-sm font-semibold text-gray-900 mb-4">Planos de Contas</h4>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {analysisData.planosContas.map((plano, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <span className="text-sm text-gray-900 truncate flex-1">{plano.nome}</span>
                              <div className="flex items-center gap-3 ml-4">
                                <span className="text-xs text-gray-600">{plano.percentual.toFixed(1)}%</span>
                                <span className="text-sm font-bold text-gray-900 min-w-[100px] text-right">
                                  {formatCurrency(plano.valor)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Últimos Pagamentos */}
                    {analysisData.pagamentos.length > 0 && (
                      <div className="bg-white rounded-xl border-2 border-gray-200 p-5">
                        <h4 className="text-sm font-semibold text-gray-900 mb-4">
                          Últimos Pagamentos ({analysisData.pagamentos.length})
                        </h4>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {analysisData.pagamentos.slice(0, 20).map((pagamento) => (
                            <div key={pagamento.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-gray-900 text-sm truncate flex-1">
                                  {pagamento.descricao}
                                </span>
                                <span className="font-bold text-orange-600 ml-3 text-sm">
                                  {formatCurrency(pagamento.valor)}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-xs text-gray-600">
                                <span>{formatDate(pagamento.data)}</span>
                                <span>{pagamento.formaPagamento}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default CostCenterCard;
