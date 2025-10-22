/**
 * Componentes Lazy Loading para Dashboard CEO
 * Otimização de performance através de carregamento sob demanda
 */

import dynamic from 'next/dynamic';
import { ComponentType, useState, useEffect, useRef } from 'react';

// Loading component personalizado
const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
    <span className="ml-2 text-sm text-gray-600">Carregando...</span>
  </div>
);

// Error boundary para componentes lazy
export const LazyErrorBoundary = ({ 
  children, 
  fallback = <div className="p-4 text-red-600">Erro ao carregar componente</div> 
}: { 
  children: React.ReactNode; 
  fallback?: React.ReactNode; 
}) => {
  try {
    return <>{children}</>;
  } catch (error) {
    console.error('Erro no componente lazy:', error);
    return <>{fallback}</>;
  }
};

// Wrapper para componentes lazy com configurações otimizadas
const createLazyComponent = <P extends object>(
  importFunction: () => Promise<{ default: ComponentType<P> }>,
  options?: {
    loading?: ComponentType;
    ssr?: boolean;
    delay?: number;
  }
) => {
  return dynamic(importFunction, {
    loading: options?.loading || LoadingSpinner,
    ssr: options?.ssr !== false,
    ...options
  });
};

// Componentes operacionais (carregamento prioritário)
export const LazyOperationalIndicators = createLazyComponent(
  () => import('./OperationalIndicatorsCard'),
  { ssr: true }
);

export const LazyCACAnalysis = createLazyComponent(
  () => import('./CACAnalysisCard'),
  { ssr: true }
);

export const LazyCostCenter = createLazyComponent(
  () => import('./CostCenterCard'),
  { ssr: true }
);

// Componentes financeiros (carregamento médio)
export const LazySeasonalAnalysis = createLazyComponent(
  () => import('./SeasonalAnalysisCard'),
  { delay: 100 }
);

export const LazyLiquidityIndicators = createLazyComponent(
  () => import('./LiquidityIndicatorsCard'),
  { delay: 100 }
);

export const LazySimplifiedDRE = createLazyComponent(
  () => import('./SimplifiedDRECard'),
  { delay: 100 }
);

export const LazyCashFlow = createLazyComponent(
  () => import('./CashFlowCard'),
  { delay: 100 }
);

// Componentes de risco e crescimento (carregamento baixo)
export const LazyDefaultAnalysis = createLazyComponent(
  () => import('./DefaultAnalysisCard'),
  { delay: 200 }
);

export const LazySustainability = createLazyComponent(
  () => import('./SustainabilityCard'),
  { delay: 200 }
);

export const LazyGrowthIndicators = createLazyComponent(
  () => import('./GrowthIndicatorsCard'),
  { delay: 200 }
);

export const LazyPredictability = createLazyComponent(
  () => import('./PredictabilityCard'),
  { delay: 200 }
);

// Componentes avançados (carregamento sob demanda)
export const LazyExportPanel = createLazyComponent(
  () => import('./ExportPanel'),
  { delay: 300, ssr: false }
);

export const LazyAlertsPanel = createLazyComponent(
  () => import('./AlertsPanel'),
  { delay: 300, ssr: false }
);

export const LazyDrillDownPanel = createLazyComponent(
  () => import('./DrillDownPanel'),
  { delay: 300, ssr: false }
);

export const LazyCustomReports = createLazyComponent(
  () => import('./CustomReportsPanel'),
  { delay: 300, ssr: false }
);

// Componentes de vendedores (carregamento sob demanda)
export const LazyRankingVendedores = createLazyComponent(
  () => import('./RankingVendedoresCard'),
  { delay: 250 }
);

export const LazyVendedoresPanel = createLazyComponent(
  () => import('./VendedoresPanel'),
  { delay: 250 }
);

// Componentes de produtos (carregamento sob demanda)
export const LazyProdutosMaisVendidos = createLazyComponent(
  () => import('./ProdutosMaisVendidos'),
  { delay: 250 }
);

export const LazyVendasPorDia = createLazyComponent(
  () => import('./VendasPorDiaCard'),
  { delay: 250 }
);

// Componentes de gráficos pesados (carregamento baixo)
export const LazyVendasPorFormaPagamento = createLazyComponent(
  () => import('./VendasPorFormaPagamentoChart'),
  { delay: 400, ssr: false }
);

export const LazyVendedoresChart = createLazyComponent(
  () => import('./VendedoresChartImproved'),
  { delay: 400, ssr: false }
);

// Hooks lazy loading
export const useLazyHook = <T,>(
  hookFactory: () => T,
  dependencies: any[] = []
): T | null => {
  try {
    return hookFactory();
  } catch (error) {
    console.warn('Hook não está disponível ainda:', error);
    return null;
  }
};

// Utilitário para pré-carregamento de componentes
export const preloadComponents = () => {
  // Pré-carrega componentes críticos
  const criticalComponents = [
    () => import('./OperationalIndicatorsCard'),
    () => import('./CACAnalysisCard'),
    () => import('./CostCenterCard')
  ];

  criticalComponents.forEach(component => {
    component().catch(error => {
      console.warn('Erro ao pré-carregar componente:', error);
    });
  });
};

// Utilitário para carregamento progressivo
export const ProgressiveLoader = ({ 
  children, 
  priority = 'normal',
  onLoadStart,
  onLoadEnd 
}: {
  children: React.ReactNode;
  priority?: 'high' | 'normal' | 'low';
  onLoadStart?: () => void;
  onLoadEnd?: () => void;
}) => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const delay = priority === 'high' ? 0 : priority === 'normal' ? 100 : 300;
    
    onLoadStart?.();
    
    const timer = setTimeout(() => {
      setIsLoaded(true);
      onLoadEnd?.();
    }, delay);

    return () => clearTimeout(timer);
  }, [priority, onLoadStart, onLoadEnd]);

  if (!isLoaded) {
    return <LoadingSpinner />;
  }

  return <>{children}</>;
};

// Hook para gerenciar estado de carregamento de componentes
export const useComponentLoading = () => {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  const setLoading = (componentName: string, loading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [componentName]: loading
    }));
  };

  const isLoading = (componentName: string) => loadingStates[componentName] || false;

  const isAnyLoading = Object.values(loadingStates).some(loading => loading);

  return {
    setLoading,
    isLoading,
    isAnyLoading,
    loadingStates
  };
};

// Wrapper para componentes com intersection observer
export const LazyIntersectionObserver = ({ 
  children, 
  threshold = 0.1,
  rootMargin = '50px'
}: {
  children: React.ReactNode;
  threshold?: number;
  rootMargin?: string;
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  return (
    <div ref={ref}>
      {isVisible ? children : <LoadingSpinner />}
    </div>
  );
};