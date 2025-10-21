/**
 * SERVIÇO DE AGENDAMENTO DE RELATÓRIOS CEO
 * Sistema isolado para agendamento automático de relatórios
 * 
 * @module CEOReportScheduler
 */

import { addDays, addWeeks, addMonths, addYears, setHours, setMinutes, setSeconds, startOfDay, isAfter, isBefore } from 'date-fns';
import type {
  CEOReportSchedule,
  CEOReportConfig,
  CEOReportFrequency,
} from '../types/report-types';

/**
 * Classe para gerenciamento de agendamentos de relatórios CEO
 */
export class CEOReportSchedulerService {
  private schedules: Map<string, CEOReportSchedule> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Cria novo agendamento
   */
  createSchedule(
    schedule: Omit<CEOReportSchedule, 'id' | 'createdAt' | 'updatedAt' | 'nextRun'>
  ): CEOReportSchedule {
    const newSchedule: CEOReportSchedule = {
      ...schedule,
      id: this.generateScheduleId(),
      createdAt: new Date(),
      updatedAt: new Date(),
      nextRun: this.calculateNextRun(schedule),
    };

    this.schedules.set(newSchedule.id, newSchedule);

    // Agendar execução se estiver ativo
    if (newSchedule.active) {
      this.scheduleExecution(newSchedule);
    }

    return newSchedule;
  }

  /**
   * Atualiza agendamento existente
   */
  updateSchedule(
    id: string,
    updates: Partial<Omit<CEOReportSchedule, 'id' | 'createdAt'>>
  ): CEOReportSchedule | null {
    const schedule = this.schedules.get(id);

    if (!schedule) {
      console.warn(`[CEOReportScheduler] Agendamento ${id} não encontrado`);
      return null;
    }

    const updatedSchedule: CEOReportSchedule = {
      ...schedule,
      ...updates,
      updatedAt: new Date(),
    };

    // Recalcular próxima execução se frequência mudou
    if (updates.frequency || updates.dayOfWeek || updates.dayOfMonth || updates.monthOfYear || updates.time) {
      updatedSchedule.nextRun = this.calculateNextRun(updatedSchedule);
    }

    this.schedules.set(id, updatedSchedule);

    // Cancelar timer antigo
    this.cancelScheduleTimer(id);

    // Reagendar se estiver ativo
    if (updatedSchedule.active) {
      this.scheduleExecution(updatedSchedule);
    }

    return updatedSchedule;
  }

  /**
   * Remove agendamento
   */
  deleteSchedule(id: string): boolean {
    const schedule = this.schedules.get(id);

    if (!schedule) {
      console.warn(`[CEOReportScheduler] Agendamento ${id} não encontrado`);
      return false;
    }

    // Cancelar timer
    this.cancelScheduleTimer(id);

    // Remover agendamento
    return this.schedules.delete(id);
  }

  /**
   * Obtém agendamento por ID
   */
  getScheduleById(id: string): CEOReportSchedule | null {
    return this.schedules.get(id) || null;
  }

  /**
   * Obtém todos os agendamentos
   */
  getAllSchedules(): CEOReportSchedule[] {
    return Array.from(this.schedules.values()).sort((a, b) => {
      // Ativos primeiro
      if (a.active && !b.active) return -1;
      if (!a.active && b.active) return 1;
      // Depois por próxima execução
      if (a.nextRun && b.nextRun) {
        return a.nextRun.getTime() - b.nextRun.getTime();
      }
      return 0;
    });
  }

  /**
   * Obtém agendamentos ativos
   */
  getActiveSchedules(): CEOReportSchedule[] {
    return this.getAllSchedules().filter((schedule) => schedule.active);
  }

  /**
   * Obtém agendamentos por configuração de relatório
   */
  getSchedulesByReportConfig(reportConfigId: string): CEOReportSchedule[] {
    return this.getAllSchedules().filter(
      (schedule) => schedule.reportConfigId === reportConfigId
    );
  }

