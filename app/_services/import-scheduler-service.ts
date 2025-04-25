import { prisma } from "@/app/_lib/prisma";
import { ImportSchedule } from "@/app/types/import-schedule";
import { startOfDay, addDays, addWeeks, addMonths, setHours, setMinutes, 
         isBefore, parseISO } from "date-fns";
import { GestaoClickService } from "./gestao-click-service";
import { createServerNotification } from "@/app/_lib/server-notifications";
import { NotificationType, NotificationPriority } from "@/app/_types/notification";

// Interface interna para agendamento de importação
export interface ImportScheduleData {
  userId: string;
  source: string;
  status: string;
  scheduledAt: Date;
  executedAt?: Date | null;
  credentials?: any;
  details?: any;
}

/**
 * Serviço para agendamento de importações
 */
export class ImportSchedulerService {
  /**
   * Cria um novo agendamento de importação
   * @param schedule Dados do agendamento
   * @returns O agendamento criado
   */
  async createSchedule(schedule: ImportScheduleData): Promise<any> {
    return prisma.importSchedule.create({
      data: schedule
    });
  }

  /**
   * Calcula a próxima data de execução com base na frequência
   * @param frequency Frequência do agendamento
   * @param time Horário do agendamento (HH:MM)
   * @param dayOfWeek Dia da semana (0-6, sendo 0 = domingo)
   * @param dayOfMonth Dia do mês (1-31)
   * @returns Nova data de execução
   */
  calculateNextRun(
    frequency: "daily" | "weekly" | "monthly",
    time: string,
    dayOfWeek?: number,
    dayOfMonth?: number
  ): Date {
    const [hours, minutes] = time.split(":").map(Number);
    const now = new Date();
    let nextRun;

    switch (frequency) {
      case "daily":
        nextRun = startOfDay(addDays(now, 1));
        break;
      case "weekly":
        const weekDay = dayOfWeek || 0;
        let daysToAdd = weekDay - now.getDay();
        if (daysToAdd <= 0) daysToAdd += 7;
        nextRun = startOfDay(addDays(now, daysToAdd));
        break;
      case "monthly":
        const monthDay = dayOfMonth || 1;
        const currentMonth = now.getMonth();
        nextRun = new Date(now.getFullYear(), currentMonth + 1, monthDay);
        break;
      default:
        nextRun = startOfDay(addDays(now, 1));
    }

    // Definir a hora e minutos
    nextRun = setHours(nextRun, hours);
    nextRun = setMinutes(nextRun, minutes);

    return nextRun;
  }

  /**
   * Processa os agendamentos que estão pendentes
   * @returns Número de agendamentos processados
   */
  async processPendingSchedules(): Promise<number> {
    const now = new Date();
    
    // Buscar agendamentos pendentes
    const pendingSchedules = await prisma.importSchedule.findMany({
      where: {
        status: "SCHEDULED",
        scheduledAt: {
          lte: now,
        },
      },
    });

    let processed = 0;

    for (const schedule of pendingSchedules) {
      try {
        // Atualizar status para "PROCESSING"
        await prisma.importSchedule.update({
          where: { id: schedule.id },
          data: {
            status: "PROCESSING",
          },
        });
        
        // Iniciar importação para este agendamento
        await this.executeSchedule(schedule);
        
        // Atualizar o agendamento como concluído
        await prisma.importSchedule.update({
          where: { id: schedule.id },
          data: {
            status: "COMPLETED",
            executedAt: now,
            details: {
              ...schedule.details,
              completedAt: now.toISOString(),
              success: true
            }
          },
        });
        
        processed++;
      } catch (error: any) {
        console.error(`Erro ao processar agendamento ${schedule.id}:`, error);
        
        // Registrar erro, mas não interromper o processamento dos outros agendamentos
        await prisma.importSchedule.update({
          where: { id: schedule.id },
          data: {
            status: "FAILED",
            details: {
              ...schedule.details,
              failedAt: now.toISOString(),
              error: error.message
            }
          },
        });
      }
    }

    return processed;
  }

