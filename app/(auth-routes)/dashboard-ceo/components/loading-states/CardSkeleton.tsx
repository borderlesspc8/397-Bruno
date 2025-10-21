'use client';

import React from 'react';
import { Card, CardContent, CardHeader } from '@/app/_components/ui/card';

interface CardSkeletonProps {
  showHeader?: boolean;
  headerHeight?: string;
  contentRows?: number;
  className?: string;
}

/**
 * Skeleton loader para componentes Card da Dashboard CEO
 * Fornece feedback visual durante o carregamento de dados
 */
export function CardSkeleton({
  showHeader = true,
  headerHeight = 'h-8',
  contentRows = 3,
  className = '',
}: CardSkeletonProps) {
  return (
    <Card className={`animate-pulse ${className}`}>
      {showHeader && (
        <CardHeader>
          <div className={`bg-gray-200 dark:bg-gray-700 rounded ${headerHeight} w-3/4`} />
        </CardHeader>
      )}
      <CardContent className="space-y-3">
        {Array.from({ length: contentRows }).map((_, index) => (
          <div
            key={index}
            className="bg-gray-200 dark:bg-gray-700 rounded h-4"
            style={{
              width: `${Math.random() * 40 + 60}%`,
              animationDelay: `${index * 100}ms`,
            }}
          />
        ))}
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton loader específico para cards de métricas
 * Mostra layout de métrica com valor e variação
 */
export function MetricCardSkeleton({ className = '' }: { className?: string }) {
  return (
    <Card className={`animate-pulse ${className}`}>
      <CardHeader className="pb-2">
        <div className="bg-gray-200 dark:bg-gray-700 rounded h-5 w-2/3" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="bg-gray-200 dark:bg-gray-700 rounded h-8 w-1/2" />
          <div className="bg-gray-200 dark:bg-gray-700 rounded h-4 w-1/3" />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton loader para grid de métricas
 */
export function MetricsGridSkeleton({
  columns = 4,
  className = '',
}: {
  columns?: number;
  className?: string;
}) {
  return (
    <div className={`grid gap-4 ${className}`} style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
      {Array.from({ length: columns }).map((_, index) => (
        <MetricCardSkeleton key={index} />
      ))}
    </div>
  );
}

