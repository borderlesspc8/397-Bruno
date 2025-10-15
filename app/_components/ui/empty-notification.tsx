"use client";

import { Bell } from "lucide-react";
import { Card, CardContent } from "./card";
import { Button } from "./button";
import { cn } from "@/app/_lib/utils";

interface EmptyNotificationPopupProps {
  title?: string;
  message?: string;
  icon?: React.ReactNode;
  className?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Componente para exibir o estado vazio do popup central de notificações
 * seguindo os princípios do Material Design
 */
export function EmptyNotificationPopup({
  title = "Sem notificações",
  message = "As notificações aparecerão aqui quando você recebê-las.",
  icon,
  className,
  action
}: EmptyNotificationPopupProps) {
  return (
    <Card className={cn(
      "w-full h-full flex items-center justify-center border-none shadow-none bg-transparent",
      className
    )}>
      <CardContent className="flex flex-col items-center justify-center p-8 text-center">
        <div className="relative w-24 h-24 mb-6">
          <div className="absolute inset-0 bg-muted/20 rounded-full flex items-center justify-center"></div>
          {icon || <Bell className="absolute inset-0 h-12 w-12 m-auto text-muted-foreground/60" strokeWidth={1.5} />}
        </div>
        
        <h3 className="text-lg font-medium text-foreground mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-xs mb-6">{message}</p>
        
        {action && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={action.onClick}
            className="mt-2"
          >
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  );
} 
