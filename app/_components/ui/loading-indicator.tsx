"use client";

import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/app/_lib/utils';

interface LoadingIndicatorProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  textPosition?: 'right' | 'bottom';
  className?: string;
  iconClassName?: string;
  textClassName?: string;
}

/**
 * Componente de indicador de carregamento
 */
export function LoadingIndicator({
  size = 'md',
  text,
  textPosition = 'right',
  className = '',
  iconClassName = '',
  textClassName = ''
}: LoadingIndicatorProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6', 
    lg: 'h-8 w-8'
  };
  
  const containerDirection = textPosition === 'right' ? 'flex-row' : 'flex-col';
  
  return (
    <div className={cn('flex items-center', containerDirection, className)}>
      <Loader2 className={cn(
        'animate-spin text-primary',
        sizeClasses[size],
        iconClassName
      )} />
      
      {text && (
        <span className={cn(
          'text-muted-foreground',
          textPosition === 'right' ? 'ml-2' : 'mt-2',
          size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm',
          textClassName
        )}>
          {text}
        </span>
      )}
    </div>
  );
} 
