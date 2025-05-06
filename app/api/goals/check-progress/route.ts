import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/_lib/db";
import { NotificationService } from "@/app/_services/notification-service";
import { GoalStatus } from "@prisma/client";

// Configuração para forçar o comportamento dinâmico
export const dynamic = "force-dynamic";


// Chave secreta para autorizar o acesso ao endpoint (deve ser configurada no .env)
const CRON_SECRET = process.env.CRON_SECRET || "";

// GET /api/goals/check-progress - Verifica progresso das metas e envia notificações
export async function GET(request: NextRequest) {
  try {
    // Verificar autorização com chave secreta
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get("secret");

    if (!CRON_SECRET || !secret || secret !== CRON_SECRET) {
      console.error("Tentativa de acesso não autorizado ao endpoint de verificação de metas");
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    // Buscar todas as metas em progresso
    const goals = await db.financialGoal.findMany({
      where: {
        status: GoalStatus.IN_PROGRESS,
      },
      include: {
        contributions: true,
      },
    });

    console.log(`[CRON] Verificando ${goals.length} metas financeiras em progresso`);

    // Contadores para estatísticas
    let nearTargetCount = 0;
    let achievedCount = 0;
    let overdueCount = 0;

    // Analisar cada meta
    for (const goal of goals) {
      // Calcular porcentagem de conclusão
      const percentComplete = (goal.currentAmount / goal.targetAmount) * 100;
      
      // Verificar se meta foi atingida (100% ou mais)
      if (percentComplete >= 100 && goal.status !== GoalStatus.COMPLETED) {
        await handleGoalCompleted(goal);
        achievedCount++;
        continue;
      }
      
      // Verificar se meta está próxima de ser atingida (80% ou mais)
      if (percentComplete >= 80 && percentComplete < 100) {
        await handleGoalNearTarget(goal, percentComplete);
        nearTargetCount++;
        continue;
      }
      
      // Verificar se meta está vencida
      const today = new Date();
      if (goal.targetDate < today && goal.status !== GoalStatus.OVERDUE) {
        await handleGoalOverdue(goal, percentComplete);
        overdueCount++;
        continue;
      }
      
      // Verificar se meta está próxima de vencer (menos de 30 dias)
      const daysToDeadline = Math.ceil((goal.targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (daysToDeadline <= 30 && daysToDeadline > 0 && percentComplete < 80) {
        await handleGoalNearDeadline(goal, percentComplete, daysToDeadline);
      }
    }

    // Retornar estatísticas
    return NextResponse.json({
      message: "Verificação de metas concluída com sucesso",
      timestamp: new Date().toISOString(),
      stats: {
        total: goals.length,
        nearTargetCount,
        achievedCount,
        overdueCount,
      },
    });
  } catch (error) {
    console.error("Erro na verificação de metas:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

/**
 * Trata metas que foram atingidas (100% ou mais)
 */
async function handleGoalCompleted(goal: any) {
  try {
    // Atualizar status da meta para COMPLETED
    await db.financialGoal.update({
      where: { id: goal.id },
      data: { status: GoalStatus.COMPLETED },
    });
    
    // Enviar notificação de meta atingida
    await NotificationService.createNotification({
      userId: goal.userId,
      title: "🎉 Meta financeira alcançada!",
      message: `Parabéns! Você atingiu sua meta "${goal.title}" de ${formatCurrency(goal.targetAmount)}.`,
      type: "GOAL",
      priority: "HIGH",
      link: `/goals/${goal.id}`,
      metadata: {
        goalId: goal.id,
        goalTitle: goal.title,
        targetAmount: goal.targetAmount,
        currentAmount: goal.currentAmount,
      },
    });
    
    return true;
  } catch (error) {
    console.error(`Erro ao processar meta concluída ${goal.id}:`, error);
    return false;
  }
}

/**
 * Trata metas que estão próximas de serem atingidas (80% ou mais)
 */
async function handleGoalNearTarget(goal: any, percentComplete: number) {
  try {
    // Enviar notificação de meta próxima de ser atingida
    await NotificationService.createNotification({
      userId: goal.userId,
      title: "🔔 Meta quase alcançada!",
      message: `Você já completou ${percentComplete.toFixed(1)}% da sua meta "${goal.title}". Faltam apenas ${formatCurrency(goal.targetAmount - goal.currentAmount)}!`,
      type: "GOAL",
      priority: "MEDIUM",
      link: `/goals/${goal.id}`,
      metadata: {
        goalId: goal.id,
        goalTitle: goal.title,
        targetAmount: goal.targetAmount,
        currentAmount: goal.currentAmount,
        percentComplete,
      },
    });
    
    return true;
  } catch (error) {
    console.error(`Erro ao processar meta próxima de conclusão ${goal.id}:`, error);
    return false;
  }
}

/**
 * Trata metas que venceram sem serem atingidas
 */
async function handleGoalOverdue(goal: any, percentComplete: number) {
  try {
    // Atualizar status da meta para OVERDUE
    await db.financialGoal.update({
      where: { id: goal.id },
      data: { status: GoalStatus.OVERDUE },
    });
    
    // Enviar notificação de meta vencida
    await NotificationService.createNotification({
      userId: goal.userId,
      title: "⚠️ Meta financeira vencida",
      message: `Sua meta "${goal.title}" venceu e foi alcançada apenas ${percentComplete.toFixed(1)}%. Deseja redefinir a data ou ajustar o valor?`,
      type: "GOAL",
      priority: "HIGH",
      link: `/goals/${goal.id}`,
      metadata: {
        goalId: goal.id,
        goalTitle: goal.title,
        targetAmount: goal.targetAmount,
        currentAmount: goal.currentAmount,
        percentComplete,
      },
    });
    
    return true;
  } catch (error) {
    console.error(`Erro ao processar meta vencida ${goal.id}:`, error);
    return false;
  }
}

/**
 * Trata metas que estão próximas de vencer
 */
async function handleGoalNearDeadline(goal: any, percentComplete: number, daysToDeadline: number) {
  try {
    // Enviar notificação de meta próxima de vencer
    await NotificationService.createNotification({
      userId: goal.userId,
      title: "⏰ Meta financeira próxima de vencer",
      message: `Sua meta "${goal.title}" vence em ${daysToDeadline} dias e você completou apenas ${percentComplete.toFixed(1)}%. Faltam ${formatCurrency(goal.targetAmount - goal.currentAmount)}.`,
      type: "GOAL",
      priority: "MEDIUM",
      link: `/goals/${goal.id}`,
      metadata: {
        goalId: goal.id,
        goalTitle: goal.title,
        targetAmount: goal.targetAmount,
        currentAmount: goal.currentAmount,
        percentComplete,
        daysToDeadline,
      },
    });
    
    return true;
  } catch (error) {
    console.error(`Erro ao processar meta próxima de vencer ${goal.id}:`, error);
    return false;
  }
}

/**
 * Formata um valor como moeda (R$)
 */
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
} 
