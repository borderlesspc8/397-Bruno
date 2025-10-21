'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

interface ProgressIndicatorProps {
  message?: string;
  progress?: number;
  showPercentage?: boolean;
  variant?: 'spinner' | 'bar' | 'dots';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Indicador de progresso para operações longas da Dashboard CEO
 * Suporta diferentes variantes visuais e exibição de progresso
 */
export function ProgressIndicator({
  message = 'Carregando...',
  progress,
  showPercentage = false,
  variant = 'spinner',
  size = 'md',
  className = '',
}: ProgressIndicatorProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  if (variant === 'spinner') {
    return (
      <div className={`flex flex-col items-center justify-center space-y-3 ${className}`}>
        <Loader2 className={`animate-spin text-primary ${sizeClasses[size]}`} />
        {message && <p className="text-sm text-muted-foreground animate-pulse">{message}</p>}
        {showPercentage && progress !== undefined && (
          <p className="text-xs font-medium text-primary">{Math.round(progress)}%</p>
        )}
      </div>
    );
  }

  if (variant === 'bar') {
    return (
      <div className={`w-full space-y-2 ${className}`}>
        {message && <p className="text-sm text-muted-foreground text-center">{message}</p>}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
          <div
            className="bg-primary h-full rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress ?? 0}%` }}
          />
        </div>
        {showPercentage && progress !== undefined && (
          <p className="text-xs font-medium text-center text-primary">{Math.round(progress)}%</p>
        )}
      </div>
    );
  }

  if (variant === 'dots') {
    return (
      <div className={`flex flex-col items-center justify-center space-y-3 ${className}`}>
        <div className="flex space-x-2">
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              className={`${sizeClasses[size]} bg-primary rounded-full animate-bounce`}
              style={{ animationDelay: `${index * 150}ms` }}
            />
          ))}
        </div>
        {message && <p className="text-sm text-muted-foreground animate-pulse">{message}</p>}
      </div>
    );
  }

  return null;
}

/**
 * Overlay de loading para bloquear interação durante operações
 */
export function LoadingOverlay({
  message = 'Processando...',
  progress,
  className = '',
}: {
  message?: string;
  progress?: number;
  className?: string;
}) {
  return (
    <div className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center ${className}`}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-sm w-full mx-4">
        <ProgressIndicator message={message} progress={progress} showPercentage={progress !== undefined} variant="bar" />
      </div>
    </div>
  );
}

/**
 * Indicador de loading inline para seções específicas
 */
export function InlineLoader({
  message = 'Carregando...',
  size = 'sm',
  className = '',
}: {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Loader2 className={`animate-spin text-primary ${size === 'sm' ? 'h-4 w-4' : size === 'md' ? 'h-6 w-6' : 'h-8 w-8'}`} />
      {message && <span className="text-sm text-muted-foreground">{message}</span>}
    </div>
  );
}

