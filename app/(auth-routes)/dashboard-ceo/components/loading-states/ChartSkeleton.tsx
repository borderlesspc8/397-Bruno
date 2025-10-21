'use client';

import React from 'react';
import { Card, CardContent, CardHeader } from '@/app/_components/ui/card';

interface ChartSkeletonProps {
  height?: string;
  showLegend?: boolean;
  showHeader?: boolean;
  className?: string;
}

/**
 * Skeleton loader para componentes de gráfico da Dashboard CEO
 * Simula a estrutura de um gráfico com cabeçalho e área de visualização
 */
export function ChartSkeleton({
  height = 'h-64',
  showLegend = true,
  showHeader = true,
  className = '',
}: ChartSkeletonProps) {
  return (
    <Card className={`animate-pulse ${className}`}>
      {showHeader && (
        <CardHeader>
          <div className="bg-gray-200 dark:bg-gray-700 rounded h-6 w-1/2" />
          <div className="bg-gray-200 dark:bg-gray-700 rounded h-4 w-1/3 mt-2" />
        </CardHeader>
      )}
      <CardContent>
        <div className={`bg-gray-100 dark:bg-gray-800 rounded-lg ${height} flex items-end justify-around p-4 space-x-2`}>
          {/* Simula barras de gráfico */}
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="bg-gray-200 dark:bg-gray-700 rounded-t w-full transition-all"
              style={{
                height: `${Math.random() * 60 + 40}%`,
                animationDelay: `${index * 100}ms`,
              }}
            />
          ))}
        </div>
        {showLegend && (
          <div className="flex justify-center space-x-4 mt-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-3 w-3" />
                <div className="bg-gray-200 dark:bg-gray-700 rounded h-3 w-16" />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton loader específico para gráficos de linha
 */
export function LineChartSkeleton({ className = '' }: { className?: string }) {
  return (
    <Card className={`animate-pulse ${className}`}>
      <CardHeader>
        <div className="bg-gray-200 dark:bg-gray-700 rounded h-6 w-1/2" />
      </CardHeader>
      <CardContent>
        <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-lg p-4 relative overflow-hidden">
          {/* Simula linha de tendência */}
          <svg className="w-full h-full">
            <path
              d="M 0,200 Q 100,150 200,180 T 400,120 T 600,160"
              stroke="currentColor"
              strokeWidth="3"
              fill="none"
              className="text-gray-300 dark:text-gray-600"
            />
          </svg>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton loader específico para gráficos de pizza
 */
export function PieChartSkeleton({ className = '' }: { className?: string }) {
  return (
    <Card className={`animate-pulse ${className}`}>
      <CardHeader>
        <div className="bg-gray-200 dark:bg-gray-700 rounded h-6 w-1/2" />
      </CardHeader>
      <CardContent className="flex items-center justify-center">
        <div className="relative w-48 h-48">
          <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 rounded-full" />
          <div className="absolute inset-4 bg-white dark:bg-gray-900 rounded-full" />
        </div>
      </CardContent>
    </Card>
  );
}