  /**
   * Executa um agendamento específico de importação
   * @param schedule Agendamento a ser executado
   */
  private async executeSchedule(schedule: any): Promise<void> {
    const { userId, source } = schedule;
    const credentials = schedule.credentials || {};
    const options = schedule.details?.options || {};
    
    // Verificar o tipo de fonte da importação
    if (source !== 'GESTAO_CLICK') {
      throw new Error(`Fonte de importação não suportada: ${source}`);
    }
    
    // Obter credenciais da API
    const apiKey = credentials.apiKey || process.env.GESTAO_CLICK_API_KEY || "";
    const secretToken = credentials.secretToken || process.env.GESTAO_CLICK_SECRET_ACCESS_TOKEN || "";
    const apiUrl = credentials.apiUrl || process.env.GESTAO_CLICK_API_URL || "https://api.beteltecnologia.com";
    
    if (!apiKey) {
      throw new Error('API Key do Gestão Click não configurada');
    }
    
    // Criar instância do serviço do Gestão Click
    const gestaoClickService = new GestaoClickService({
      userId,
      apiKey,
      secretToken,
      apiUrl,
    });

    // Registrar início da importação
    console.log(`[IMPORT_SCHEDULER] Iniciando importação agendada do Gestão Click para usuário ${userId}`);
    
    try {
      // Notificar o usuário sobre o início da importação
      await createServerNotification({
        userId,
        title: "Importação automática iniciada",
        message: "Iniciando importação automática de transações do Gestão Click",
        type: NotificationType.SYSTEM,
        priority: NotificationPriority.LOW,
        link: "/transactions",
        metadata: {
          source: "GESTAO_CLICK",
          scheduleId: schedule.id,
          timestamp: new Date().toISOString()
        }
      });
      
      // Realizar a importação
      const importResult = await gestaoClickService.importAllData();
      
      // Registrar conclusão da importação
      console.log(`[IMPORT_SCHEDULER] Importação agendada concluída. Importadas ${importResult.transactions.totalImported} transações`);
      
      // Notificar o usuário sobre a conclusão da importação
      if (importResult.transactions.totalImported > 0) {
        await createServerNotification({
          userId,
          title: "Importação automática concluída",
          message: `${importResult.transactions.totalImported} novas transações foram importadas do Gestão Click`,
          type: NotificationType.SYSTEM,
          priority: NotificationPriority.MEDIUM,
          link: "/transactions",
          metadata: {
            source: "GESTAO_CLICK",
            scheduleId: schedule.id,
            result: importResult,
            timestamp: new Date().toISOString()
          }
        });
      } else {
        await createServerNotification({
          userId,
          title: "Importação automática concluída",
          message: "Nenhuma nova transação foi encontrada para importar do Gestão Click",
          type: NotificationType.SYSTEM,
          priority: NotificationPriority.LOW,
          link: "/transactions",
          metadata: {
            source: "GESTAO_CLICK",
            scheduleId: schedule.id,
            result: importResult,
            timestamp: new Date().toISOString()
          }
        });
      }
      
      return;
    } catch (error: any) {
      console.error(`[IMPORT_SCHEDULER] Erro na importação agendada: ${error.message}`);
      
      // Notificar o usuário sobre o erro
      await createServerNotification({
        userId,
        title: "Erro na importação automática",
        message: `Ocorreu um erro ao importar transações do Gestão Click: ${error.message}`,
        type: NotificationType.SYSTEM,
        priority: NotificationPriority.HIGH,
        link: "/settings/integrations",
        metadata: {
          source: "GESTAO_CLICK",
          scheduleId: schedule.id,
          error: error.message,
          timestamp: new Date().toISOString()
        }
      });
      
      throw error;
    }
  }

  /**
   * Atualiza um agendamento existente
   * @param id ID do agendamento
   * @param schedule Dados atualizados
   * @returns O agendamento atualizado
   */
  async updateSchedule(id: string, schedule: Partial<ImportScheduleData>): Promise<any> {
    return prisma.importSchedule.update({
      where: { id },
      data: schedule
    });
  }

  /**
   * Exclui um agendamento existente
   * @param id ID do agendamento
   */
  async deleteSchedule(id: string): Promise<void> {
    await prisma.importSchedule.delete({
      where: { id },
    });
  }

  /**
   * Obtém todos os agendamentos de um usuário
   * @param userId ID do usuário
   * @returns Lista de agendamentos
   */
  async getSchedules(userId: string): Promise<any[]> {
    return prisma.importSchedule.findMany({
      where: { userId },
      orderBy: { scheduledAt: "desc" },
    });
  }

  /**
   * Obtém os detalhes de um agendamento específico
   * @param id ID do agendamento
   * @param userId ID do usuário
   * @returns Detalhes do agendamento
   */
  async getSchedule(id: string, userId: string): Promise<any | null> {
    return prisma.importSchedule.findUnique({
      where: {
        id,
        userId, // Garantir que pertence ao usuário
      },
    });
  }
  
