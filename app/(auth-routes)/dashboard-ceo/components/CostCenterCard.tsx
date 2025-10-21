'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_components/ui/card';
import { Button } from '@/app/_components/ui/button';
import { Badge } from '@/app/_components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  RefreshCw, 
  ChevronDown,
  Building2,
  DollarSign,
  Receipt,
  TrendingDownIcon,
  Percent
} from 'lucide-react';
import { CEODashboardParams } from '../types/ceo-dashboard.types';
import { CardSkeleton, ErrorState, FadeIn } from './loading-states';

interface CostCenter {
  id: string;
  nome: string;
  cadastrado_em: string;
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
  const [loading, setLoading] = useState(false);
  const [loadingCentros, setLoadingCentros] = useState(true);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Carregar lista de centros de custo
  useEffect(() => {
    const loadCentrosCusto = async () => {
      try {
        setLoadingCentros(true);
        const response = await fetch('/api/ceo/data/centros-custos');
        const data = await response.json();
        
        if (data.data && Array.isArray(data.data)) {
          setCentrosCusto(data.data);
          console.log('[CostCenterCard] Centros de custo carregados:', data.data.length);
        }
      } catch (err) {
        console.error('[CostCenterCard] Erro ao carregar centros de custo:', err);
      } finally {
        setLoadingCentros(false);
      }
    };

    loadCentrosCusto();
  }, []);

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

        // Garantir que sempre usa as datas do dashboard CEO
        const startDate = params.startDate.toISOString().split('T')[0];
        const endDate = params.endDate.toISOString().split('T')[0];
        
        console.log('[CostCenterCard] Carregando análise para período:', { 
          startDate, 
          endDate, 
          centroCustoId: selectedCentroCusto 
        });

        const response = await fetch(
          `/api/ceo/cost-center-analysis?startDate=${params.startDate.toISOString()}&endDate=${params.endDate.toISOString()}&centroCustoId=${selectedCentroCusto}`
        );

        if (!response.ok) {
          throw new Error('Erro ao carregar análise');
        }