  /**
   * Ativa agendamento
   */
  activateSchedule(id: string): boolean {
    const schedule = this.schedules.get(id);

    if (!schedule) {
      console.warn(`[CEOReportScheduler] Agendamento ${id} não encontrado`);
      return false;
    }

    schedule.active = true;
    schedule.updatedAt = new Date();
    schedule.nextRun = this.calculateNextRun(schedule);

    this.scheduleExecution(schedule);

    return true;
  }

  /**
   * Desativa agendamento
   */
  deactivateSchedule(id: string): boolean {
    const schedule = this.schedules.get(id);

    if (!schedule) {
      console.warn(`[CEOReportScheduler] Agendamento ${id} não encontrado`);
      return false;
    }

    schedule.active = false;
    schedule.updatedAt = new Date();

    this.cancelScheduleTimer(id);

    return true;
  }

  /**
   * Executa agendamento imediatamente (teste)
   */
  async executeScheduleNow(id: string): Promise<void> {
    const schedule = this.schedules.get(id);

    if (!schedule) {
      throw new Error(`Agendamento ${id} não encontrado`);
    }

    console.log(`[CEOReportScheduler] Executando agendamento ${id} manualmente`);
    await this.executeSchedule(schedule);
  }

  /**
   * Calcula próxima execução do agendamento
   */
  private calculateNextRun(schedule: Omit<CEOReportSchedule, 'id' | 'createdAt' | 'updatedAt' | 'nextRun'>): Date {
    const now = new Date();
    let nextRun = startOfDay(now);

    // Definir horário
    if (schedule.time) {
      const [hours, minutes] = schedule.time.split(':').map(Number);
      nextRun = setHours(nextRun, hours);
      nextRun = setMinutes(nextRun, minutes);
      nextRun = setSeconds(nextRun, 0);
    } else {
      // Se não definiu horário, usar 00:00
      nextRun = setHours(nextRun, 0);
      nextRun = setMinutes(nextRun, 0);
      nextRun = setSeconds(nextRun, 0);
    }

    // Se a hora de hoje já passou, começar a partir de amanhã
    if (isBefore(nextRun, now)) {
      nextRun = addDays(nextRun, 1);
    }

    switch (schedule.frequency) {
      case 'daily':
        // Próximo dia no horário especificado
        return nextRun;

      case 'weekly':
        // Próximo dia da semana especificado
        if (schedule.dayOfWeek !== undefined) {
          while (nextRun.getDay() !== schedule.dayOfWeek) {
            nextRun = addDays(nextRun, 1);
          }
        }
        return nextRun;

      case 'monthly':
        // Próximo dia do mês especificado
        if (schedule.dayOfMonth !== undefined) {
          // Ajustar para o dia do mês
          const currentMonth = nextRun.getMonth();
          nextRun.setDate(schedule.dayOfMonth);

          // Se o dia já passou neste mês, ir para o próximo mês
          if (isBefore(nextRun, now)) {
            nextRun = addMonths(nextRun, 1);
            nextRun.setDate(schedule.dayOfMonth);
          }

          // Ajustar se o dia não existe no mês (ex: 31 em fevereiro)
          while (nextRun.getMonth() !== (currentMonth + (isBefore(nextRun, now) ? 1 : 0)) % 12) {
            nextRun.setDate(nextRun.getDate() - 1);
          }
        }
        return nextRun;

      case 'quarterly':
        // A cada 3 meses
        if (schedule.dayOfMonth !== undefined) {
          nextRun.setDate(schedule.dayOfMonth);
          
          if (isBefore(nextRun, now)) {
            nextRun = addMonths(nextRun, 3);
            nextRun.setDate(schedule.dayOfMonth);
          }
        }
        return nextRun;

      case 'yearly':
        // Próximo mês e dia especificado
        if (schedule.monthOfYear !== undefined && schedule.dayOfMonth !== undefined) {
          nextRun.setMonth(schedule.monthOfYear - 1); // Meses são 0-indexed
          nextRun.setDate(schedule.dayOfMonth);

          // Se a data já passou neste ano, ir para o próximo ano
          if (isBefore(nextRun, now)) {
            nextRun = addYears(nextRun, 1);
          }
        }
        return nextRun;

      case 'custom':
        // Para custom, usar diário por padrão
        return nextRun;

      default:
        return nextRun;
    }
  }

