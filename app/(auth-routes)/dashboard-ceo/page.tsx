'use client';

import { useState, useCallback, useMemo } from 'react';
import { PageContainer } from '@/app/_components/page-container';
import { DashboardHeader } from '@/app/(auth-routes)/dashboard/_components/DashboardHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/_components/ui/tabs';
import { Target, Building2, TrendingUp, FileText } from 'lucide-react';
import { CEOTimeSelector } from './components/CEOTimeSelector';
import { OperationalIndicatorsCard } from './components/OperationalIndicatorsCard';
import { CACAnalysisCard } from './components/CACAnalysisCard';
import { CostCenterCard } from './components/CostCenterCard';
import { SeasonalAnalysisCard } from './components/SeasonalAnalysisCard';
import { LiquidityIndicatorsCard } from './components/LiquidityIndicatorsCard';
import { SimplifiedDRECard } from './components/SimplifiedDRECard';
import { CashFlowCard } from './components/CashFlowCard';
import { useCEODashboard } from './hooks/useCEODashboard';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AdminRouteProtection } from '@/app/_components/AdminRouteProtection';

// Loading Skeleton consistente com dashboard de vendas
const LoadingSkeleton = () => (
  <div className="space-y-6 ios26-animate-fade-in">
    <div className="ios26-skeleton h-[200px] w-full" />
    <div className="ios26-grid">
      <div className="ios26-skeleton h-[300px]" />
      <div className="ios26-skeleton h-[300px]" />
    </div>
    <div className="ios26-grid">
      <div className="ios26-skeleton h-[400px]" />
      <div className="ios26-skeleton h-[400px]" />
    </div>
  </div>
);

export default function CEODashboardPage() {
  const [selectedPeriod, setSelectedPeriod] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    endDate: new Date()
  });

  const [activeTab, setActiveTab] = useState('operational');

  const { 
    data, 
    operationalMetrics, 
    cashFlowData,
    dreData,
    loading, 
    error, 
    refetch
  } = useCEODashboard(selectedPeriod);

  // Callback para refresh dos dados
  const handleRefresh = useCallback(async () => {
    try {
      console.log('🔄 Atualizando dados do Dashboard CEO...');
      await refetch();
      console.log('✅ Dados atualizados com sucesso');
    } catch (error) {
      console.error('❌ Erro ao atualizar dados:', error);
      throw error;
    }
  }, [refetch]);

  // Formatar dateRange para o DashboardHeader
  const dateRange = useMemo(() => ({
    from: selectedPeriod.startDate,
    to: selectedPeriod.endDate
  }), [selectedPeriod]);

  // Loading state
  if (loading) {
    return (
      <AdminRouteProtection>
        <PageContainer>
          <LoadingSkeleton />
        </PageContainer>
      </AdminRouteProtection>
    );
  }

  // Error state
  if (error) {
    return (
      <AdminRouteProtection>
        <PageContainer>
          <div className="space-y-6">
            <div className="rounded-lg border border-red-200 bg-red-50 p-6">
              <h3 className="text-lg font-semibold text-red-800">Erro ao carregar dados</h3>
              <p className="text-red-600 mt-2">{error}</p>
              <button 
                onClick={handleRefresh}
                className="mt-4 rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700 transition-colors"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        </PageContainer>
      </AdminRouteProtection>
    );
  }

  return (
    <AdminRouteProtection>
      <PageContainer>
        <div className="space-y-6 ios26-animate-fade-in">
          {/* Header */}
          <div className="col-span-12">
            <DashboardHeader 
              title="Dashboard CEO" 
              description="Visão executiva e indicadores estratégicos"
              dateRange={dateRange}
              onRefresh={handleRefresh}
              isRefreshing={loading}
            />
          </div>

          {/* Informações do período */}
          <div className="text-sm text-muted-foreground font-medium">
            Dados de {format(selectedPeriod.startDate, "dd 'de' MMMM", { locale: ptBR })} até {format(selectedPeriod.endDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </div>

          {/* Seletor de Período */}
          <div className="w-full lg:w-1/2">
            <CEOTimeSelector 
              selectedPeriod={selectedPeriod}
              onPeriodChange={setSelectedPeriod}
            />
          </div>

          {/* Tabs para organizar os cards */}
          <div className="ios26-card p-6">
            <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="ios26-tabs overflow-x-auto">
                <TabsList className="bg-transparent h-12 p-0 w-full justify-start space-x-4 flex-nowrap">
                  <TabsTrigger 
                    value="operational" 
                    className="ios26-tab-trigger whitespace-nowrap flex items-center gap-2"
                  >
                    <Target className="h-4 w-4" />
                    <span>Métricas Operacionais</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="cost-centers" 
                    className="ios26-tab-trigger whitespace-nowrap flex items-center gap-2"
                  >
                    <Building2 className="h-4 w-4" />
                    <span>Centros de Custo</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="financial" 
                    className="ios26-tab-trigger whitespace-nowrap flex items-center gap-2"
                  >
                    <TrendingUp className="h-4 w-4" />
                    <span>Análise Financeira</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="dre-cashflow" 
                    className="ios26-tab-trigger whitespace-nowrap flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    <span>DRE e Fluxo de Caixa</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="mt-6">
                {/* Tab: Métricas Operacionais */}
                <TabsContent value="operational" className="mt-0">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <OperationalIndicatorsCard
                      data={operationalMetrics}
                      params={selectedPeriod}
                      isLoading={loading}
                      onRefresh={refetch}
                    />
                    
                    <CACAnalysisCard
                      data={operationalMetrics}
                      params={selectedPeriod}
                      isLoading={loading}
                      onRefresh={refetch}
                    />
                  </div>
                </TabsContent>

                {/* Tab: Centros de Custo */}
                <TabsContent value="cost-centers" className="mt-0">
                  <CostCenterCard
                    data={operationalMetrics}
                    params={selectedPeriod}
                    isLoading={loading}
                    onRefresh={refetch}
                  />
                </TabsContent>

                {/* Tab: Análise Financeira */}
                <TabsContent value="financial" className="mt-0">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <SeasonalAnalysisCard
                      params={selectedPeriod}
                      isLoading={loading}
                      onRefresh={refetch}
                    />
                    
                    <LiquidityIndicatorsCard
                      params={selectedPeriod}
                      isLoading={loading}
                      onRefresh={refetch}
                    />
                  </div>
                </TabsContent>

                {/* Tab: DRE e Fluxo de Caixa */}
                <TabsContent value="dre-cashflow" className="mt-0">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <SimplifiedDRECard
                      params={selectedPeriod}
                      isLoading={loading}
                      onRefresh={refetch}
                    />
                    
                    <CashFlowCard
                      params={selectedPeriod}
                      isLoading={loading}
                      onRefresh={refetch}
                    />
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </PageContainer>
    </AdminRouteProtection>
  );
}
