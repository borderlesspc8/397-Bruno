// Serviço de notificações para usuário da Dashboard CEO
// Isolado e independente - não afeta outras dashboards

import { CEOErrorHandler, CEOErrorType } from './error-handler';

// Interface para notificações de erro
export interface CEONotification {
  id: string;
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  details?: string;
  actionable: boolean;
  actions?: Array<{
    label: string;
    action: string;
    primary?: boolean;
  }>;
  timestamp: string;
  persistent: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

// Interface para configuração de notificações
export interface CEONotificationConfig {
  showNotifications: boolean;
  persistentErrors: boolean;
  autoHideDelay: number;
  maxNotifications: number;
}

// Configuração padrão
const DEFAULT_CONFIG: CEONotificationConfig = {
  showNotifications: true,
  persistentErrors: true,
  autoHideDelay: 5000, // 5 segundos
  maxNotifications: 10
};

// Classe para gerenciar notificações CEO
export class CEONotificationService {
  private static notifications: CEONotification[] = [];
  private static config: CEONotificationConfig = DEFAULT_CONFIG;

  // Gerar ID único para notificação
  private static generateNotificationId(): string {
    const timestamp = Date.now().toString(36);
    const counter = (this.idCounter++).toString(36).padStart(4, '0');
    return `ceo_notif_${timestamp}_${counter}`;
  }

  private static idCounter = 0;

  // Mapear tipo de erro para tipo de notificação
  private static mapErrorTypeToNotificationType(errorType: CEOErrorType): 'error' | 'warning' | 'info' {
    switch (errorType) {
      case CEOErrorType.UNAUTHORIZED:
      case CEOErrorType.FORBIDDEN:
      case CEOErrorType.SERVER_ERROR:
        return 'error';
      case CEOErrorType.NETWORK_ERROR:
      case CEOErrorType.TIMEOUT_ERROR:
      case CEOErrorType.SERVICE_UNAVAILABLE:
      case CEOErrorType.RATE_LIMIT_EXCEEDED:
        return 'warning';
      default:
        return 'info';
    }
  }

  // Mapear severidade do erro para severidade da notificação
  private static mapErrorSeverityToNotificationSeverity(severity: 'low' | 'medium' | 'high' | 'critical'): 'low' | 'medium' | 'high' | 'critical' {
    return severity;
  }

  // Determinar se a notificação deve ser persistente
  private static shouldBePersistent(errorType: CEOErrorType, severity: 'low' | 'medium' | 'high' | 'critical'): boolean {
    if (!this.config.persistentErrors) return false;
    
    return severity === 'high' || severity === 'critical' || 
           [CEOErrorType.UNAUTHORIZED, CEOErrorType.FORBIDDEN, CEOErrorType.SERVER_ERROR].includes(errorType);
  }

  // Gerar ações para notificações acionáveis
  private static generateActions(errorType: CEOErrorType): Array<{ label: string; action: string; primary?: boolean }> {
    switch (errorType) {
      case CEOErrorType.UNAUTHORIZED:
        return [
          { label: 'Fazer Login', action: 'redirect_login', primary: true },
          { label: 'Tentar Novamente', action: 'retry' }
        ];
      case CEOErrorType.FORBIDDEN:
        return [
          { label: 'Verificar Permissões', action: 'check_permissions', primary: true },
          { label: 'Contatar Suporte', action: 'contact_support' }
        ];
      case CEOErrorType.NETWORK_ERROR:
      case CEOErrorType.TIMEOUT_ERROR:
        return [
          { label: 'Tentar Novamente', action: 'retry', primary: true },
          { label: 'Usar Dados Offline', action: 'use_offline_data' }
        ];
      case CEOErrorType.SERVER_ERROR:
        return [
          { label: 'Tentar Novamente', action: 'retry', primary: true },
          { label: 'Usar Dados Históricos', action: 'use_historical_data' },
          { label: 'Contatar Suporte', action: 'contact_support' }
        ];
      case CEOErrorType.SERVICE_UNAVAILABLE:
        return [
          { label: 'Usar Dados em Cache', action: 'use_cached_data', primary: true },
          { label: 'Tentar Novamente', action: 'retry' }
        ];
      case CEOErrorType.RATE_LIMIT_EXCEEDED:
        return [
          { label: 'Aguardar', action: 'wait', primary: true },
          { label: 'Usar Dados Históricos', action: 'use_historical_data' }
        ];
      default:
        return [
          { label: 'Tentar Novamente', action: 'retry', primary: true }
        ];
    }
  }

