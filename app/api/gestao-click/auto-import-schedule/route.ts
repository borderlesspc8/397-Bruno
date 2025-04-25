/**
 * API para gerenciar o agendamento de importação automática do Gestão Click
 * Permite configurar a importação automática de transações e carteiras
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/app/_lib/auth";
import { ImportSchedulerService } from "@/app/_services/import-scheduler-service";
import { prisma } from "@/app/_lib/prisma";
import { z } from "zod";

// Força comportamento dinâmico para este endpoint
export const dynamic = "force-dynamic";

// Schema de validação para o body da requisição
const CreateScheduleSchema = z.object({
  frequency: z.enum(["daily", "weekly", "monthly"]),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato de hora inválido (HH:MM)"),
  dayOfWeek: z.number().int().min(0).max(6).optional(),
  dayOfMonth: z.number().int().min(1).max(31).optional(),
  credentials: z.object({
    apiKey: z.string().optional(),
    secretToken: z.string().optional(),
    apiUrl: z.string().optional()
  }).optional()
});

/**
 * POST /api/gestao-click/auto-import-schedule
 * Cria um novo agendamento de importação automática do Gestão Click
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    // Obter dados da requisição
    const body = await request.json();
    
    // Validar dados da requisição
    const validationResult = CreateScheduleSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: "Dados inválidos", 
          details: validationResult.error.format()
        },
        { status: 400 }
      );
    }
    
    const { frequency, time, dayOfWeek, dayOfMonth, credentials } = validationResult.data;
    
    // Verificar se existem credenciais válidas do Gestão Click
    if (!credentials?.apiKey) {
      // Verificar configurações de integração
      const integrationSettings = await prisma.integrationSettings.findFirst({
        where: {
          userId: session.user.id,
          provider: 'gestao-click',
          walletId: 'global',
          active: true,
        },
      });
      
      if (!integrationSettings?.metadata) {
        return NextResponse.json(
          { 
            error: "Configuração incompleta",
            message: "Você precisa configurar a integração com o Gestão Click antes de criar um agendamento"
          },
          { status: 400 }
        );
      }
      
      const metadata = integrationSettings.metadata as Record<string, any>;
      if (!metadata.apiKey) {
        return NextResponse.json(
          { 
            error: "Configuração incompleta",
            message: "API Key do Gestão Click não configurada"
          },
          { status: 400 }
        );
      }
    }
    
    // Inicializar o serviço de agendamento
    const schedulerService = new ImportSchedulerService();
    
    // Criar o agendamento
    const schedule = await schedulerService.createGestaoClickSchedule(
      session.user.id,
      {
        frequency,
        time,
        dayOfWeek,
        dayOfMonth,
        credentials
      }
    );
    
    return NextResponse.json({
      success: true,
      message: "Agendamento de importação automática criado com sucesso",
      schedule: {
        id: schedule.id,
        scheduledAt: schedule.scheduledAt,
        status: schedule.status
      }
    });
    
  } catch (error: any) {
    console.error("[API] Erro ao criar agendamento de importação:", error);
    
    return NextResponse.json(
      { 
        error: "Falha ao criar agendamento", 
        message: error.message
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/gestao-click/auto-import-schedule
 * Lista os agendamentos de importação do usuário
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }
    
    // Inicializar o serviço de agendamento
    const schedulerService = new ImportSchedulerService();
    
    // Obter agendamentos do usuário
    const schedules = await schedulerService.getSchedules(session.user.id);
    
    // Filtrar apenas agendamentos do Gestão Click
    const gestaoClickSchedules = schedules.filter(schedule => schedule.source === "GESTAO_CLICK");
    
    return NextResponse.json({
      success: true,
      schedules: gestaoClickSchedules.map(schedule => ({
        id: schedule.id,
        status: schedule.status,
        scheduledAt: schedule.scheduledAt,
        executedAt: schedule.executedAt,
        details: schedule.details
      }))
    });
    
  } catch (error: any) {
    console.error("[API] Erro ao listar agendamentos de importação:", error);
    
    return NextResponse.json(
      { 
        error: "Falha ao listar agendamentos", 
        message: error.message
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/gestao-click/auto-import-schedule/:id
 * Cancela um agendamento de importação específico
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Verificar autenticação
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }
    
    const { id } = params;
    
    // Se não tiver ID, extrair da URL
    const scheduleId = id || request.nextUrl.pathname.split('/').pop();
    
    if (!scheduleId) {
      return NextResponse.json(
        { 
          error: "ID não fornecido",
          message: "O ID do agendamento é obrigatório"
        },
        { status: 400 }
      );
    }
    
    // Inicializar o serviço de agendamento
    const schedulerService = new ImportSchedulerService();
    
    // Verificar se o agendamento existe e pertence ao usuário
    const schedule = await schedulerService.getSchedule(scheduleId, session.user.id);
    
    if (!schedule) {
      return NextResponse.json(
        { 
          error: "Agendamento não encontrado",
          message: "O agendamento solicitado não existe ou não pertence a este usuário"
        },
        { status: 404 }
      );
    }
    
    // Atualizar o status do agendamento para CANCELLED
    await schedulerService.updateSchedule(scheduleId, {
      status: "CANCELLED"
    });
    
    return NextResponse.json({
      success: true,
      message: "Agendamento de importação cancelado com sucesso"
    });
    
  } catch (error: any) {
    console.error("[API] Erro ao cancelar agendamento de importação:", error);
    
    return NextResponse.json(
      { 
        error: "Falha ao cancelar agendamento", 
        message: error.message
      },
      { status: 500 }
    );
  }
} 