import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/_lib/auth-options';

const prisma = new PrismaClient();

// Constante para o código de confirmação
const CONFIRMATION_CODE = 'DELETAR_TODAS_TRANSACOES';

/**
 * Função de verificação de administrador
 */
async function isAdmin(userId: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });
    
    return user?.role === 'ADMIN';
  } catch (error) {
    console.error('Erro ao verificar permissões de administrador:', error);
    return false;
  }
}

/**
 * Função para criar um log da operação
 */
async function logOperation(userId: string, operation: string, details: any): Promise<void> {
  try {
    // Adicionar notificação para o admin sobre a operação
    await prisma.notification.create({
      data: {
        userId,
        title: 'Operação de Limpeza de Dados',
        message: `${operation}: ${details.count} transações foram excluídas.`,
        type: 'SYSTEM',
        priority: 'HIGH',
        metadata: { operationDetails: details }
      }
    });
    
    console.log(`Operação registrada: ${operation}`, details);
  } catch (error) {
    console.error('Erro ao registrar operação:', error);
  }
}

/**
 * Endpoint para listar transações (GET)
 * Usado para analisar antes de excluir
 */
export async function GET(request: Request) {
  try {
    // Verificar autenticação e permissões
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }
    
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true }
    });
    
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }
    
    if (!(await isAdmin(user.id))) {
      return NextResponse.json({ error: 'Permissão negada' }, { status: 403 });
    }
    
    // Obter parâmetros da URL
    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '100');
    
    // Construir condição de filtro
    const whereCondition = targetUserId ? { userId: targetUserId } : {};
    
    // Contar total de transações
    const total = await prisma.transaction.count({
      where: whereCondition
    });
    
    // Buscar amostra de transações
    const transactions = await prisma.transaction.findMany({
      where: whereCondition,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        amount: true,
        type: true,
        date: true,
        userId: true,
        walletId: true,
        category: true,
        externalId: true,
        createdAt: true
      }
    });
    
    // Agrupar estatísticas por usuário
    const userStats = await prisma.transaction.groupBy({
      by: ['userId'],
      _count: { id: true },
      where: whereCondition
    });
    
    // Buscar nomes de usuários para as estatísticas
    const userInfo = await prisma.user.findMany({
      where: {
        id: { in: userStats.map(stat => stat.userId) }
      },
      select: {
        id: true,
        email: true,
        name: true
      }
    });
    
    // Combinar estatísticas com informações de usuário
    const userTransactionStats = userStats.map(stat => {
      const user = userInfo.find(u => u.id === stat.userId);
      return {
        userId: stat.userId,
        email: user?.email || 'N/A',
        name: user?.name || 'Usuário desconhecido',
        transactionCount: stat._count.id
      };
    });
    
    return NextResponse.json({
      total,
      sample: transactions,
      userStats: userTransactionStats,
      message: 'Análise de transações para limpeza'
    });
    
  } catch (error) {
    console.error('Erro ao analisar transações:', error);
    return NextResponse.json(
      { error: 'Erro ao processar solicitação' },
      { status: 500 }
    );
  }
}

/**
 * Endpoint para excluir transações (POST)
 */
export async function POST(request: Request) {
  try {
    // Verificar autenticação e permissões
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }
    
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true }
    });
    
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }
    
    if (!(await isAdmin(user.id))) {
      return NextResponse.json({ error: 'Permissão negada' }, { status: 403 });
    }
    
    // Obter parâmetros do corpo da requisição
    const body = await request.json();
    const { userId, confirmationCode, dryRun = true } = body;
    
    // Verificar código de confirmação quando não estiver em modo simulação
    if (!dryRun && confirmationCode !== CONFIRMATION_CODE) {
      return NextResponse.json(
        { 
          error: 'Código de confirmação inválido',
          requiredCode: CONFIRMATION_CODE 
        }, 
        { status: 400 }
      );
    }
    
    // Construir condição de filtro
    const whereCondition = userId ? { userId } : {};
    
    // Contar transações antes da exclusão
    const count = await prisma.transaction.count({
      where: whereCondition
    });
    
    if (count === 0) {
      return NextResponse.json(
        { message: 'Nenhuma transação encontrada com os critérios especificados' },
        { status: 200 }
      );
    }
    
    let result: any = { count };
    
    // Executar exclusão apenas se não for dry run
    if (!dryRun) {
      const deleteResult = await prisma.transaction.deleteMany({
        where: whereCondition
      });
      
      result = deleteResult;
      
      // Registrar operação
      await logOperation(user.id, 'Exclusão de transações', { 
        count: deleteResult.count,
        targetUserId: userId || 'todos',
        executedBy: user.id
      });
    }
    
    return NextResponse.json({
      success: true,
      dryRun,
      deleted: !dryRun ? result.count : 0,
      wouldDelete: dryRun ? count : 0,
      targetUserId: userId || 'todos',
      message: dryRun 
        ? `Simulação: ${count} transações seriam excluídas` 
        : `${result.count} transações foram excluídas com sucesso`
    });
    
  } catch (error) {
    console.error('Erro ao excluir transações:', error);
    return NextResponse.json(
      { error: 'Erro ao processar solicitação' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 