  // Criar notificação baseada em erro
  public static createErrorNotification(
    errorType: CEOErrorType,
    message: string,
    details?: string,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): CEONotification {
    const notification: CEONotification = {
      id: this.generateNotificationId(),
      type: this.mapErrorTypeToNotificationType(errorType),
      title: this.getErrorTitle(errorType),
      message,
      details,
      actionable: CEOErrorHandler.isRetryable(errorType) || this.isActionableError(errorType),
      actions: this.isActionableError(errorType) ? this.generateActions(errorType) : undefined,
      timestamp: new Date().toISOString(),
      persistent: this.shouldBePersistent(errorType, severity),
      severity: this.mapErrorSeverityToNotificationSeverity(severity)
    };

    return notification;
  }

  // Obter título do erro
  private static getErrorTitle(errorType: CEOErrorType): string {
    switch (errorType) {
      case CEOErrorType.NETWORK_ERROR:
        return 'Problema de Conectividade';
      case CEOErrorType.TIMEOUT_ERROR:
        return 'Tempo Limite Excedido';
      case CEOErrorType.UNAUTHORIZED:
        return 'Sessão Expirada';
      case CEOErrorType.FORBIDDEN:
        return 'Acesso Negado';
      case CEOErrorType.DATA_NOT_FOUND:
        return 'Dados Não Encontrados';
      case CEOErrorType.SERVER_ERROR:
        return 'Erro do Servidor';
      case CEOErrorType.SERVICE_UNAVAILABLE:
        return 'Serviço Indisponível';
      case CEOErrorType.RATE_LIMIT_EXCEEDED:
        return 'Muitas Solicitações';
      case CEOErrorType.VALIDATION_ERROR:
        return 'Dados Inválidos';
      case CEOErrorType.MISSING_PARAMETERS:
        return 'Parâmetros Obrigatórios';
      default:
        return 'Erro Inesperado';
    }
  }

  // Verificar se o erro é acionável
  private static isActionableError(errorType: CEOErrorType): boolean {
    return [
      CEOErrorType.UNAUTHORIZED,
      CEOErrorType.FORBIDDEN,
      CEOErrorType.VALIDATION_ERROR,
      CEOErrorType.MISSING_PARAMETERS
    ].includes(errorType);
  }

