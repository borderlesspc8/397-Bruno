import React from 'react';
import { Badge } from '@/app/_components/ui/badge';
import { Button } from '@/app/_components/ui/button';
import { Card, CardContent } from '@/app/_components/ui/card';
import { cn } from '@/app/_lib/utils';
import {
  Bell,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  CreditCard,
  DollarSign,
  ExternalLink,
  FileText,
  MoreHorizontal,
  RefreshCw,
  Trash2,
  AlertTriangle,
  XCircle
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/app/_components/ui/dropdown-menu';
import Link from 'next/link';

export type NotificationType = 
  | 'transaction' 
  | 'system' 
  | 'alert' 
  | 'info' 
  | 'success' 
  | 'error' 
  | 'warning'
  | 'bill';

export type NotificationPriority = 'low' | 'medium' | 'high';

export interface NotificationData {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
  expiresAt?: string;
  priority?: NotificationPriority;
  actions?: Array<{
    label: string;
    url?: string;
    action?: string;
  }>;
  relatedId?: string;
  relatedType?: string;
}

interface NotificationCardProps {
  notification: NotificationData;
  onMarkAsRead?: (id: string) => void;
  onDelete?: (id: string) => void;
  onClick?: (notification: NotificationData) => void;
  compact?: boolean;
  className?: string;
}

/**
 * Componente NotificationCard - Exibe uma notificação com ações relevantes
 */
export const NotificationCard: React.FC<NotificationCardProps> = ({
  notification,
  onMarkAsRead,
  onDelete,
  onClick,
  compact = false,
  className
}) => {
  // Converter a data de criação para formato legível
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    
    // Se for hoje, mostrar "Hoje às HH:MM"
    if (date.toDateString() === now.toDateString()) {
      return `Hoje às ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // Se for ontem, mostrar "Ontem às HH:MM"
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return `Ontem às ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // Caso contrário, mostrar a data completa
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Determinar o ícone com base no tipo de notificação
  const getNotificationIcon = () => {
    const iconClassName = 'h-5 w-5';
    
    switch (notification.type) {
      case 'transaction':
        return <DollarSign className={iconClassName} />;
      case 'bill':
        return <CreditCard className={iconClassName} />;
      case 'success':
        return <CheckCircle2 className={iconClassName} />;
      case 'error':
        return <XCircle className={iconClassName} />;
      case 'warning':
        return <AlertTriangle className={iconClassName} />;
      case 'alert':
        return <Bell className={iconClassName} />;
      case 'info':
        return <FileText className={iconClassName} />;
      default:
        return <Bell className={iconClassName} />;
    }
  };
  
  // Determinar a cor/classe com base no tipo de notificação
  const getNotificationColorClass = (): string => {
    switch (notification.type) {
      case 'transaction':
        return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
      case 'bill':
        return 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400';
      case 'success':
        return 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400';
      case 'error':
        return 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400';
      case 'warning':
        return 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400';
      case 'alert':
        return 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400';
      case 'info':
        return 'bg-slate-100 text-slate-600 dark:bg-slate-900/30 dark:text-slate-400';
      default:
        return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
    }
  };
  
  // Determinar o badge da prioridade
  const getPriorityBadge = () => {
    if (!notification.priority || notification.priority === 'low') {
      return null;
    }
    
    const priorityConfig: Record<NotificationPriority, { label: string, className: string }> = {
      low: {
        label: 'Baixa',
        className: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800/60 dark:text-gray-400 dark:border-gray-700'
      },
      medium: {
        label: 'Média',
        className: 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800'
      },
      high: {
        label: 'Alta',
        className: 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
      }
    };
    
    const config = priorityConfig[notification.priority];
    
    return (
      <Badge variant="outline" className={cn('text-xs font-normal', config.className)}>
        {config.label}
      </Badge>
    );
  };
  
  // Verificar se a notificação expirou
  const isExpired = (): boolean => {
    if (!notification.expiresAt) return false;
    return new Date(notification.expiresAt) < new Date();
  };
  
  return (
    <Card
      className={cn(
        'overflow-hidden transition-all duration-200 group',
        !notification.isRead && 'border-l-4 border-l-primary',
        isExpired() && 'opacity-70',
        onClick ? 'cursor-pointer hover:shadow-sm' : '',
        compact ? 'p-0' : '',
        className
      )}
      onClick={() => onClick?.(notification)}
    >
      <CardContent className={cn('flex items-start gap-3', compact ? 'p-3' : 'p-4')}>
        {/* Ícone da notificação */}
        <div className={cn('p-2 rounded-md self-start mt-0.5', getNotificationColorClass())}>
          {getNotificationIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          {/* Cabeçalho da notificação */}
          <div className="flex items-start justify-between">
            <div>
              {/* Título da notificação */}
              <h3 className="font-medium">{notification.title}</h3>
              
              {/* Data e status */}
              <div className="flex items-center mt-0.5 gap-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center">
                  <Calendar className="h-3 w-3 mr-1" />
                  {formatDate(notification.createdAt)}
                </span>
                
                {!notification.isRead && (
                  <Badge variant="secondary" className="text-[10px] py-0 px-1.5 h-4">
                    Não lida
                  </Badge>
                )}
                
                {/* Mostrar badge de prioridade */}
                {getPriorityBadge()}
                
                {/* Mostrar se expirou */}
                {isExpired() && (
                  <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4 bg-gray-50 text-gray-500 border-gray-200 dark:bg-gray-800/60 dark:text-gray-400 dark:border-gray-700">
                    <Clock className="h-2.5 w-2.5 mr-0.5" />
                    Expirada
                  </Badge>
                )}
              </div>
            </div>
            
            {/* Menu de opções */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Opções</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {!notification.isRead && onMarkAsRead && (
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onMarkAsRead(notification.id); }} className="cursor-pointer">
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Marcar como lida
                  </DropdownMenuItem>
                )}
                
                {onDelete && (
                  <>
                    {!notification.isRead && onMarkAsRead && <DropdownMenuSeparator />}
                    <DropdownMenuItem 
                      onClick={(e) => { e.stopPropagation(); onDelete(notification.id); }} 
                      className="cursor-pointer text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remover notificação
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {/* Mensagem da notificação */}
          <p className="text-sm text-muted-foreground mt-2">
            {notification.message}
          </p>
          
          {/* Ações da notificação */}
          {notification.actions && notification.actions.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {notification.actions.map((action, index) => {
                // Se tiver URL, renderizar como Link
                if (action.url) {
                  return (
                    <Link 
                      key={index} 
                      href={action.url} 
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex"
                    >
                      <Button variant="outline" size="sm" className="h-8 text-xs">
                        {action.label}
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </Button>
                    </Link>
                  );
                }
                
                // Caso contrário, renderizar como botão normal
                return (
                  <Button 
                    key={index} 
                    variant="outline" 
                    size="sm" 
                    className="h-8 text-xs" 
                    onClick={(e) => {
                      e.stopPropagation();
                      // Aqui poderia executar uma ação baseada no action.action
                      console.log(`Action ${action.action} triggered for notification ${notification.id}`);
                    }}
                  >
                    {action.label}
                    <ChevronRight className="h-3 w-3 ml-1" />
                  </Button>
                );
              })}
            </div>
          )}
          
          {/* Indicação de tempo restante até expirar (se aplicável e não tiver expirado) */}
          {notification.expiresAt && !isExpired() && (
            <p className="text-xs text-muted-foreground mt-3 flex items-center">
              <RefreshCw className="h-3 w-3 mr-1 inline" />
              Expira em: {formatDate(notification.expiresAt)}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationCard; 