"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSession } from 'next-auth/react';
import useNotificationStore, { Notification } from './use-notification-store';

const useSocketNotifications = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const { data: session, status } = useSession();
  const addNotification = useNotificationStore((state) => state.addNotification);
  const updateUnreadCount = useNotificationStore((state) => state.updateUnreadCount);
  
  // Referências para evitar tentativas repetidas
  const connectionAttemptedRef = useRef(false);
  const authFailedRef = useRef(false);
  const socketInstanceRef = useRef<Socket | null>(null);
  const hasCalledEffectOnceRef = useRef(false);

  // Inicializar conexão com o socket apenas se autenticado
  useEffect(() => {
    // Evitar que o efeito execute mais de uma vez durante a renderização inicial
    if (hasCalledEffectOnceRef.current) return;
    hasCalledEffectOnceRef.current = true;
    
    // Se a sessão ainda está carregando, aguarde
    if (status === 'loading') return;
    
    // Se não há usuário autenticado, não faz nada
    if (!session?.user?.id) {
      console.log('Sem sessão de usuário ativa, socket não será iniciado');
      return;
    }
    
    // Se já tentou conectar sem sucesso, não tenta novamente
    if (connectionAttemptedRef.current || authFailedRef.current) {
      console.log('Conexão já tentada anteriormente e falhou, não tentando novamente');
      return;
    }
    
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
        reconnectionAttempts: 2, // Reduzir para 2 tentativas
        reconnectionDelay: 3000,
        timeout: 5000, // Adicionar timeout para falhar mais rápido
        auth: { userId: session.user.id } // Adicionar autenticação no handshake
      });
      
      // Armazenar na referência
      socketInstanceRef.current = socketInstance;
  
      // Tratando conexão do socket
      socketInstance.on('connect', () => {
        console.log('Socket conectado');
        setIsConnected(true);
        setConnectionError(null);
        
        // Autenticar com o servidor
        socketInstance.emit('authenticate', session.user.id);
      });
  
      // Tratando desconexão
      socketInstance.on('disconnect', () => {
        console.log('Socket desconectado');
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
          // Usar setTimeout para evitar problemas com ciclo de renderização
          setTimeout(() => {
            addNotification(notification);
          }, 0);
        }
      });
  
      // Tratando atualizações do contador de não lidas
      socketInstance.on('unreadCount', (count: number) => {
        console.log('Contador atualizado:', count);
        // Verificar se o contador é um número válido
        if (typeof count === 'number' && !isNaN(count) && count >= 0) {
          // Usar setTimeout para evitar problemas com ciclo de renderização
          setTimeout(() => {
            updateUnreadCount(count);
          }, 0);
        }
      });
  
      // Armazena a instância do socket
      setSocket(socketInstance);
      
      return socketInstance;
    };
    
    // Iniciar com um pequeno delay para evitar problemas de renderização
    const timeoutId = setTimeout(() => {
      const instance = setupSocket();
      
      // Retornar função de limpeza
      return () => {
        clearTimeout(timeoutId);
        if (instance) {
          console.log('Desconectando socket...');
          instance.disconnect();
          instance.removeAllListeners();
        }
      };
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
  }, [session?.user?.id, status, addNotification, updateUnreadCount]);

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
    socket: socketInstanceRef.current,
    isConnected,
    connectionError,
    sendMessage,
    reconnect
  };
};

export default useSocketNotifications; 