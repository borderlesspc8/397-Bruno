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

  // Inicializar conexão com o socket
  useEffect(() => {
    // Evitar que o efeito execute mais de uma vez durante a renderização inicial
    if (hasCalledEffectOnceRef.current) return;
    hasCalledEffectOnceRef.current = true;
    
    // Se a sessão ainda está carregando, aguarde
    if (status === 'loading') return;
    
    // Se já tentou conectar sem sucesso, não tenta novamente
    if (connectionAttemptedRef.current || authFailedRef.current) {
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
      
      // Função para obter a URL segura
      const getSocketUrl = () => {
        // Em ambiente de produção, usar sempre a origem atual da janela
        if (typeof window !== 'undefined') {
          return window.location.origin;
        }
        
        // Em ambiente de desenvolvimento - usar URL relativa
        if (process.env.NODE_ENV === 'development') {
          return '';
        }
        
        // Fallback para produção
        return 'https://dashboard.lojapersonalprime.com';
      };
      
      const socketUrl = getSocketUrl();
      console.log(`URL final do socket: ${socketUrl}`);
      
      // Criar objeto de autenticação com fallback para usuários não autenticados
      const authObject = session?.user?.id 
        ? { userId: session.user.id }
        : { userId: `anonymous-${Math.random().toString(36).substring(2, 9)}` };
      
      const socketInstance = io(socketUrl, {
        path: '/api/socket',
        addTrailingSlash: false,
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
        timeout: 10000,
        transports: ['polling', 'websocket'],
        auth: authObject
      });
      
      // Armazenar na referência
      socketInstanceRef.current = socketInstance;
  
      // Configurar eventos para a instância
      setupSocketEvents(socketInstance);
  
      // Armazena a instância do socket
      setSocket(socketInstance);
      
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

  // Função para configurar eventos do socket
  const setupSocketEvents = (socketInstance: Socket) => {
    // Tratando conexão do socket
    socketInstance.on('connect', () => {
      console.log('Socket conectado');
      setIsConnected(true);
      setConnectionError(null);
      
      // Autenticar com o servidor se houver ID de usuário
      if (session?.user?.id) {
        socketInstance.emit('authenticate', session.user.id);
      } else {
        // Enviar ID anônimo para autenticação
        const anonymousId = `anonymous-${Math.random().toString(36).substring(2, 9)}`;
        socketInstance.emit('authenticate', anonymousId);
      }
    });

    // Tratando desconexão
    socketInstance.on('disconnect', (reason) => {
      console.log('Socket desconectado:', reason);
      setIsConnected(false);
    });

    // Tratando notificações recebidas
    socketInstance.on('notification', (notification: Notification) => {
      if (notification && notification.id) {
        setTimeout(() => {
          addNotification(notification);
        }, 0);
      }
    });

    // Tratando atualizações do contador de não lidas
    socketInstance.on('unreadCount', (count: number) => {
      if (typeof count === 'number' && !isNaN(count) && count >= 0) {
        setTimeout(() => {
          updateUnreadCount(count);
        }, 0);
      }
    });

    // Tratando erros de conexão
    socketInstance.on('connect_error', (err) => {
      console.error('Erro de conexão do socket:', err);
      setConnectionError(`Erro de conexão do socket: ${err.message}`);
      setIsConnected(false);
      
      // Se o erro for relacionado a misturas de HTTP/HTTPS ou CORS
      if (err.message.includes('Failed to construct') || 
          err.message.includes('xhr poll error') || 
          err.message.includes('CORS') ||
          err.message.includes('blocked')) {
        
        console.warn('Erro de conexão pode ser devido a misturas de HTTP/HTTPS ou CORS');
        
        // Tentar reconectar usando apenas polling
        socketInstance.disconnect();
        
        // Criar nova instância com apenas polling
        const newSocketInstance = io(window.location.origin, {
          path: '/api/socket',
          addTrailingSlash: false,
          autoConnect: true,
          reconnection: true,
          reconnectionAttempts: 2,
          reconnectionDelay: 3000,
          timeout: 5000,
          transports: ['polling'], // Usar apenas polling como último recurso
          auth: session?.user?.id ? { userId: session.user.id } : { userId: `anonymous-${Math.random().toString(36).substring(2, 9)}` }
        });
        
        // Substituir a instância atual
        socketInstanceRef.current = newSocketInstance;
        setSocket(newSocketInstance);
        
        // Configurar eventos para a nova instância
        setupSocketEvents(newSocketInstance);
        
        // Conectar a nova instância
        newSocketInstance.connect();
      }
    });

    // Adicionar evento de erro geral
    socketInstance.on('error', (err) => {
      console.error('Erro geral do socket:', err);
      setConnectionError(`Erro geral do socket: ${err.message || 'Erro desconhecido'}`);
    });

    // Adicionar evento de reconexão
    socketInstance.io.on('reconnect', (attempt) => {
      console.log(`Socket reconectado na tentativa ${attempt}`);
      setIsConnected(true);
      setConnectionError(null);
    });

    // Adicionar evento de tentativa de reconexão
    socketInstance.io.on('reconnect_attempt', (attempt) => {
      console.log(`Tentativa de reconexão ${attempt}`);
    });

    // Adicionar evento de erro de reconexão
    socketInstance.io.on('reconnect_error', (err) => {
      console.error('Erro de reconexão:', err);
      setConnectionError(`Erro de reconexão: ${err.message}`);
    });
  };

  return {
    isConnected,
    connectionError,
    sendMessage,
    reconnect
  };
};

export default useSocketNotifications; 