        const data = await response.json();
        setAnalysisData(data);
        console.log('[CostCenterCard] Análise carregada:', {
          centroCusto: data.centroCustoNome,
          totalPagamentos: data.totalPagamentos,
          quantidadePagamentos: data.quantidadePagamentos,
          periodo: data.periodo
        });
      } catch (err) {
        setAnalysisError(err instanceof Error ? err.message : 'Erro ao carregar análise');
        console.error('[CostCenterCard] Erro:', err);
      } finally {
        setLoading(false);
      }
    };

    loadAnalysis();
  }, [selectedCentroCusto, params.startDate, params.endDate]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  // Estado de Loading inicial (centros de custo)
  if (loadingCentros || isLoading) {
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
    <FadeIn duration={400} delay={500}>
      <Card className="w-full h-full transition-shadow hover:shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex flex-col space-y-1">
            <div className="flex items-center space-x-2">
              <Building2 className="h-5 w-5 text-orange-600" />
              <CardTitle className="text-lg">Análise de Centros de Custo</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground">
              Período: {params.startDate.toLocaleDateString('pt-BR')} até {params.endDate.toLocaleDateString('pt-BR')}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => {
                setSelectedCentroCusto('');
                setAnalysisData(null);
                onRefresh?.();
              }}
              variant="outline"
              size="sm"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Seletor de Centro de Custo */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Selecione um Centro de Custo para Analisar
            </label>
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="w-full px-4 py-3 text-left bg-white border border-gray-300 rounded-lg hover:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className={selectedCentroCusto ? 'text-gray-900 font-medium' : 'text-gray-500'}>
                    {selectedCentroCusto 
                      ? centrosCusto.find(c => c.id === selectedCentroCusto)?.nome || 'Selecione...'
                      : 'Selecione um centro de custo...'}
                  </span>
                  <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {showDropdown && (
                <div className="absolute z-50 w-full mt-2 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-y-auto">
                  <div className="p-2">
                    <div className="text-xs font-semibold text-gray-500 px-3 py-2">
                      {centrosCusto.length} Centros de Custo Disponíveis
                    </div>
                    {centrosCusto.map((centro) => (
                      <button
                        key={centro.id}
                        onClick={() => {
                          setSelectedCentroCusto(centro.id);
                          setShowDropdown(false);
                        }}
                        className={`w-full px-3 py-2 text-left rounded-md hover:bg-orange-50 transition-colors ${
                          selectedCentroCusto === centro.id ? 'bg-orange-100 text-orange-900 font-medium' : 'text-gray-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm">{centro.nome}</span>
                          {selectedCentroCusto === centro.id && (
                            <Badge className="bg-orange-600 text-white">Selecionado</Badge>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="text-xs text-gray-500">
              💡 Selecione um centro de custo para ver análise detalhada
            </div>
          </div>

          {/* Loading da Análise */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-3">
                <RefreshCw className="h-8 w-8 mx-auto text-orange-600 animate-spin" />
                <p className="text-sm text-gray-600">Carregando análise...</p>
              </div>
            </div>
          )}

          {/* Erro na Análise */}
          {analysisError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-red-800">
                <TrendingDown className="h-5 w-5" />
                <p className="font-medium">Erro ao carregar análise</p>
              </div>
              <p className="text-sm text-red-600 mt-1">{analysisError}</p>
            </div>
          )}

          {/* Estado Inicial - Sem Centro Selecionado */}
          {!selectedCentroCusto && !loading && (
            <div className="text-center py-12">
              <BarChart3 className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum Centro de Custo Selecionado
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Selecione um centro de custo acima para visualizar análise detalhada
              </p>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 max-w-md mx-auto">
                <p className="text-sm text-orange-800">
                  <strong>{centrosCusto.length} centros de custo</strong> disponíveis para análise
                </p>
              </div>
            </div>
          )}

          {/* Análise Detalhada */}
          {analysisData && !loading && (
            <div className="space-y-6">
              {/* Resumo Geral */}
              <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg p-4 border border-orange-200">
                <h3 className="text-sm font-semibold text-orange-900 mb-3">
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
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-700">Análises Detalhadas</h4>
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
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                        <TrendingUp className="h-4 w-4 text-orange-600" />
                        <span>Evolução Mensal</span>
                      </h4>
                      <div className="space-y-2">
                        {analysisData.evolucaoMensal.map((mes, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
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
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                        <Percent className="h-4 w-4 text-green-600" />
                        <span>Formas de Pagamento</span>
                      </h4>
                      <div className="space-y-2">
                        {analysisData.formasPagamento.map((forma, index) => (
                          <div key={index} className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-700">{forma.forma}</span>
                              <div className="flex items-center space-x-2">
                                <Badge className="bg-green-100 text-green-800">{forma.percentual}%</Badge>
                                <span className="text-sm font-bold text-gray-900">
                                  {formatCurrency(forma.valor)}
                                </span>
                              </div>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="h-2 rounded-full bg-green-500"
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
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-gray-700">Top Fornecedores</h4>
                      <div className="space-y-1 max-h-40 overflow-y-auto">
                        {analysisData.fornecedores.map((fornecedor, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs">
                            <span className="text-gray-700 truncate flex-1">{fornecedor.nome}</span>
                            <div className="flex items-center space-x-2">
                              <span className="text-gray-600">{fornecedor.percentual}%</span>
                              <span className="font-bold text-gray-900 min-w-[80px] text-right">
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
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-gray-700">Planos de Contas</h4>
                      <div className="space-y-1 max-h-40 overflow-y-auto">
                        {analysisData.planosContas.map((plano, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs">
                            <span className="text-gray-700 truncate flex-1">{plano.nome}</span>
                            <div className="flex items-center space-x-2">
                              <span className="text-gray-600">{plano.percentual}%</span>
                              <span className="font-bold text-gray-900 min-w-[80px] text-right">
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
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-gray-700">Últimos Pagamentos</h4>
                      <div className="space-y-1 max-h-60 overflow-y-auto">
                        {analysisData.pagamentos.slice(0, 10).map((pagamento) => (
                          <div key={pagamento.id} className="p-2 bg-gray-50 rounded text-xs space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-gray-900 truncate flex-1">
                                {pagamento.descricao}
                              </span>
                              <span className="font-bold text-orange-600 ml-2">
                                {formatCurrency(pagamento.valor)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-gray-600">
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
        </CardContent>
      </Card>
    </FadeIn>
  );
}

export default CostCenterCard;
