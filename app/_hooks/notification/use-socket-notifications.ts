"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../useAuth';
import useNotificationStore from './use-notification-store';
import { Notification } from '@/app/_types/notification';

interface UseSocketNotificationsReturn {
  isConnected: boolean;
  connectionError: string | null;
  sendMessage: (event: string, data: any) => boolean;
  reconnect: () => boolean;
}

/**
 * Hook para lidar com notificações em tempo real via Socket.IO
 */
export function useSocketNotifications(): UseSocketNotificationsReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const { user, loading } = useAuth();
  const store = useNotificationStore();
  
  // Referências para evitar tentativas repetidas e manter o estado do socket
  const connectionAttemptedRef = useRef(false);
  const authFailedRef = useRef(false);
  const socketInstanceRef = useRef<Socket | null>(null);
  const hasInitializedRef = useRef(false);

  // Inicializar conexão com o socket apenas se autenticado
  useEffect(() => {
    // Evitar que o efeito execute mais de uma vez durante a renderização inicial
    if (hasInitializedRef.current) return;
    
    // Se a sessão ainda está carregando, aguarde
    if (loading) return;
    
    // Se não há usuário autenticado, não faz nada
    if (!user?.id) {
      console.log('Sem usuário autenticado, socket não será iniciado');
      return;
    }
    
    // Se já tentou conectar sem sucesso com o mesmo usuário, não tenta novamente
    if (connectionAttemptedRef.current || authFailedRef.current) {
      console.log('Conexão já tentada anteriormente e falhou, não tentando novamente');
      return;
    }
    
    hasInitializedRef.current = true;
    
    // Função para criar e configurar socket
    const setupSocket = () => {
      // Marcar que já tentou conectar
      connectionAttemptedRef.current = true;
      
      console.log('Iniciando conexão do socket...');
  
      // Limpar instância anterior se existir
      if (socketInstanceRef.current) {
        socketInstanceRef.current.disconnect();
        socketInstanceRef.current.removeAllListeners();
      }
      
      // Criando a conexão do socket
      const socketInstance = io({
        path: '/api/socket',
        addTrailingSlash: false,
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 3,
        reconnectionDelay: 3000,
        timeout: 5000,
        auth: { userId: user.id }
      });
      
      // Armazenar na referência
      socketInstanceRef.current = socketInstance;
  
      // Tratando conexão do socket
      socketInstance.on('connect', () => {
        console.log('Socket conectado');
        setIsConnected(true);
        setConnectionError(null);
        
        // Autenticar com o servidor
        socketInstance.emit('authenticate', user.id);
      });
  
      // Tratando desconexão
      socketInstance.on('disconnect', (reason) => {
        console.log('Socket desconectado:', reason);
        setIsConnected(false);
      });
  
      // Tratando erros de conexão
      socketInstance.on('connect_error', (err) => {
        console.error('Erro de conexão do socket:', err);
        setConnectionError(`Erro de conexão: ${err.message}`);
        setIsConnected(false);
        
        // Marcar erro de autenticação para evitar tentativas repetidas
        if (err.message.includes('401') || err.message.includes('auth')) {
          console.log('Erro de autenticação, parando tentativas');
          authFailedRef.current = true;
          socketInstance.disconnect();
        }
      });
  
      // Tratando notificações recebidas
      socketInstance.on('notification', (notification: Notification) => {
        console.log('Notificação recebida:', notification);
        // Verificar se a notificação é válida antes de adicionar
        if (notification && notification.id) {
          store.addNotification(notification);
        }
      });
  
      // Tratando atualizações do contador de não lidas
      socketInstance.on('unreadCount', (count: number) => {
        console.log('Contador atualizado:', count);
        // Verificar se o contador é um número válido
        if (typeof count === 'number' && !isNaN(count) && count >= 0) {
          store.updateUnreadCount(count);
        }
      });
      
      return socketInstance;
    };
    
    // Iniciar com um pequeno delay para evitar problemas de renderização
    const timeoutId = setTimeout(() => {
      setupSocket();
    }, 1000);
    
    // Limpar ao desmontar
    return () => {
      clearTimeout(timeoutId);
      if (socketInstanceRef.current) {
        console.log('Desconectando socket ao desmontar...');
        socketInstanceRef.current.disconnect();
        socketInstanceRef.current.removeAllListeners();
      }
    };
  }, [user?.id, loading, store]);

  // Função para enviar uma mensagem pelo socket
  const sendMessage = useCallback((event: string, data: any) => {
    if (socketInstanceRef.current && isConnected) {
      socketInstanceRef.current.emit(event, data);
      return true;
    }
    return false;
  }, [isConnected]);
  
  // Função para reconectar manualmente
  const reconnect = useCallback(() => {
    if (socketInstanceRef.current) {
      // Resetar flags
      connectionAttemptedRef.current = false;
      authFailedRef.current = false;
      
      // Reconectar
      socketInstanceRef.current.connect();
      return true;
    }
    return false;
  }, []);

  return {
    isConnected,
    connectionError,
    sendMessage,
    reconnect
  };
} 