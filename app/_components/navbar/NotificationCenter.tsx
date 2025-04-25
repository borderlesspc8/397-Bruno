"use client";

import { useRouter } from "next/navigation";
import { Bell, Info, AlertCircle, Check, X, ArrowRight } from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuTrigger,
  DropdownMenuLabel 
} from "../ui/dropdown-menu";
import { ScrollArea } from "../ui/scroll-area";
import { cn } from "../../_lib/utils";
import { Notification } from "./types";
import { formatarTempoRelativo } from "./utils/formatters";
import { useNotifications } from "./hooks/useNotifications";
import { EmptyNotificationState } from "../ui/notification";

export const NotificationCenter = () => {
  const router = useRouter();
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    removeNotification, 
    clearAllNotifications 
  } = useNotifications();

  // Handler para ação de clique em notificação
  const handleNotificationAction = (notification: Notification) => {
    // Marcar como lida
    if (!notification.read) {
      markAsRead(notification.id);
    }
    
    // Navegar para URL de ação se existir
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-9 w-9 relative"
          aria-label={`Notificações ${unreadCount > 0 ? `(${unreadCount} não lidas)` : ''}`}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center text-xs px-1"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[350px] p-0 overflow-hidden">
        <div className="flex items-center justify-between p-3 border-b">
          <DropdownMenuLabel className="text-sm font-medium">Notificações</DropdownMenuLabel>
          <div className="flex gap-1">
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={markAllAsRead} 
                className="h-8 text-xs"
              >
                Marcar todas como lidas
              </Button>
            )}
            {notifications.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearAllNotifications} 
                className="h-8 text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
              >
                Limpar
              </Button>
            )}
          </div>
        </div>
        <ScrollArea className="max-h-[350px] overflow-y-auto">
          {notifications.length === 0 ? (
            <EmptyNotificationState />
          ) : (
            <div>
              {notifications.map(notification => (
                <div 
                  key={notification.id}
                  onClick={() => handleNotificationAction(notification)}
                  className={cn(
                    "p-4 border-b last:border-none relative hover:bg-muted/30 transition-colors",
                    !notification.read && "bg-muted/30",
                    notification.actionUrl && "cursor-pointer"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 mt-0.5">
                      {notification.type === 'info' && <Info className="h-5 w-5 text-blue-500" />}
                      {notification.type === 'warning' && <AlertCircle className="h-5 w-5 text-amber-500" />}
                      {notification.type === 'success' && <Check className="h-5 w-5 text-green-500" />}
                      {notification.type === 'error' && <AlertCircle className="h-5 w-5 text-rose-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm truncate pr-6">
                          {notification.title}
                        </h4>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 absolute top-3 right-3 rounded-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeNotification(notification.id);
                          }}
                        >
                          <X className="h-3 w-3" />
                          <span className="sr-only">Remover notificação</span>
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <time 
                          dateTime={notification.date.toISOString()} 
                          className="text-xs text-muted-foreground"
                        >
                          {formatarTempoRelativo(notification.date)}
                        </time>
                        {!notification.read && (
                          <Badge variant="outline" className="text-xs bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700 h-5 rounded-full px-2">
                            Não lida
                          </Badge>
                        )}
                      </div>
                      {notification.actionUrl && (
                        <div className="flex items-center mt-2 text-xs text-primary">
                          <span>Ver detalhes</span>
                          <ArrowRight className="h-3 w-3 ml-1" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}; 