import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/_lib/auth";
import { ImportSchedulerService } from "@/app/_services/import-scheduler-service";
import { ImportScheduleSchema } from "@/app/types/import-schedule";

/**
 * API para gerenciar agendamentos de importação
 */
const importSchedulerService = new ImportSchedulerService();

/**
 * Listar todos os agendamentos do usuário
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { message: "Para visualizar agendamentos, você precisa estar autenticado." },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    
    // Obter agendamentos do usuário
    const schedules = await importSchedulerService.getSchedules(userId);

    return NextResponse.json(schedules);
  } catch (error: any) {
    console.error("Erro ao obter agendamentos:", error);
    return NextResponse.json(
      { message: `Erro ao obter agendamentos: ${error.message}` },
      { status: 500 }
    );
  }
}

/**
 * Criar um novo agendamento
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { message: "Para criar agendamentos, você precisa estar autenticado." },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const data = await request.json();
    
    // Validar dados usando o schema
    const parsedData = ImportScheduleSchema.parse({
      ...data,
      userId,
      nextRun: importSchedulerService.calculateNextRun({
        ...data,
        userId,
        nextRun: new Date(), // Valor temporário
      }),
    });
    
    // Criar agendamento
    const schedule = await importSchedulerService.createSchedule(parsedData);

    return NextResponse.json(schedule, { status: 201 });
  } catch (error: any) {
    console.error("Erro ao criar agendamento:", error);
    
    // Verificar se é um erro de validação do Zod
    if (error.errors) {
      return NextResponse.json(
        { message: "Dados inválidos", errors: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { message: `Erro ao criar agendamento: ${error.message}` },
      { status: 500 }
    );
  }
} 