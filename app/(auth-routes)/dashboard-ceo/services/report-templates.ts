/**
 * SERVIÇO DE TEMPLATES DE RELATÓRIOS CEO
 * Sistema isolado para gerenciamento de templates personalizáveis
 * 
 * @module CEOReportTemplates
 */

import type { CEOReportTemplate, CEOReportType } from '../types/report-types';

/**
 * Templates padrão do sistema
 */
const DEFAULT_TEMPLATES: CEOReportTemplate[] = [
  {
    id: 'template-executive',
    name: 'Relatório Executivo',
    description: 'Resumo executivo com métricas principais e insights estratégicos',
    type: 'executive',
    defaultSections: {
      summary: true,
      financialMetrics: true,
      operationalMetrics: true,
      commercialMetrics: true,
      charts: true,
      tables: false,
      analysis: true,
      recommendations: true,
    },
    layout: {
      pageSize: 'A4',
      orientation: 'portrait',
      margins: {
        top: 20,
        right: 20,
        bottom: 20,
        left: 20,
      },
    },
    styles: {
      primaryColor: '#1E40AF',
      secondaryColor: '#3B82F6',
      accentColor: '#10B981',
      fontFamily: 'Helvetica',
      fontSize: {
        title: 24,
        heading: 16,
        body: 11,
        small: 9,
      },
    },
    isDefault: true,
    createdBy: 'Sistema',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'template-financial',
    name: 'Relatório Financeiro Completo',
    description: 'Análise financeira detalhada com DRE, fluxo de caixa e indicadores',
    type: 'financial',
    defaultSections: {
      summary: true,
      financialMetrics: true,
      operationalMetrics: false,
      commercialMetrics: false,
      charts: true,
      tables: true,
      analysis: false,
      recommendations: true,
    },
    layout: {
      pageSize: 'A4',
      orientation: 'landscape',
      margins: {
        top: 15,
        right: 15,
        bottom: 15,
        left: 15,
      },
    },
    styles: {
      primaryColor: '#10B981',
      secondaryColor: '#059669',
      accentColor: '#34D399',
      fontFamily: 'Helvetica',
      fontSize: {
        title: 22,
        heading: 14,
        body: 10,
        small: 8,
      },
    },
    isDefault: true,
    createdBy: 'Sistema',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'template-operational',
    name: 'Relatório Operacional',
    description: 'Métricas operacionais, eficiência e desempenho de processos',
    type: 'operational',
    defaultSections: {
      summary: true,
      financialMetrics: false,
      operationalMetrics: true,
      commercialMetrics: false,
      charts: true,
      tables: true,
      analysis: false,
      recommendations: true,
    },
    layout: {
      pageSize: 'A4',
      orientation: 'portrait',
      margins: {
        top: 20,
        right: 20,
        bottom: 20,
        left: 20,
      },
    },
    styles: {
      primaryColor: '#8B5CF6',
      secondaryColor: '#A78BFA',
      accentColor: '#C4B5FD',
      fontFamily: 'Helvetica',
      fontSize: {
        title: 24,
        heading: 16,
        body: 11,
        small: 9,
      },
    },
    isDefault: true,
    createdBy: 'Sistema',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'template-commercial',
    name: 'Relatório Comercial',
    description: 'Análise de vendas, clientes e desempenho comercial',
    type: 'commercial',
    defaultSections: {
      summary: true,
      financialMetrics: false,
      operationalMetrics: false,
      commercialMetrics: true,
      charts: true,
      tables: true,
      analysis: false,
      recommendations: true,
    },
    layout: {
      pageSize: 'A4',
      orientation: 'portrait',
      margins: {
        top: 20,
        right: 20,
        bottom: 20,
        left: 20,
      },
    },
    styles: {
      primaryColor: '#F59E0B',
      secondaryColor: '#FBBF24',
      accentColor: '#FCD34D',
      fontFamily: 'Helvetica',
      fontSize: {
        title: 24,
        heading: 16,
        body: 11,
        small: 9,
      },
    },
    isDefault: true,
    createdBy: 'Sistema',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'template-custom',
    name: 'Relatório Personalizado',
    description: 'Template totalmente customizável com todas as opções disponíveis',
    type: 'custom',
    defaultSections: {
      summary: true,
      financialMetrics: true,
      operationalMetrics: true,
      commercialMetrics: true,
      charts: true,
      tables: true,
      analysis: true,
      recommendations: true,
    },
    layout: {
      pageSize: 'A4',
      orientation: 'portrait',
      margins: {
        top: 20,
        right: 20,
        bottom: 20,
        left: 20,
      },
    },
    styles: {
      primaryColor: '#1E40AF',
      secondaryColor: '#3B82F6',
      accentColor: '#60A5FA',
      fontFamily: 'Helvetica',
      fontSize: {
        title: 24,
        heading: 16,
        body: 11,
        small: 9,
      },
    },
    isDefault: true,
    createdBy: 'Sistema',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

/**
 * Classe para gerenciamento de templates de relatórios CEO
 */
export class CEOReportTemplatesService {
  private templates: Map<string, CEOReportTemplate> = new Map();
  private customTemplates: Map<string, CEOReportTemplate> = new Map();

  constructor() {
    this.initializeDefaultTemplates();
  }

  /**
   * Inicializa templates padrão
   */
  private initializeDefaultTemplates(): void {
    DEFAULT_TEMPLATES.forEach((template) => {
      this.templates.set(template.id, template);
    });
  }

  /**
   * Obtém todos os templates disponíveis
   */
  getAllTemplates(): CEOReportTemplate[] {
    const allTemplates = [
      ...Array.from(this.templates.values()),
      ...Array.from(this.customTemplates.values()),
    ];

    return allTemplates.sort((a, b) => {
      // Templates padrão primeiro
      if (a.isDefault && !b.isDefault) return -1;
      if (!a.isDefault && b.isDefault) return 1;
      // Depois por nome
      return a.name.localeCompare(b.name);
    });
  }

  /**
   * Obtém template por ID
   */
  getTemplateById(id: string): CEOReportTemplate | null {
    return this.templates.get(id) || this.customTemplates.get(id) || null;
  }

  /**
   * Obtém templates por tipo
   */
  getTemplatesByType(type: CEOReportType): CEOReportTemplate[] {
    const allTemplates = this.getAllTemplates();
    return allTemplates.filter((template) => template.type === type);
  }

  /**
   * Obtém template padrão para um tipo
   */
  getDefaultTemplateForType(type: CEOReportType): CEOReportTemplate | null {
    const templates = this.getTemplatesByType(type);
    const defaultTemplate = templates.find((t) => t.isDefault);
    return defaultTemplate || templates[0] || null;
  }

  /**
   * Cria novo template customizado
   */
  createCustomTemplate(
    template: Omit<CEOReportTemplate, 'id' | 'createdAt' | 'updatedAt' | 'isDefault'>
  ): CEOReportTemplate {
    const newTemplate: CEOReportTemplate = {
      ...template,
      id: this.generateTemplateId(),
      isDefault: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.customTemplates.set(newTemplate.id, newTemplate);
    return newTemplate;
  }

  /**
   * Atualiza template customizado
   */
  updateCustomTemplate(
    id: string,
    updates: Partial<Omit<CEOReportTemplate, 'id' | 'createdAt' | 'isDefault'>>
  ): CEOReportTemplate | null {
    const template = this.customTemplates.get(id);

    if (!template) {
      console.warn(`[CEOReportTemplates] Template ${id} não encontrado`);
      return null;
    }

    const updatedTemplate: CEOReportTemplate = {
      ...template,
      ...updates,
      updatedAt: new Date(),
    };

    this.customTemplates.set(id, updatedTemplate);
    return updatedTemplate;
  }

  /**
   * Remove template customizado
   */
  deleteCustomTemplate(id: string): boolean {
    const template = this.customTemplates.get(id);

    if (!template) {
      console.warn(`[CEOReportTemplates] Template ${id} não encontrado`);
      return false;
    }

    if (template.isDefault) {
      console.warn(`[CEOReportTemplates] Não é possível excluir template padrão`);
      return false;
    }

    return this.customTemplates.delete(id);
  }

  /**
   * Duplica template existente
   */
  duplicateTemplate(id: string, newName?: string): CEOReportTemplate | null {
    const template = this.getTemplateById(id);

    if (!template) {
      console.warn(`[CEOReportTemplates] Template ${id} não encontrado`);
      return null;
    }

    return this.createCustomTemplate({
      name: newName || `${template.name} (Cópia)`,
      description: template.description,
      type: template.type,
      defaultSections: { ...template.defaultSections },
      layout: { ...template.layout },
      styles: { ...template.styles },
      customSections: template.customSections
        ? template.customSections.map((s) => ({ ...s }))
        : undefined,
      createdBy: template.createdBy,
    });
  }

  /**
   * Exporta template para JSON
   */
  exportTemplate(id: string): string | null {
    const template = this.getTemplateById(id);

    if (!template) {
      console.warn(`[CEOReportTemplates] Template ${id} não encontrado`);
      return null;
    }

    return JSON.stringify(template, null, 2);
  }

  /**
   * Importa template de JSON
   */
  importTemplate(
    jsonString: string,
    createdBy: string
  ): CEOReportTemplate | null {
    try {
      const templateData = JSON.parse(jsonString) as Partial<CEOReportTemplate>;

      if (!templateData.name || !templateData.type) {
        throw new Error('Template inválido: faltam campos obrigatórios');
      }

      return this.createCustomTemplate({
        name: templateData.name,
        description: templateData.description,
        type: templateData.type,
        defaultSections: templateData.defaultSections || {
          summary: true,
          financialMetrics: true,
          operationalMetrics: true,
          commercialMetrics: true,
          charts: true,
          tables: true,
          analysis: true,
          recommendations: true,
        },
        layout: templateData.layout || {
          pageSize: 'A4',
          orientation: 'portrait',
          margins: { top: 20, right: 20, bottom: 20, left: 20 },
        },
        styles: templateData.styles || {
          primaryColor: '#1E40AF',
          secondaryColor: '#3B82F6',
          accentColor: '#10B981',
          fontFamily: 'Helvetica',
          fontSize: { title: 24, heading: 16, body: 11, small: 9 },
        },
        customSections: templateData.customSections,
        createdBy,
      });
    } catch (error) {
      console.error('[CEOReportTemplates] Erro ao importar template:', error);
      return null;
    }
  }

  /**
   * Valida template
   */
  validateTemplate(template: Partial<CEOReportTemplate>): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!template.name || template.name.trim().length === 0) {
      errors.push('Nome do template é obrigatório');
    }

    if (!template.type) {
      errors.push('Tipo do template é obrigatório');
    }

    if (!template.defaultSections) {
      errors.push('Seções padrão são obrigatórias');
    }

    if (template.layout) {
      if (
        template.layout.pageSize &&
        !['A4', 'Letter'].includes(template.layout.pageSize)
      ) {
        errors.push('Tamanho de página inválido');
      }

      if (
        template.layout.orientation &&
        !['portrait', 'landscape'].includes(template.layout.orientation)
      ) {
        errors.push('Orientação da página inválida');
      }

      if (template.layout.margins) {
        const { top, right, bottom, left } = template.layout.margins;
        if (top < 0 || right < 0 || bottom < 0 || left < 0) {
          errors.push('Margens não podem ser negativas');
        }
      }
    }

    if (template.styles) {
      if (template.styles.primaryColor && !this.isValidColor(template.styles.primaryColor)) {
        errors.push('Cor primária inválida');
      }

      if (template.styles.secondaryColor && !this.isValidColor(template.styles.secondaryColor)) {
        errors.push('Cor secundária inválida');
      }

      if (template.styles.accentColor && !this.isValidColor(template.styles.accentColor)) {
        errors.push('Cor de destaque inválida');
      }

      if (template.styles.fontSize) {
        const { title, heading, body, small } = template.styles.fontSize;
        if (title <= 0 || heading <= 0 || body <= 0 || small <= 0) {
          errors.push('Tamanhos de fonte devem ser positivos');
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Valida cor hexadecimal
   */
  private isValidColor(color: string): boolean {
    return /^#[0-9A-F]{6}$/i.test(color);
  }

  /**
   * Gera ID único para template
   */
  private generateTemplateId(): string {
    const timestamp = Date.now().toString(36);
    const counter = (CEOReportTemplatesService.idCounter++).toString(36).padStart(4, '0');
    return `template-custom-${timestamp}-${counter}`;
  }

  private static idCounter = 0;

  /**
   * Obtém estatísticas de templates
   */
  getTemplateStats(): {
    total: number;
    default: number;
    custom: number;
    byType: Record<CEOReportType, number>;
  } {
    const allTemplates = this.getAllTemplates();

    return {
      total: allTemplates.length,
      default: allTemplates.filter((t) => t.isDefault).length,
      custom: allTemplates.filter((t) => !t.isDefault).length,
      byType: {
        financial: allTemplates.filter((t) => t.type === 'financial').length,
        operational: allTemplates.filter((t) => t.type === 'operational').length,
        commercial: allTemplates.filter((t) => t.type === 'commercial').length,
        executive: allTemplates.filter((t) => t.type === 'executive').length,
        custom: allTemplates.filter((t) => t.type === 'custom').length,
      },
    };
  }
}

// Exportar instância singleton
export const ceoReportTemplates = new CEOReportTemplatesService();

