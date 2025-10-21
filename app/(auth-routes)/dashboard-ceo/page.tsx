'use client';

import { useState } from 'react';
import { CEOHeader } from './components/CEOHeader';
import { CEOTimeSelector } from './components/CEOTimeSelector';
import { OperationalIndicatorsCard } from './components/OperationalIndicatorsCard';
import { CACAnalysisCard } from './components/CACAnalysisCard';
import { CostCenterCard } from './components/CostCenterCard';
import { SeasonalAnalysisCard } from './components/SeasonalAnalysisCard';
import { LiquidityIndicatorsCard } from './components/LiquidityIndicatorsCard';
import { SimplifiedDRECard } from './components/SimplifiedDRECard';
import { CashFlowCard } from './components/CashFlowCard';
import { useCEODashboard } from './hooks/useCEODashboard';

export default function CEODashboardPage() {
  const [selectedPeriod, setSelectedPeriod] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    endDate: new Date()
  });

  const { 
    data, 
    operationalMetrics, 
    cashFlowData,
    dreData,
    loading, 
    error, 
    refetch
  } = useCEODashboard(selectedPeriod);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CEOHeader />
        <div className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando dados do dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CEOHeader />
        <div className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center max-w-2xl">
              <div className="text-red-600 text-6xl mb-4">⚠️</div>
              <p className="text-red-600 text-lg font-semibold mb-2">Erro ao carregar dados do Dashboard CEO</p>
              <p className="text-gray-700 mb-4 font-mono text-sm bg-gray-100 p-4 rounded">{error}</p>
              <button
                onClick={refetch}
                className="px-6 py-3 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors font-medium"
              >
                Tentar Novamente
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CEOHeader />
      
      <div className="p-6">
        <div className="mb-6">
          <CEOTimeSelector 
            selectedPeriod={selectedPeriod}
            onPeriodChange={setSelectedPeriod}
          />
        </div>

        <div className="space-y-6">
          {/* Métricas Operacionais */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800 border-b pb-2">
              📊 Métricas Operacionais
            </h2>
            <div className="grid grid-cols-2 gap-6">
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
          </div>

          {/* Centros de Custo */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800 border-b pb-2">
              🏢 Análise de Centros de Custo
            </h2>
            <div className="grid grid-cols-1 gap-6">
              <CostCenterCard
                data={operationalMetrics}
                params={selectedPeriod}
                isLoading={loading}
                onRefresh={refetch}
              />
            </div>
          </div>

          {/* Análise Financeira */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800 border-b pb-2">
              💰 Análise Financeira
            </h2>
            <div className="grid grid-cols-2 gap-6">
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
            
            <div className="grid grid-cols-2 gap-6">
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
          </div>
        </div>
      </div>
    </div>
  );
}
