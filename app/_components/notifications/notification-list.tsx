import React, { useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/_components/ui/tabs';
import NotificationCard from './notification-card';
import { Button } from '@/app/_components/ui/button';
import { Badge } from '@/app/_components/ui/badge';
import { Spinner } from '@/app/_components/ui/spinner';
import { useNotificationsApi } from '@/app/_hooks/use-notifications-api';
import useNotificationStore from '@/app/_hooks/use-notification-store';
import { Check, Bell, BellOff, Archive, RefreshCw } from 'lucide-react';

interface NotificationListProps {
  compact?: boolean;
  maxItems?: number;
  className?: string;
}

/**
 * Componente que exibe a lista de notificações do usuário com tabs para filtrar
 */
export default function NotificationList({
  compact = false,
  maxItems = 10,
  className = '',
}: NotificationListProps) {
  const { 
    fetchNotifications, 
    markAsRead, 
    markAllAsRead, 
    archiveNotification, 
    deleteNotification,
    loading,
    error
  } = useNotificationsApi();
  
  const { 
    notifications, 
    hasMore, 
    unreadCount 
  } = useNotificationStore();

  // Carregar notificações não lidas inicialmente
  useEffect(() => {
    fetchNotifications({ isRead: false, isArchived: false });
  }, []);

  // Carregar mais notificações
  const loadMore = () => {
    if (hasMore && !loading) {
      fetchNotifications({
        isRead: false,
        isArchived: false,
        cursor: notifications[notifications.length - 1]?.createdAt.toISOString(),
      });
    }
  };

  // Alternar entre abas
  const handleTabChange = (value: string) => {
    if (value === 'unread') {
      fetchNotifications({ isRead: false, isArchived: false });
    } else if (value === 'all') {
      fetchNotifications({ isArchived: false });
    } else if (value === 'archived') {
      fetchNotifications({ isArchived: true });
    }
  };

  // Marcar todas como lidas
  const handleMarkAllAsRead = async () => {
    if (unreadCount > 0 && !loading) {
      await markAllAsRead();
    }
  };

  // Atualizar lista de notificações
  const handleRefresh = () => {
    const currentTab = document.querySelector('[data-state="active"][role="tab"]')?.getAttribute('value');
    if (currentTab === 'unread') {
      fetchNotifications({ isRead: false, isArchived: false });
    } else if (currentTab === 'all') {
      fetchNotifications({ isArchived: false });
    } else if (currentTab === 'archived') {
      fetchNotifications({ isArchived: true });
    }
  };

  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notificações
          {unreadCount > 0 && (
            <Badge variant="destructive" className="ml-2">
              {unreadCount}
            </Badge>
          )}
        </h3>
        
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={loading || unreadCount === 0}
              title="Marcar todas como lidas"
            >
              <Check className="h-4 w-4 mr-1" />
              {!compact && 'Marcar todas'}
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
            title="Atualizar notificações"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 mb-4 bg-destructive/10 text-destructive rounded-md">
          <p className="text-sm">{error}</p>
        </div>
      )}

      <Tabs defaultValue="unread" onValueChange={handleTabChange}>
        <TabsList className="w-full mb-4">
          <TabsTrigger value="unread" className="flex-1">
            Não lidas
            {unreadCount > 0 && <Badge className="ml-2">{unreadCount}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="all" className="flex-1">Todas</TabsTrigger>
          <TabsTrigger value="archived" className="flex-1">Arquivadas</TabsTrigger>
        </TabsList>

        {['unread', 'all', 'archived'].map((tab) => (
          <TabsContent key={tab} value={tab} className="space-y-4">
            {loading && notifications.length === 0 ? (
              <div className="flex justify-center py-8">
                <Spinner size="lg" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <BellOff className="mx-auto h-12 w-12 mb-2 opacity-20" />
                <p>
                  {tab === 'unread'
                    ? 'Não há notificações não lidas'
                    : tab === 'all'
                    ? 'Não há notificações'
                    : 'Não há notificações arquivadas'}
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  {notifications
                    .slice(0, compact ? maxItems : undefined)
                    .map((notification) => (
                      <NotificationCard
                        key={notification.id}
                        notification={{
                          id: notification.id,
                          title: notification.title,
                          message: notification.message,
                          type: notification.type,
                          priority: notification.priority,
                          isRead: notification.isRead,
                          createdAt: new Date(notification.createdAt),
                          expiresAt: notification.expiresAt 
                            ? new Date(notification.expiresAt) 
                            : undefined,
                        }}
                        onMarkAsRead={(id) => markAsRead(id)}
                        onArchive={(id) => archiveNotification(id)}
                        onDelete={(id) => deleteNotification(id)}
                      />
                    ))}
                </div>

                {!compact && hasMore && (
                  <div className="flex justify-center mt-4">
                    <Button
                      variant="outline"
                      onClick={loadMore}
                      disabled={loading}
                      className="w-full"
                    >
                      {loading ? <Spinner size="sm" className="mr-2" /> : null}
                      Carregar mais
                    </Button>
                  </div>
                )}

                {compact && notifications.length > maxItems && (
                  <div className="text-center">
                    <Button
                      variant="link"
                      className="text-xs text-muted-foreground"
                      // Aqui poderia abrir um modal ou redirecionar para página de notificações
                      onClick={() => {}}
                    >
                      Ver todas ({notifications.length})
                    </Button>
                  </div>
                )}
              </>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
} 
