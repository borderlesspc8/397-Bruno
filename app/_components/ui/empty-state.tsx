import React from "react";
import { cn } from "@/app/_lib/utils";
import { Button } from "./button";
import Link from "next/link";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  size?: "default" | "compact" | "large";
  appearance?: "default" | "subtle" | "bordered";
}

/**
 * Componente reutilizável para estados vazios na aplicação
 * Utilizado quando não há dados para exibir em uma visualização
 */
const EmptyState = ({
  icon,
  title,
  description,
  action,
  className,
  size = "default",
  appearance = "default"
}: EmptyStateProps) => {
  // Determinar classes com base no tamanho
  const sizeClasses = {
    compact: "py-6 px-4",
    default: "py-10 px-6",
    large: "py-16 px-8"
  };
  
  // Determinar classes com base na aparência
  const appearanceClasses = {
    default: "bg-background",
    subtle: "bg-muted/30",
    bordered: "border border-border/60 rounded-lg"
  };
  
  return (
    <div className={cn(
      "flex flex-col items-center justify-center text-center",
      sizeClasses[size],
      appearanceClasses[appearance],
      className
    )}>
      {/* Ícone */}
      {icon && (
        <div className="mb-4 text-muted-foreground">
          {icon}
        </div>
      )}
      
      {/* Título */}
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      
      {/* Descrição opcional */}
      {description && (
        <p className="text-muted-foreground text-sm max-w-md mb-4">
          {description}
        </p>
      )}
      
      {/* Ação opcional */}
      {action && (
        <div className="mt-2">
          {action}
        </div>
      )}
    </div>
  );
};

// Componente de botão de ação para uso com EmptyState
export const EmptyStateAction = ({
  href,
  onClick,
  children,
  ...props
}: React.ComponentProps<typeof Button> & { href?: string }) => {
  const buttonContent = (
    <Button size="sm" {...props}>
      {children}
    </Button>
  );
  
  if (href) {
    return <Link href={href}>{buttonContent}</Link>;
  }
  
  return buttonContent;
};

export { EmptyState };
export default EmptyState; 
