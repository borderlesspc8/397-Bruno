"use client";

import React, { ReactNode, Suspense } from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { LoadingIndicator } from '@/app/_components/ui/loading-indicator';

interface AsyncBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  errorFallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  resetKeys?: any[];
  loadingText?: string;
}

/**
 * Componente que combina ErrorBoundary e Suspense para lidar com
 * estados de carregamento e erro em operações assíncronas
 */
export function AsyncBoundary({
  children,
  fallback,
  errorFallback,
  onError,
  resetKeys,
  loadingText = 'Carregando...'
}: AsyncBoundaryProps) {
  const defaultFallback = (
    <div className="flex justify-center items-center py-8">
      <LoadingIndicator text={loadingText} />
    </div>
  );

  return (
    <ErrorBoundary 
      fallback={errorFallback}
      onError={onError}
      resetKeys={resetKeys}
    >
      <Suspense fallback={fallback || defaultFallback}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
} 