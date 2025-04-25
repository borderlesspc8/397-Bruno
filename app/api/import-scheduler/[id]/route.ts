import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/_lib/auth";
import { ImportSchedulerService } from "@/app/_services/import-scheduler-service";
import { ImportScheduleSchema } from "@/app/types/import-schedule";

/**
 * API para gerenciar agendamentos de importação específicos
 */
const importSchedulerService = new ImportSchedulerService();

/**
 * Obter detalhes de um agendamento específico
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticação
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { message: "Para visualizar detalhes do agendamento, você precisa estar autenticado." },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const id = params.id;

    // Buscar agendamento no banco de dados
    const schedule = await importSchedulerService.getSchedule(id, userId);

    if (!schedule) {
      return NextResponse.json(
        { message: "Agendamento não encontrado." },
        { status: 404 }
      );
    }

    return NextResponse.json(schedule);
  } catch (error: any) {
    console.error("Erro ao obter detalhes do agendamento:", error);
    return NextResponse.json(
      { message: `Erro ao obter detalhes: ${error.message}` },
      { status: 500 }
    );
  }
}

/**
 * Atualizar um agendamento existente
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticação
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { message: "Para atualizar agendamentos, você precisa estar autenticado." },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const id = params.id;
    const data = await request.json();

    // Verificar se o agendamento existe e pertence ao usuário
    const existingSchedule = await importSchedulerService.getSchedule(id, userId);
    if (!existingSchedule) {
      return NextResponse.json(
        { message: "Agendamento não encontrado." },
        { status: 404 }
      );
    }

    // Calcular a próxima execução com base na frequência
    const nextRun = importSchedulerService.calculateNextRun({
      ...existingSchedule,
      ...data,
    });

    // Atualizar agendamento
    const updatedSchedule = await importSchedulerService.updateSchedule(id, {
      ...data,
      nextRun,
    });

    return NextResponse.json(updatedSchedule);
  } catch (error: any) {
    console.error("Erro ao atualizar agendamento:", error);
    
    // Verificar se é um erro de validação do Zod
    if (error.errors) {
      return NextResponse.json(
        { message: "Dados inválidos", errors: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { message: `Erro ao atualizar agendamento: ${error.message}` },
      { status: 500 }
    );
  }
}

/**
 * Atualizar parcialmente um agendamento
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticação
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { message: "Para atualizar agendamentos, você precisa estar autenticado." },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const id = params.id;
    const data = await request.json();

    // Verificar se o agendamento existe e pertence ao usuário
    const existingSchedule = await importSchedulerService.getSchedule(id, userId);
    if (!existingSchedule) {
      return NextResponse.json(
        { message: "Agendamento não encontrado." },
        { status: 404 }
      );
    }

    // Se está alterando a frequência ou horário, recalcular a próxima execução
    if (data.frequency || data.time || data.dayOfWeek || data.dayOfMonth) {
      data.nextRun = importSchedulerService.calculateNextRun({
        ...existingSchedule,
        ...data,
      });
    }

    // Atualizar agendamento
    const updatedSchedule = await importSchedulerService.updateSchedule(id, data);

    return NextResponse.json(updatedSchedule);
  } catch (error: any) {
    console.error("Erro ao atualizar agendamento:", error);
    return NextResponse.json(
      { message: `Erro ao atualizar agendamento: ${error.message}` },
      { status: 500 }
    );
  }
}

/**
 * Excluir um agendamento
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticação
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { message: "Para excluir agendamentos, você precisa estar autenticado." },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const id = params.id;

    // Verificar se o agendamento existe e pertence ao usuário
    const existingSchedule = await importSchedulerService.getSchedule(id, userId);
    if (!existingSchedule) {
      return NextResponse.json(
        { message: "Agendamento não encontrado." },
        { status: 404 }
      );
    }

    // Excluir agendamento
    await importSchedulerService.deleteSchedule(id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Erro ao excluir agendamento:", error);
    return NextResponse.json(
      { message: `Erro ao excluir agendamento: ${error.message}` },
      { status: 500 }
    );
  }
} 