  // Adicionar notificação
  public static addNotification(notification: CEONotification): void {
    if (!this.config.showNotifications) return;

    // Adicionar à lista
    this.notifications.unshift(notification);

    // Limitar número máximo de notificações
    if (this.notifications.length > this.config.maxNotifications) {
      this.notifications = this.notifications.slice(0, this.config.maxNotifications);
    }

    // Log da notificação
    console.log(`CEO: Notificação ${notification.type} criada:`, {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      severity: notification.severity,
      actionable: notification.actionable,
      persistent: notification.persistent
    });

    // Disparar evento customizado para o frontend (se necessário)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ceo-notification', {
        detail: notification
      }));
    }
  }

  // Adicionar notificação de erro diretamente
  public static addErrorNotification(
    errorType: CEOErrorType,
    message: string,
    details?: string,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): CEONotification {
    const notification = this.createErrorNotification(errorType, message, details, severity);
    this.addNotification(notification);
    return notification;
  }

  // Adicionar notificação de sucesso
  public static addSuccessNotification(title: string, message: string): CEONotification {
    const notification: CEONotification = {
      id: this.generateNotificationId(),
      type: 'success',
      title,
      message,
      actionable: false,
      timestamp: new Date().toISOString(),
      persistent: false,
      severity: 'low'
    };

    this.addNotification(notification);
    return notification;
  }

  // Adicionar notificação de informação
  public static addInfoNotification(title: string, message: string, details?: string): CEONotification {
    const notification: CEONotification = {
      id: this.generateNotificationId(),
      type: 'info',
      title,
      message,
      details,
      actionable: false,
      timestamp: new Date().toISOString(),
      persistent: false,
      severity: 'low'
    };

    this.addNotification(notification);
    return notification;
  }

  // Adicionar notificação de aviso
  public static addWarningNotification(title: string, message: string, details?: string): CEONotification {
    const notification: CEONotification = {
      id: this.generateNotificationId(),
      type: 'warning',
      title,
      message,
      details,
      actionable: false,
      timestamp: new Date().toISOString(),
      persistent: false,
      severity: 'medium'
    };

    this.addNotification(notification);
    return notification;
  }

  // Obter todas as notificações
  public static getNotifications(): CEONotification[] {
    return [...this.notifications];
  }

  // Obter notificações por tipo
  public static getNotificationsByType(type: 'error' | 'warning' | 'info' | 'success'): CEONotification[] {
    return this.notifications.filter(notif => notif.type === type);
  }

  // Obter notificações por severidade
  public static getNotificationsBySeverity(severity: 'low' | 'medium' | 'high' | 'critical'): CEONotification[] {
    return this.notifications.filter(notif => notif.severity === severity);
  }

  // Obter notificações persistentes
  public static getPersistentNotifications(): CEONotification[] {
    return this.notifications.filter(notif => notif.persistent);
  }

  // Remover notificação por ID
  public static removeNotification(id: string): boolean {
    const initialLength = this.notifications.length;
    this.notifications = this.notifications.filter(notif => notif.id !== id);
    
    const removed = this.notifications.length < initialLength;
    if (removed) {
      console.log(`CEO: Notificação removida: ${id}`);
    }
    
    return removed;
  }

  // Limpar todas as notificações
  public static clearAllNotifications(): void {
    this.notifications = [];
    console.log('CEO: Todas as notificações foram limpas');
  }

  // Limpar notificações não persistentes
  public static clearNonPersistentNotifications(): void {
    this.notifications = this.notifications.filter(notif => notif.persistent);
    console.log('CEO: Notificações não persistentes foram limpas');
  }

  // Atualizar configuração
  public static updateConfig(newConfig: Partial<CEONotificationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('CEO: Configuração de notificações atualizada:', this.config);
  }

  // Obter configuração atual
  public static getConfig(): CEONotificationConfig {
    return { ...this.config };
  }

  // Obter estatísticas de notificações
  public static getNotificationStats(): {
    total: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
    persistent: number;
    actionable: number;
  } {
    const byType: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};
    let persistent = 0;
    let actionable = 0;

    this.notifications.forEach(notif => {
      byType[notif.type] = (byType[notif.type] || 0) + 1;
      bySeverity[notif.severity] = (bySeverity[notif.severity] || 0) + 1;
      if (notif.persistent) persistent++;
      if (notif.actionable) actionable++;
    });

    return {
      total: this.notifications.length,
      byType,
      bySeverity,
      persistent,
      actionable
    };
  }

  // Auto-remover notificações não persistentes após delay
  public static startAutoCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      const initialLength = this.notifications.length;
      
      this.notifications = this.notifications.filter(notif => {
        if (notif.persistent) return true;
        
        const notifTime = new Date(notif.timestamp).getTime();
        const age = now - notifTime;
        
        return age < this.config.autoHideDelay;
      });

      const removed = this.notifications.length < initialLength;
      if (removed) {
        console.log(`CEO: ${initialLength - this.notifications.length} notificações expiradas foram removidas`);
      }
    }, 1000); // Verificar a cada segundo
  }
}

// Função utilitária para criar notificação de erro rapidamente
export function createCEOErrorNotification(
  errorType: CEOErrorType,
  message: string,
  details?: string,
  severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
): CEONotification {
  return CEONotificationService.addErrorNotification(errorType, message, details, severity);
}

// Função utilitária para criar notificação de sucesso
export function createCEOSuccessNotification(title: string, message: string): CEONotification {
  return CEONotificationService.addSuccessNotification(title, message);
}

// Inicializar serviço de notificações
if (typeof window !== 'undefined') {
  CEONotificationService.startAutoCleanup();
}