  /**
   * Cria um novo agendamento para importação automática do Gestão Click
   * @param userId ID do usuário
   * @param options Opções de agendamento
   * @returns O agendamento criado
   */
  async createGestaoClickSchedule(
    userId: string,
    options: {
      frequency: "daily" | "weekly" | "monthly";
      time: string;
      dayOfWeek?: number;
      dayOfMonth?: number;
      credentials?: {
        apiKey?: string;
        secretToken?: string;
        apiUrl?: string;
      };
    }
  ): Promise<any> {
    // Verificar se já existe um agendamento ativo para este usuário
    const existingSchedule = await prisma.importSchedule.findFirst({
      where: {
        userId,
        source: "GESTAO_CLICK",
        status: "SCHEDULED",
      },
    });
    
    if (existingSchedule) {
      throw new Error("Já existe um agendamento ativo para importação do Gestão Click");
    }
    
    // Calcular a próxima data de execução
    const nextRun = this.calculateInitialNextRun(
      options.frequency,
      options.time,
      options.dayOfWeek,
      options.dayOfMonth
    );
    
    // Buscar credenciais armazenadas se não foram fornecidas
    let credentials = options.credentials || {};
    
    if (!credentials.apiKey) {
      const integrationSettings = await prisma.integrationSettings.findFirst({
        where: {
          userId,
          provider: 'gestao-click',
          walletId: 'global',
          active: true,
        },
      });
      
      if (integrationSettings?.metadata) {
        const metadata = integrationSettings.metadata as Record<string, any>;
        credentials = {
          apiKey: metadata.apiKey || process.env.GESTAO_CLICK_API_KEY,
          secretToken: metadata.secretToken || process.env.GESTAO_CLICK_SECRET_ACCESS_TOKEN,
          apiUrl: metadata.apiUrl || process.env.GESTAO_CLICK_API_URL,
        };
      }
    }
    
    // Criar o agendamento
    const schedule: ImportScheduleData = {
      userId,
      source: "GESTAO_CLICK",
      status: "SCHEDULED",
      scheduledAt: nextRun,
      credentials,
      details: {
        name: `Importação automática do Gestão Click - ${options.frequency}`,
        frequency: options.frequency,
        time: options.time,
        dayOfWeek: options.dayOfWeek,
        dayOfMonth: options.dayOfMonth,
        createdAt: new Date().toISOString(),
        options: {
          importAllWallets: true
        }
      }
    };
    
    const createdSchedule = await this.createSchedule(schedule);
    
    // Registrar a criação do agendamento
    await createServerNotification({
      userId,
      title: "Agendamento de importação criado",
      message: `Importação automática do Gestão Click agendada para ${nextRun.toLocaleString()}`,
      type: NotificationType.SYSTEM,
      priority: NotificationPriority.LOW,
      link: "/settings/integrations",
      metadata: {
        source: "GESTAO_CLICK",
        scheduleId: createdSchedule.id,
        nextRun: nextRun.toISOString(),
        timestamp: new Date().toISOString()
      }
    });
    
    return createdSchedule;
  }
  
  /**
   * Calcula a data inicial para o próximo agendamento
   * @param frequency Frequência do agendamento
   * @param time Horário do agendamento (HH:MM)
   * @param dayOfWeek Dia da semana (0-6, sendo 0 = domingo)
   * @param dayOfMonth Dia do mês (1-31)
   * @returns Data do próximo agendamento
   */
  private calculateInitialNextRun(
    frequency: "daily" | "weekly" | "monthly",
    time: string,
    dayOfWeek?: number,
    dayOfMonth?: number
  ): Date {
    const [hours, minutes] = time.split(":").map(Number);
    const now = new Date();
    let nextRun;
    
    // Verificar se o horário já passou hoje
    const todayWithTime = new Date(now);
    todayWithTime.setHours(hours, minutes, 0, 0);
    
    // Se o horário ainda não passou hoje, agendar para hoje
    if (todayWithTime > now) {
      return todayWithTime;
    }
    
    switch (frequency) {
      case "daily":
        nextRun = startOfDay(addDays(now, 1));
        break;
      case "weekly":
        const weekDay = dayOfWeek || 0;
        let daysToAdd = weekDay - now.getDay();
        if (daysToAdd <= 0) daysToAdd += 7;
        nextRun = startOfDay(addDays(now, daysToAdd));
        break;
      case "monthly":
        const monthDay = dayOfMonth || 1;
        const currentMonth = now.getMonth();
        nextRun = new Date(now.getFullYear(), currentMonth + 1, monthDay);
        break;
      default:
        nextRun = startOfDay(addDays(now, 1));
    }
    
    // Definir a hora e minutos
    nextRun = setHours(nextRun, hours);
    nextRun = setMinutes(nextRun, minutes);
    
    return nextRun;
  }
} 