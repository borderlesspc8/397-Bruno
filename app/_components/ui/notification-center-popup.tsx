"use client";

import { Bell } from "lucide-react";
import { Card } from "./card";
import { EmptyNotificationPopup } from "./empty-notification";
import { cn } from "@/app/_lib/utils";

interface NotificationCenterPopupProps {
  className?: string;
}

/**
 * Componente para exibir o popup central de notificações
 * Este componente é usado na tela mostrada na imagem, com Sem notificações
 */
export function NotificationCenterPopup({
  className
}: NotificationCenterPopupProps) {
  return (
    <Card className={cn(
      "absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[400px] h-[300px] shadow-lg border bg-background/95 backdrop-blur-sm rounded-lg overflow-hidden z-50",
      className
    )}>
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-medium text-base">Notificações</h3>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto">
          <EmptyNotificationPopup 
            message="Você receberá notificações sobre transações, alertas de saldo e atividades importantes da sua conta." 
          />
        </div>
      </div>
    </Card>
  );
} 