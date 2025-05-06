import { NextRequest, NextResponse } from 'next/server';
import { createServer } from 'http';
import { Server as ServerIO } from 'socket.io';
import { getServerSession } from 'next-auth';
import { db } from '@/app/_lib/db';
import SocketService from '@/app/_services/socket-service';
import { authOptions } from '@/app/_lib/auth-options';

// Configuração para forçar o comportamento dinâmico
export const dynamic = "force-dynamic";


// Variável global para armazenar a instância do servidor socket.io
let io: ServerIO;

/**
 * Endpoint para obter informações sobre o status dos sockets
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar se o usuário está autenticado via sessão
    const session = await getServerSession(authOptions);
    
    // Se não houver sessão, verificar cabeçalho de autorização como fallback
    if (!session?.user) {
      const authHeader = request.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json(
          { 
            error: 'Não autorizado',
            message: 'É necessário estar autenticado para acessar este recurso',
            redirectTo: '/api/auth/signin'
          },
          { status: 401 }
        );
      }
    }

    // Obter status do serviço de socket
    const status = SocketService.getSocketStatus();

    return NextResponse.json({
      socketInitialized: status.initialized,
      connectedUsers: status.connectedUsers,
      status: 'online',
      authenticated: true
    });
  } catch (error) {
    console.error('Erro no endpoint de socket:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * Endpoint para enviar uma notificação via socket
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar se o usuário está autenticado via sessão
    const session = await getServerSession(authOptions);
    
    // Se não houver sessão, verificar cabeçalho de autorização como fallback
    if (!session?.user) {
      const authHeader = request.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json(
          { error: 'Não autorizado', message: 'É necessário estar autenticado para usar esta funcionalidade' },
          { status: 401 }
        );
      }
    }

    // Verificar parâmetros
    const body = await request.json();
    const { userId, notification } = body;

    if (!userId || !notification) {
      return NextResponse.json(
        { error: 'Parâmetros inválidos' },
        { status: 400 }
      );
    }

    // Verificar se o usuário existe
    const user = await db.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Enviar notificação pelo socket
    const result = SocketService.sendNotificationToUser(userId, notification);

    return NextResponse.json({
      success: result,
      message: result ? 'Notificação enviada com sucesso' : 'Falha ao enviar notificação',
      isUserConnected: SocketService.isUserConnected(userId),
    });
  } catch (error) {
    console.error('Erro ao enviar notificação:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 
