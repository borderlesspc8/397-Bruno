import { useState, useCallback } from 'react';

interface Notification {
  id: string;
  title: string;
  message: string;
  createdAt: Date;
  read: boolean;
  type: 'info' | 'success' | 'warning' | 'error';
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'Nova transação importada',
      message: 'Suas transações do Nubank foram importadas com sucesso.',
      createdAt: new Date(),
      read: false,
      type: 'success'
    },
    {
      id: '2',
      title: 'Limite de orçamento',
      message: 'Você atingiu 80% do limite de gastos em "Alimentação".',
      createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutos atrás
      read: false,
      type: 'warning'
    },
    {
      id: '3',
      title: 'Fatura do cartão',
      message: 'Sua fatura do cartão vence em 3 dias.',
      createdAt: new Date(Date.now() - 1000 * 60 * 60), // 1 hora atrás
      read: false,
      type: 'info'
    }
  ]);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true }
          : notification
      )
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev =>
      prev.filter(notification => notification.id !== id)
    );
  }, []);

  return {
    notifications,
    markAsRead,
    markAllAsRead,
    removeNotification
  };
}

export type { Notification }; 