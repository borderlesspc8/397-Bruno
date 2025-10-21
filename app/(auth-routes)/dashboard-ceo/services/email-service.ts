/**
 * SERVIÇO DE ENVIO DE EMAIL PARA RELATÓRIOS CEO
 * Sistema isolado para envio de relatórios por email
 * 
 * @module CEOEmailService
 */

import nodemailer from 'nodemailer';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type {
  CEOReportResult,
  CEOReportSchedule,
  CEOReportConfig,
  CEOReportFormat,
} from '../types/report-types';

/**
 * Configuração de email
 */
interface CEOEmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: {
    name: string;
    email: string;
  };
}

/**
 * Dados do email
 */
interface CEOEmailData {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    path?: string;
    content?: Buffer;
    contentType?: string;
  }>;
}

/**
 * Classe para envio de emails de relatórios CEO
 */
export class CEOEmailService {
  private transporter: nodemailer.Transporter | null = null;
  private config: CEOEmailConfig | null = null;

  /**
   * Inicializa o serviço de email
   */
  initialize(config: CEOEmailConfig): void {
    this.config = config;

    this.transporter = nodemailer.createTransporter({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.auth.user,
        pass: config.auth.pass,
      },
    });

    console.log('[CEOEmailService] Serviço de email inicializado');
  }

  /**
   * Verifica se o serviço está inicializado
   */
  isInitialized(): boolean {
    return this.transporter !== null && this.config !== null;
  }

  /**
   * Envia relatório por email
   */
  async sendReport(
    recipients: string[],
    reportResult: CEOReportResult,
    reportConfig: CEOReportConfig,
    options?: {
      cc?: string[];
      bcc?: string[];
      subject?: string;
      message?: string;
    }
  ): Promise<void> {
    if (!this.isInitialized()) {
      throw new Error('Serviço de email não inicializado. Chame initialize() primeiro.');
    }

    try {
      // Preparar assunto
      const subject =
        options?.subject ||
        `Relatório CEO: ${reportConfig.name} - ${format(new Date(), 'dd/MM/yyyy', { locale: ptBR })}`;

      // Preparar corpo do email
      const html = this.generateEmailHTML(reportResult, reportConfig, options?.message);
      const text = this.generateEmailText(reportResult, reportConfig, options?.message);

      // Preparar anexos
      const attachments = await this.prepareAttachments(reportResult);

      // Dados do email
      const emailData: CEOEmailData = {
        to: recipients,
        cc: options?.cc,
        bcc: options?.bcc,
        subject,
        html,
        text,
        attachments,
      };

      // Enviar email
      await this.sendEmail(emailData);

      console.log(`[CEOEmailService] Relatório enviado com sucesso para ${recipients.join(', ')}`);
    } catch (error) {
      console.error('[CEOEmailService] Erro ao enviar relatório:', error);
      throw new Error(
        `Falha ao enviar relatório por email: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      );
    }
  }

  /**
   * Envia relatório agendado
   */
  async sendScheduledReport(
    schedule: CEOReportSchedule,
    reportResult: CEOReportResult,
    reportConfig: CEOReportConfig
  ): Promise<void> {
    const recipients = schedule.recipients.map((r) => r.email);

    const subject =
      schedule.emailSubject ||
      `[Agendado] Relatório CEO: ${reportConfig.name} - ${format(new Date(), 'dd/MM/yyyy', { locale: ptBR })}`;

    const message = schedule.emailBody || undefined;

    await this.sendReport(recipients, reportResult, reportConfig, {
      subject,
      message,
    });
  }

  /**
   * Envia notificação de erro
   */
  async sendErrorNotification(
    recipients: string[],
    error: Error,
    context: {
      reportName?: string;
      scheduleName?: string;
      timestamp: Date;
    }
  ): Promise<void> {
    if (!this.isInitialized()) {
      console.warn('[CEOEmailService] Não foi possível enviar notificação de erro: serviço não inicializado');
      return;
    }

    try {
      const subject = `⚠️ Erro na Geração de Relatório CEO`;

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #EF4444; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
            .content { background-color: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; }
            .error-box { background-color: #FEE2E2; border-left: 4px solid #EF4444; padding: 15px; margin: 15px 0; }
            .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">⚠️ Erro na Geração de Relatório</h1>
            </div>
            <div class="content">
              <p>Ocorreu um erro ao gerar o relatório CEO:</p>
              
              ${context.reportName ? `<p><strong>Relatório:</strong> ${context.reportName}</p>` : ''}
              ${context.scheduleName ? `<p><strong>Agendamento:</strong> ${context.scheduleName}</p>` : ''}
              <p><strong>Data/Hora:</strong> ${format(context.timestamp, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
              
              <div class="error-box">
                <h3 style="margin-top: 0;">Detalhes do Erro:</h3>
                <p><strong>Mensagem:</strong> ${error.message}</p>
                ${error.stack ? `<pre style="font-size: 11px; overflow-x: auto;">${error.stack}</pre>` : ''}
              </div>
              
              <p>Por favor, verifique a configuração do relatório e tente novamente.</p>
            </div>
            <div class="footer">
              <p>Dashboard CEO - Sistema de Relatórios</p>
              <p>Este é um email automático. Não responda.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const text = `
        ⚠️ ERRO NA GERAÇÃO DE RELATÓRIO CEO

        ${context.reportName ? `Relatório: ${context.reportName}` : ''}
        ${context.scheduleName ? `Agendamento: ${context.scheduleName}` : ''}
        Data/Hora: ${format(context.timestamp, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}

        Detalhes do Erro:
        ${error.message}

        ${error.stack || ''}

        Por favor, verifique a configuração do relatório e tente novamente.

        ---
        Dashboard CEO - Sistema de Relatórios
        Este é um email automático. Não responda.
      `;

      await this.sendEmail({
        to: recipients,
        subject,
        html,
        text,
      });

      console.log(`[CEOEmailService] Notificação de erro enviada para ${recipients.join(', ')}`);
    } catch (emailError) {
      console.error('[CEOEmailService] Erro ao enviar notificação de erro:', emailError);
    }
  }

  /**
   * Envia teste de email
   */
  async sendTestEmail(recipient: string): Promise<void> {
    if (!this.isInitialized()) {
      throw new Error('Serviço de email não inicializado. Chame initialize() primeiro.');
    }

    const subject = 'Teste - Dashboard CEO Email Service';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #1E40AF; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
          .content { background-color: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; }
          .success-box { background-color: #D1FAE5; border-left: 4px solid #10B981; padding: 15px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">✅ Email de Teste</h1>
          </div>
          <div class="content">
            <div class="success-box">
              <h3 style="margin-top: 0;">Configuração de Email OK!</h3>
              <p>Se você está vendo este email, significa que o serviço de email do Dashboard CEO está configurado corretamente.</p>
            </div>
            
            <p><strong>Data/Hora do Teste:</strong> ${format(new Date(), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}</p>
            
            <p>Você pode agora usar o sistema de relatórios automatizados com envio por email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      ✅ EMAIL DE TESTE - Dashboard CEO

      Se você está vendo este email, significa que o serviço de email do Dashboard CEO está configurado corretamente.

      Data/Hora do Teste: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}

      Você pode agora usar o sistema de relatórios automatizados com envio por email.
    `;

    await this.sendEmail({
      to: [recipient],
      subject,
      html,
      text,
    });

    console.log(`[CEOEmailService] Email de teste enviado para ${recipient}`);
  }

  /**
   * Gera HTML do email
   */
  private generateEmailHTML(
    reportResult: CEOReportResult,
    reportConfig: CEOReportConfig,
    customMessage?: string
  ): string {
    const hasFiles = reportResult.files.pdf || reportResult.files.excel;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #1E40AF; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
          .content { background-color: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; }
          .info-box { background-color: white; border: 1px solid #E5E7EB; padding: 15px; margin: 15px 0; border-radius: 5px; }
          .stats { display: flex; justify-content: space-around; margin: 20px 0; }
          .stat { text-align: center; }
          .stat-value { font-size: 24px; font-weight: bold; color: #1E40AF; }
          .stat-label { font-size: 12px; color: #6B7280; }
          .attachments { background-color: #EFF6FF; border: 1px solid #BFDBFE; padding: 15px; margin: 15px 0; border-radius: 5px; }
          .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
          .btn { display: inline-block; padding: 10px 20px; background-color: #1E40AF; color: white; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">📊 ${reportConfig.name}</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">${reportConfig.description || 'Relatório CEO'}</p>
          </div>
          
          <div class="content">
            ${customMessage ? `<div class="info-box"><p>${customMessage}</p></div>` : ''}
            
            <div class="info-box">
              <h3 style="margin-top: 0;">ℹ️ Informações do Relatório</h3>
              <p><strong>Período:</strong> ${format(reportConfig.startDate, 'dd/MM/yyyy', { locale: ptBR })} - ${format(reportConfig.endDate, 'dd/MM/yyyy', { locale: ptBR })}</p>
              <p><strong>Gerado em:</strong> ${format(reportResult.generatedAt, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
              <p><strong>Gerado por:</strong> ${reportResult.generatedBy}</p>
            </div>

            <div class="stats">
              <div class="stat">
                <div class="stat-value">${reportResult.stats.dataPoints.toLocaleString('pt-BR')}</div>
                <div class="stat-label">Pontos de Dados</div>
              </div>
              ${reportResult.stats.charts ? `
                <div class="stat">
                  <div class="stat-value">${reportResult.stats.charts}</div>
                  <div class="stat-label">Gráficos</div>
                </div>
              ` : ''}
              ${reportResult.stats.pages ? `
                <div class="stat">
                  <div class="stat-value">${reportResult.stats.pages}</div>
                  <div class="stat-label">Páginas</div>
                </div>
              ` : ''}
            </div>

            ${hasFiles ? `
              <div class="attachments">
                <h3 style="margin-top: 0;">📎 Arquivos Anexados</h3>
                ${reportResult.files.pdf ? `
                  <p>📄 <strong>PDF:</strong> ${reportResult.files.pdf.path.split('/').pop()} (${this.formatFileSize(reportResult.files.pdf.size)})</p>
                ` : ''}
                ${reportResult.files.excel ? `
                  <p>📊 <strong>Excel:</strong> ${reportResult.files.excel.path.split('/').pop()} (${this.formatFileSize(reportResult.files.excel.size)})</p>
                ` : ''}
              </div>
            ` : ''}

            <p style="text-align: center; margin: 20px 0;">
              <em>Os relatórios estão anexados neste email.</em>
            </p>
          </div>

          <div class="footer">
            <p>Dashboard CEO - Sistema de Relatórios Automatizados</p>
            <p>Este é um email automático. Não responda.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Gera texto do email
   */
  private generateEmailText(
    reportResult: CEOReportResult,
    reportConfig: CEOReportConfig,
    customMessage?: string
  ): string {
    const hasFiles = reportResult.files.pdf || reportResult.files.excel;

    return `
      📊 ${reportConfig.name}
      ${reportConfig.description || 'Relatório CEO'}

      ${customMessage ? `\n${customMessage}\n` : ''}

      ℹ️ INFORMAÇÕES DO RELATÓRIO

      Período: ${format(reportConfig.startDate, 'dd/MM/yyyy', { locale: ptBR })} - ${format(reportConfig.endDate, 'dd/MM/yyyy', { locale: ptBR })}
      Gerado em: ${format(reportResult.generatedAt, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
      Gerado por: ${reportResult.generatedBy}

      ESTATÍSTICAS

      - Pontos de Dados: ${reportResult.stats.dataPoints.toLocaleString('pt-BR')}
      ${reportResult.stats.charts ? `- Gráficos: ${reportResult.stats.charts}` : ''}
      ${reportResult.stats.pages ? `- Páginas: ${reportResult.stats.pages}` : ''}

      ${hasFiles ? `
      📎 ARQUIVOS ANEXADOS

      ${reportResult.files.pdf ? `📄 PDF: ${reportResult.files.pdf.path.split('/').pop()} (${this.formatFileSize(reportResult.files.pdf.size)})` : ''}
      ${reportResult.files.excel ? `📊 Excel: ${reportResult.files.excel.path.split('/').pop()} (${this.formatFileSize(reportResult.files.excel.size)})` : ''}
      ` : ''}

      Os relatórios estão anexados neste email.

      ---
      Dashboard CEO - Sistema de Relatórios Automatizados
      Este é um email automático. Não responda.
    `.trim();
  }

  /**
   * Prepara anexos do email
   */
  private async prepareAttachments(
    reportResult: CEOReportResult
  ): Promise<Array<{ filename: string; path: string; contentType: string }>> {
    const attachments: Array<{ filename: string; path: string; contentType: string }> = [];

    if (reportResult.files.pdf) {
      attachments.push({
        filename: reportResult.files.pdf.path.split('/').pop() || 'relatorio.pdf',
        path: reportResult.files.pdf.path,
        contentType: 'application/pdf',
      });
    }

    if (reportResult.files.excel) {
      attachments.push({
        filename: reportResult.files.excel.path.split('/').pop() || 'relatorio.xlsx',
        path: reportResult.files.excel.path,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
    }

    return attachments;
  }

  /**
   * Envia email
   */
  private async sendEmail(data: CEOEmailData): Promise<void> {
    if (!this.transporter || !this.config) {
      throw new Error('Transporter não inicializado');
    }

    const mailOptions = {
      from: `"${this.config.from.name}" <${this.config.from.email}>`,
      to: data.to.join(', '),
      cc: data.cc?.join(', '),
      bcc: data.bcc?.join(', '),
      subject: data.subject,
      text: data.text,
      html: data.html,
      attachments: data.attachments,
    };

    await this.transporter.sendMail(mailOptions);
  }

  /**
   * Formata tamanho de arquivo
   */
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  /**
   * Verifica conexão com servidor de email
   */
  async verifyConnection(): Promise<boolean> {
    if (!this.transporter) {
      throw new Error('Transporter não inicializado');
    }

    try {
      await this.transporter.verify();
      console.log('[CEOEmailService] Conexão com servidor de email verificada com sucesso');
      return true;
    } catch (error) {
      console.error('[CEOEmailService] Erro ao verificar conexão:', error);
      return false;
    }
  }
}

// Exportar instância singleton
export const ceoEmailService = new CEOEmailService();

/**
 * Configuração padrão de email (deve ser sobrescrita com valores reais)
 */
export const DEFAULT_EMAIL_CONFIG: CEOEmailConfig = {
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || '',
  },
  from: {
    name: process.env.EMAIL_FROM_NAME || 'Dashboard CEO',
    email: process.env.EMAIL_FROM_EMAIL || 'noreply@dashboardceo.com',
  },
};