  /**
   * Agenda execução do relatório
   */
  private scheduleExecution(schedule: CEOReportSchedule): void {
    if (!schedule.nextRun) {
      console.warn(`[CEOReportScheduler] Agendamento ${schedule.id} sem próxima execução`);
      return;
    }

    const now = new Date();
    const delay = schedule.nextRun.getTime() - now.getTime();

    if (delay < 0) {
      console.warn(`[CEOReportScheduler] Próxima execução do agendamento ${schedule.id} está no passado`);
      // Recalcular próxima execução
      schedule.nextRun = this.calculateNextRun(schedule);
      this.scheduleExecution(schedule);
      return;
    }

    console.log(
      `[CEOReportScheduler] Agendamento ${schedule.id} programado para ${schedule.nextRun.toLocaleString('pt-BR')}`
    );

    const timer = setTimeout(async () => {
      await this.executeSchedule(schedule);
    }, delay);

    this.timers.set(schedule.id, timer);
  }

  /**
   * Executa o relatório agendado
   */
  private async executeSchedule(schedule: CEOReportSchedule): Promise<void> {
    console.log(`[CEOReportScheduler] Executando agendamento ${schedule.id}: ${schedule.name}`);

    try {
      // Atualizar lastRun
      schedule.lastRun = new Date();

      // Calcular próxima execução
      schedule.nextRun = this.calculateNextRun(schedule);

      // Atualizar agendamento
      schedule.updatedAt = new Date();
      this.schedules.set(schedule.id, schedule);

      // Reagendar próxima execução
      if (schedule.active) {
        this.scheduleExecution(schedule);
      }

      // TODO: Aqui seria feita a integração com o serviço de geração de relatórios
      // Por enquanto, apenas log
      console.log(`[CEOReportScheduler] Relatório ${schedule.reportConfigId} gerado com sucesso`);
      console.log(`[CEOReportScheduler] Próxima execução: ${schedule.nextRun?.toLocaleString('pt-BR')}`);

      // Aqui seria chamado o serviço de email para enviar o relatório
      // await ceoEmailService.sendScheduledReport(schedule, reportResult);

    } catch (error) {
      console.error(`[CEOReportScheduler] Erro ao executar agendamento ${schedule.id}:`, error);

      // Mesmo em caso de erro, reagendar próxima execução
      schedule.nextRun = this.calculateNextRun(schedule);
      if (schedule.active) {
        this.scheduleExecution(schedule);
      }
    }
  }

