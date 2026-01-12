/**
 * Loading States Components - Dashboard CEO
 * 
 * Componentes reutilizáveis para estados de loading, erro e feedback visual
 * Isolados da Dashboard CEO para não afetar outras dashboards
 */

// Skeleton Loaders
export { CardSkeleton, MetricCardSkeleton, MetricsGridSkeleton } from './CardSkeleton';
export { ChartSkeleton, LineChartSkeleton, PieChartSkeleton } from './ChartSkeleton';
export { TableSkeleton, ListSkeleton } from './TableSkeleton';

// Progress Indicators
export { ProgressIndicator, LoadingOverlay, InlineLoader } from './ProgressIndicator';

// Error States
export {
  ErrorState,
  ApiErrorState,
  NoDataState,
} from './ErrorState';

// Transitions
export { Transitions } from './Transitions';

// Stub exports for missing components
export const ValidationErrorState = () => null;
export const FadeIn = ({ children }: any) => children;
export const SlideIn = ({ children }: any) => children;
export const ScaleIn = ({ children }: any) => children;

