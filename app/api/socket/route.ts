import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { db } from '@/app/_lib/db';
import SocketService from '@/app/_services/socket-service';
import { authOptions } from '@/app/_lib/auth-options';

// Configuração para forçar o comportamento dinâmico
export const dynamic = "force-dynamic";

// Cabeçalhos CORS para permitir conexões de qualquer origem
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true',
};

// Handler para requisições OPTIONS (preflight CORS)
export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, { headers: corsHeaders });
}

/**
 * Endpoint para obter informações sobre o status dos sockets
 * Este endpoint é usado apenas para verificação, o socket real é configurado via server.js
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
          { status: 401, headers: corsHeaders }
        );
      }
    }

    // Obter status do serviço de socket
    const status = SocketService.getSocketStatus();

    return NextResponse.json({
      socketInitialized: status.initialized,
      connectedUsers: status.connectedUsers,
      status: 'online',
      authenticated: true,
      serverTime: new Date().toISOString(),
      mode: 'Usando servidor customizado'
    }, { headers: corsHeaders });
  } catch (error) {
    console.error('Erro no endpoint de socket:', error);
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date().toISOString()
      },
      { status: 500, headers: corsHeaders }
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
          { status: 401, headers: corsHeaders }
        );
      }
    }

    // Verificar parâmetros
    const body = await request.json().catch(() => ({}));
    const { userId, notification } = body;

    if (!userId || !notification) {
      return NextResponse.json(
        { error: 'Parâmetros inválidos', expected: { userId: 'string', notification: 'object' }, received: body },
        { status: 400, headers: corsHeaders }
      );
    }

    // Verificar se o usuário existe
    const user = await db.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado', userId },
        { status: 404, headers: corsHeaders }
      );
    }

    // Enviar notificação pelo socket
    const result = SocketService.sendNotificationToUser(userId, notification);

    return NextResponse.json({
      success: result,
      message: result ? 'Notificação enviada com sucesso' : 'Falha ao enviar notificação',
      isUserConnected: SocketService.isUserConnected(userId),
    }, { headers: corsHeaders });
  } catch (error) {
    console.error('Erro ao enviar notificação:', error);
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date().toISOString()
      },
      { status: 500, headers: corsHeaders }
    );
  }
} 
