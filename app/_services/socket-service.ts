import { Server as NetServer } from 'http';
import { NextApiRequest } from 'next';
import { Server as ServerIO } from 'socket.io';
import { NextApiResponse } from 'next';
import { Notification } from '@/app/_hooks/use-notification-store';

export interface ServerProps {
  req: NextApiRequest;
  res: NextApiResponse;
}

export interface SocketUser {
  userId: string;
  socketId: string;
}

// Armazenar os usuários conectados
let connectedUsers: SocketUser[] = [];

// Armazenar a instância do servidor Socket.IO
let io: ServerIO | null = null;

/**
 * Inicializar o servidor de WebSocket
 */
export function initSocketServer(server: NetServer): ServerIO {
  if (io) {
    console.log('Socket já está inicializado');
    return io;
  }

  // Determinar origens permitidas para CORS
  const getAllowedOrigins = () => {
    const origins: string[] = [];
    
    // Adicionar origens das variáveis de ambiente
    if (process.env.NEXTAUTH_URL) {
      origins.push(process.env.NEXTAUTH_URL);
    }
    
    if (process.env.NEXT_PUBLIC_APP_URL) {
      origins.push(process.env.NEXT_PUBLIC_APP_URL);
    }
    
    // Adicionar domínio principal e variações de protocolo
    origins.push('https://dashboard.lojapersonalprime.com');
    origins.push('https://www.dashboard.lojapersonalprime.com');
    origins.push('http://dashboard.lojapersonalprime.com');
    
    // Em desenvolvimento, permitir localhost
    if (process.env.NODE_ENV === 'development') {
      // Usar origem relativa em vez de absoluta
      origins.push('');
    }
    
    // Remover duplicatas
    const uniqueOrigins = Array.from(new Set(origins));
    console.log('Origens permitidas para CORS:', uniqueOrigins);
    
    // Em produção, permitir todas as origens para resolver problemas de CORS
    if (process.env.NODE_ENV === 'production') {
      console.log('Ambiente de produção: permitindo todas as origens para o socket');
      return '*';
    }
    
    // Se não houver nenhuma origem configurada, permitir todas
    return uniqueOrigins.length > 0 ? uniqueOrigins : '*';
  };
  
  console.log('Inicializando servidor Socket.IO...');
  
  io = new ServerIO(server, {
    path: '/api/socket',
    addTrailingSlash: false,
    pingTimeout: 60000, // 60 segundos
    pingInterval: 25000, // 25 segundos
    cors: {
      origin: getAllowedOrigins(),
      methods: ['GET', 'POST'],
      credentials: true
    },
    transports: ['polling', 'websocket'], // Prioriza polling que é mais compatível
    serveClient: false, // Não servir o cliente via servidor
    connectTimeout: 45000, // 45 segundos de timeout para conectar
    allowEIO3: true // Permitir versão antiga do protocolo Engine.IO para compatibilidade
  });

  // Tratar conexões de socket
  io.on('connection', (socket) => {
    console.log(`Socket conectado: ${socket.id}`);

    // Autenticar usuário quando se conectar
    socket.on('authenticate', (userId: string) => {
      if (!userId) {
        console.log('Tentativa de autenticação sem ID de usuário');
        return;
      }

      console.log(`Usuário autenticado: ${userId}`);
      
      // Remover conexões antigas do mesmo usuário
      connectedUsers = connectedUsers.filter((user) => user.userId !== userId);
      
      // Adicionar à lista de usuários conectados
      connectedUsers.push({ userId, socketId: socket.id });
      
      // Associar o socket ao "quarto" do usuário para enviar notificações específicas
      socket.join(`user:${userId}`);
    });

    // Limpar quando o cliente desconectar
    socket.on('disconnect', () => {
      console.log(`Socket desconectado: ${socket.id}`);
      connectedUsers = connectedUsers.filter((user) => user.socketId !== socket.id);
    });
  });

  return io;
}

/**
 * Enviar uma notificação para um usuário específico
 */
export function sendNotificationToUser(userId: string, notification: Notification) {
  if (!io) {
    console.error('Socket não inicializado');
    return false;
  }

  try {
    // Emitir evento para o quarto do usuário
    io.to(`user:${userId}`).emit('notification', notification);
    console.log(`Notificação enviada para o usuário ${userId}`);
    return true;
  } catch (error) {
    console.error('Erro ao enviar notificação:', error);
    return false;
  }
}

/**
 * Enviar uma atualização de contador de notificações para um usuário
 */
export function updateUnreadCount(userId: string, count: number) {
  if (!io) {
    console.error('Socket não inicializado');
    return false;
  }

  try {
    io.to(`user:${userId}`).emit('unreadCount', count);
    return true;
  } catch (error) {
    console.error('Erro ao atualizar contador:', error);
    return false;
  }
}

/**
 * Verificar se um usuário está conectado
 */
export function isUserConnected(userId: string): boolean {
  return connectedUsers.some((user) => user.userId === userId);
}

/**
 * Obter o status do servidor WebSocket
 */
export function getSocketStatus() {
  return {
    initialized: io !== null,
    connectedUsers: connectedUsers.length,
    users: connectedUsers.map((user) => user.userId),
  };
}

export default {
  initSocketServer,
  sendNotificationToUser,
  updateUnreadCount,
  isUserConnected,
  getSocketStatus,
}; 