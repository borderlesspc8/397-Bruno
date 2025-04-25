"use client";

import React from 'react';
import { Button, ButtonProps } from '@/app/_components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/app/_components/ui/dropdown-menu';
import { Loader2 } from 'lucide-react';
import { cn } from '@/app/_lib/utils';

export interface ActionItem {
  id: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  onClick: () => void;
  className?: string;
  disabled?: boolean;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
}

export interface ActionButtonProps extends ButtonProps {
  text?: string;
  icon?: React.ReactNode;
  items: ActionItem[];
  showIcon?: boolean;
  showText?: boolean;
  fullWidth?: boolean;
  align?: 'start' | 'center' | 'end';
  loading?: boolean;
  onMainAction?: () => void;
}

/**
 * Componente de botão de ação com menu dropdown
 */
export function ActionButton({
  text = 'Ações',
  icon,
  items,
  showIcon = true,
  showText = true,
  fullWidth = false,
  className = '',
  align = 'end',
  loading = false,
  onMainAction,
  ...props
}: ActionButtonProps) {
  // Se houver uma ação principal, o clique no botão a executa
  // caso contrário, o botão só abre o dropdown
  const handleMainButtonClick = (e: React.MouseEvent) => {
    if (onMainAction) {
      e.preventDefault();
      onMainAction();
    }
  };
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          className={cn(
            fullWidth && "w-full",
            (showIcon && showText && icon) && "gap-2",
            className
          )}
          onClick={handleMainButtonClick}
          disabled={loading || props.disabled}
          {...props}
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {showIcon && !loading && icon}
          {showText && <span>{text}</span>}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align={align} className="w-60">
        {items.map((item) => (
          <DropdownMenuItem
            key={item.id}
            onClick={item.onClick}
            disabled={item.disabled}
            className={cn(
              "flex items-center gap-2 py-2 px-3 cursor-pointer",
              item.className
            )}
          >
            {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
            <div className="flex flex-col">
              <span>{item.label}</span>
              {item.description && (
                <span className="text-xs text-muted-foreground">
                  {item.description}
                </span>
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 