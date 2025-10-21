'use client';

import React from 'react';
import { Card, CardContent, CardHeader } from '@/app/_components/ui/card';

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
  className?: string;
}

/**
 * Skeleton loader para componentes de tabela da Dashboard CEO
 * Simula estrutura de tabela com cabeçalho e linhas
 */
export function TableSkeleton({
  rows = 5,
  columns = 4,
  showHeader = true,
  className = '',
}: TableSkeletonProps) {
  return (
    <Card className={`animate-pulse ${className}`}>
      {showHeader && (
        <CardHeader>
          <div className="bg-gray-200 dark:bg-gray-700 rounded h-6 w-1/3" />
        </CardHeader>
      )}
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                {Array.from({ length: columns }).map((_, index) => (
                  <th key={index} className="px-4 py-2">
                    <div className="bg-gray-200 dark:bg-gray-700 rounded h-4" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: rows }).map((_, rowIndex) => (
                <tr key={rowIndex} className="border-t border-gray-200 dark:border-gray-700">
                  {Array.from({ length: columns }).map((_, colIndex) => (
                    <td key={colIndex} className="px-4 py-3">
                      <div
                        className="bg-gray-200 dark:bg-gray-700 rounded h-4"
                        style={{
                          width: `${Math.random() * 40 + 60}%`,
                          animationDelay: `${(rowIndex * columns + colIndex) * 50}ms`,
                        }}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton loader para lista de itens
 */
export function ListSkeleton({
  items = 5,
  showAvatar = false,
  className = '',
}: {
  items?: number;
  showAvatar?: boolean;
  className?: string;
}) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: items }).map((_, index) => (
        <div
          key={index}
          className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg animate-pulse"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          {showAvatar && <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-10 w-10 flex-shrink-0" />}
          <div className="flex-1 space-y-2">
            <div className="bg-gray-200 dark:bg-gray-700 rounded h-4 w-3/4" />
            <div className="bg-gray-200 dark:bg-gray-700 rounded h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

