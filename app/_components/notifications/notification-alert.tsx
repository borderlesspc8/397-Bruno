"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import useNotificationStore, { Notification, NotificationType, NotificationPriority } from '@/app/_hooks/use-notification-store';
import useSocketNotifications from '@/app/_hooks/use-socket-notifications';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Check, ArrowUpRight, Banknote, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/_components/ui/card';
import { Badge } from '@/app/_components/ui/badge';
import { Button } from '@/app/_components/ui/button';
import { useToast } from '@/app/_components/ui/use-toast';
import { useNotificationsApi } from '@/app/_hooks/use-notifications-api';
import { cn } from '@/app/_lib/utils';

const MAX_VISIBLE_NOTIFICATIONS = 3;

// Funções utilitárias
function formatarValor(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
}

interface NotificationAlertProps {
  // Duração máxima de exibição (ms)
  duration?: number;
  // Tipos de notificação a exibir (filtragem)
  types?: string[];
  // Prioridades a exibir (filtragem)
  priorities?: string[];
  // Ocultar automaticamente após duração
  autoHide?: boolean;
  // Posição na tela
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  // Callback ao clicar em uma notificação
  onActionClick?: (notification: Notification) => void;
}

export default function NotificationAlert({
  duration = 10000,
  types = ['TRANSACTION'],
  priorities = ['HIGH', 'MEDIUM'],
  autoHide = true,
  position = 'bottom-right',
  onActionClick,
}: NotificationAlertProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { isConnected } = useSocketNotifications();
  
  // Usar useRef em vez de useState para evitar ciclos de renderização
  const dismissedIdsRef = useRef<Set<string>>(new Set());
  
  // Estado local para armazenar notificações visíveis (forçar rerenderização)
  const [visibleNotifications, setVisibleNotifications] = useState<Notification[]>([]);
  
  // Obter notificações do store
  const notifications = useNotificationStore((state) => state.notifications);
  
  const { markAsRead, archiveNotification } = useNotificationsApi();
  
  // Posição CSS
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
  };
  
  // Função para marcar como dispensada
  const dismiss = useCallback((id: string) => {
    dismissedIdsRef.current.add(id);
    // Agendar a atualização em vez de executá-la imediatamente
    requestAnimationFrame(() => {
      updateVisibleNotifications();
    });
  }, []);
  
  // Função para atualizar notificações visíveis sem criar dependências cíclicas
  const updateVisibleNotifications = useCallback(() => {
    // Criar uma cópia dos dados para evitar problemas de comparação
    const notificationsArray = [...notifications];
    const dismissedIds = Array.from(dismissedIdsRef.current);
    
    const filteredNotifications = notificationsArray
      .filter(n => (
        !n.isRead && 
        !n.isArchived && 
        types.includes(n.type) && 
        priorities.includes(n.priority) &&
        !dismissedIds.includes(n.id)
      ))
      .slice(0, MAX_VISIBLE_NOTIFICATIONS);
    
    // Comparar se realmente mudou antes de atualizar o estado
    const currentIds = filteredNotifications.map(n => n.id).join(',');
    const prevIds = visibleNotifications.map(n => n.id).join(',');
    
    if (currentIds !== prevIds) {
      setVisibleNotifications(filteredNotifications);
    }
  }, [notifications, types, priorities, visibleNotifications]);
  
  // Efeito para atualizar notificações visíveis quando as notificações mudarem
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      updateVisibleNotifications();
    }, 50); // Pequeno atraso para evitar múltiplas renderizações próximas
    
    return () => clearTimeout(timeoutId);
  }, [updateVisibleNotifications]);
  
  // Auto-ocultar após duração
  useEffect(() => {
    if (!autoHide || visibleNotifications.length === 0) return;
    
    const timers: NodeJS.Timeout[] = [];
    
    visibleNotifications.forEach(notification => {
      const timer = setTimeout(() => {
        dismiss(notification.id);
      }, duration);
      timers.push(timer);
    });
    
    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [autoHide, duration, visibleNotifications, dismiss]);
  
  // Resetar quando não houver mais notificações
  useEffect(() => {
    if (notifications.length === 0 && dismissedIdsRef.current.size > 0) {
      dismissedIdsRef.current.clear();
    }
  }, [notifications.length]);
  
  // Manipulador para fechar notificação
  const handleClose = useCallback((id: string) => {
    dismiss(id);
    
    // Marcar como lida na API (não precisa esperar)
    markAsRead(id).catch(err => 
      console.error("Erro ao marcar notificação como lida:", err)
    );
  }, [dismiss, markAsRead]);
  
  // Manipulador para ação de notificação
  const handleAction = useCallback(async (notification: Notification) => {
    // Marcar como dispensada antes de qualquer navegação para evitar loops
    dismiss(notification.id);
    
    try {
      // Primeiro, marcar como lida e arquivar no servidor
      await markAsRead(notification.id);
      await archiveNotification(notification.id);
      
      // Depois, realizar outras ações após as operações de servidor
      // Chamar callback se fornecido
      if (onActionClick) {
        onActionClick(notification);
      }
      
      // Navegar se houver um link (último passo, após todas as outras operações)
      if (notification.link) {
        // Usar setTimeout para evitar problemas de navegação durante o processamento
        setTimeout(() => {
          router.push(notification.link!);
        }, 100);
      }
    } catch (error) {
      console.error("Erro ao processar notificação:", error);
      toast({
        title: "Erro",
        description: "Não foi possível processar a notificação",
        variant: "destructive"
      });
    }
  }, [router, dismiss, markAsRead, archiveNotification, onActionClick, toast]);
  
  // Renderizar ícone baseado no tipo
  const renderIcon = useCallback((type: NotificationType) => {
    switch (type) {
      case NotificationType.TRANSACTION:
        return <Banknote className="h-6 w-6 text-blue-500" />;
      case NotificationType.BALANCE:
        return <AlertCircle className="h-6 w-6 text-yellow-500" />;
      default:
        return <Bell className="h-6 w-6 text-gray-500" />;
    }
  }, []);
  
  // Não renderizar nada se não houver notificações visíveis
  if (visibleNotifications.length === 0) return null;
  
  return (
    <div className={`fixed z-50 flex flex-col gap-3 w-full max-w-md ${positionClasses[position]}`}>
      <AnimatePresence>
        {visibleNotifications.map(notification => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="w-full"
          >
            <Card className={cn(
              "border shadow-lg backdrop-blur-sm bg-card/95 overflow-hidden",
              notification.priority === NotificationPriority.HIGH && "border-l-4 border-l-red-500",
              notification.priority === NotificationPriority.MEDIUM && "border-l-4 border-l-yellow-500"
            )}>
              <CardHeader className="pb-2 pt-3 px-4">
                <div className="flex justify-between items-start">
                  <div className="flex gap-3 items-center">
                    <div className="rounded-full bg-primary-50 p-2 flex-shrink-0">
                      {renderIcon(notification.type as NotificationType)}
                    </div>
                    <div>
                      <CardTitle className="text-base font-medium">{notification.title}</CardTitle>
                      <CardDescription className="text-xs mt-0.5">
                        {new Date(notification.createdAt).toLocaleString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                          day: '2-digit',
                          month: '2-digit'
                        })}
                      </CardDescription>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={() => handleClose(notification.id)}
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Fechar notificação</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pb-3 px-4">
                <p className="text-sm">{notification.message}</p>
                {notification.metadata && notification.type === NotificationType.TRANSACTION && (
                  <div className="mt-2 p-3 rounded-md bg-muted/50">
                    {notification.metadata.amount && (
                      <p className="text-sm font-medium">
                        Valor: {formatarValor(notification.metadata.amount)}
                      </p>
                    )}
                    {notification.metadata.reason && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Motivo: {notification.metadata.reason}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
              {notification.link && (
                <CardFooter className="pt-0 pb-3 px-4 flex justify-end">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 text-xs flex items-center gap-1 text-primary"
                    onClick={() => handleAction(notification)}
                  >
                    <span>Ver detalhes</span>
                    <ArrowUpRight className="h-3 w-3" />
                  </Button>
                </CardFooter>
              )}
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
      
      {/* Indicador de conexão do socket */}
      {isConnected !== undefined && (
        <div className="absolute -top-2 -right-2 h-3 w-3">
          <div 
            className={`h-full w-full rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} 
            animate-pulse`}
          />
        </div>
      )}
    </div>
  );
} 