  /**
   * Cancela timer de agendamento
   */
  private cancelScheduleTimer(id: string): void {
    const timer = this.timers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(id);
    }
  }

  /**
   * Gera ID único para agendamento
   */
  private generateScheduleId(): string {
    const timestamp = Date.now().toString(36);
    const counter = (CEOReportSchedulerService.idCounter++).toString(36).padStart(4, '0');
    return `schedule-${timestamp}-${counter}`;
  }

  private static idCounter = 0;

  /**
   * Valida agendamento
   */
  validateSchedule(schedule: Partial<CEOReportSchedule>): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!schedule.name || schedule.name.trim().length === 0) {
      errors.push('Nome do agendamento é obrigatório');
    }

    if (!schedule.reportConfigId) {
      errors.push('Configuração de relatório é obrigatória');
    }

    if (!schedule.frequency) {
      errors.push('Frequência é obrigatória');
    }

    if (schedule.frequency === 'weekly' && schedule.dayOfWeek === undefined) {
      errors.push('Dia da semana é obrigatório para frequência semanal');
    }

    if (schedule.frequency === 'weekly' && schedule.dayOfWeek !== undefined) {
      if (schedule.dayOfWeek < 0 || schedule.dayOfWeek > 6) {
        errors.push('Dia da semana inválido (0-6)');
      }
    }

    if (schedule.frequency === 'monthly' && schedule.dayOfMonth === undefined) {
      errors.push('Dia do mês é obrigatório para frequência mensal');
    }

    if (schedule.frequency === 'monthly' && schedule.dayOfMonth !== undefined) {
      if (schedule.dayOfMonth < 1 || schedule.dayOfMonth > 31) {
        errors.push('Dia do mês inválido (1-31)');
      }
    }

    if (schedule.frequency === 'yearly') {
      if (schedule.monthOfYear === undefined) {
        errors.push('Mês do ano é obrigatório para frequência anual');
      }
      if (schedule.dayOfMonth === undefined) {
        errors.push('Dia do mês é obrigatório para frequência anual');
      }
    }

    if (schedule.frequency === 'yearly' && schedule.monthOfYear !== undefined) {
      if (schedule.monthOfYear < 1 || schedule.monthOfYear > 12) {
        errors.push('Mês do ano inválido (1-12)');
      }
    }

    if (schedule.time) {
      const timePattern = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timePattern.test(schedule.time)) {
        errors.push('Formato de hora inválido (HH:MM)');
      }
    }

    if (!schedule.recipients || schedule.recipients.length === 0) {
      errors.push('Pelo menos um destinatário é obrigatório');
    }

    if (schedule.recipients) {
      schedule.recipients.forEach((recipient, index) => {
        if (!recipient.email || !this.isValidEmail(recipient.email)) {
          errors.push(`Email do destinatário ${index + 1} é inválido`);
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Valida email
   */
  private isValidEmail(email: string): boolean {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
  }

  /**
   * Obtém estatísticas de agendamentos
   */
  getScheduleStats(): {
    total: number;
    active: number;
    inactive: number;
    byFrequency: Record<CEOReportFrequency, number>;
    nextExecutions: { scheduleId: string; scheduleName: string; nextRun: Date }[];
  } {
    const allSchedules = this.getAllSchedules();
    const activeSchedules = allSchedules.filter((s) => s.active);

    const nextExecutions = activeSchedules
      .filter((s) => s.nextRun)
      .map((s) => ({
        scheduleId: s.id!,
        scheduleName: s.name,
        nextRun: s.nextRun!,
      }))
      .sort((a, b) => a.nextRun.getTime() - b.nextRun.getTime())
      .slice(0, 10); // Top 10 próximas execuções

    return {
      total: allSchedules.length,
      active: activeSchedules.length,
      inactive: allSchedules.length - activeSchedules.length,
      byFrequency: {
        daily: allSchedules.filter((s) => s.frequency === 'daily').length,
        weekly: allSchedules.filter((s) => s.frequency === 'weekly').length,
        monthly: allSchedules.filter((s) => s.frequency === 'monthly').length,
        quarterly: allSchedules.filter((s) => s.frequency === 'quarterly').length,
        yearly: allSchedules.filter((s) => s.frequency === 'yearly').length,
        custom: allSchedules.filter((s) => s.frequency === 'custom').length,
      },
      nextExecutions,
    };
  }

  /**
   * Limpa todos os agendamentos e timers
   */
  clearAll(): void {
    // Cancelar todos os timers
    this.timers.forEach((timer) => clearTimeout(timer));
    this.timers.clear();

    // Limpar agendamentos
    this.schedules.clear();

    console.log('[CEOReportScheduler] Todos os agendamentos foram limpos');
  }
}

// Exportar instância singleton
export const ceoReportScheduler = new CEOReportSchedulerService();

