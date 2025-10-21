/**
 * CEO Auxiliary Data Service - ISOLADO
 * Serviço de busca real de dados auxiliares da API Betel
 * Não afeta outros dashboards ou funcionalidades existentes
 */

export interface CostCenter {
  id: string;
  name: string;
  description: string;
  type: 'revenue' | 'cost' | 'support';
  isActive: boolean;
  parentId?: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  type: 'credit_card' | 'debit_card' | 'pix' | 'bank_transfer' | 'cash' | 'other';
  isActive: boolean;
  processingFee: number;
  averageProcessingTime: number; // em horas
}

export interface ProductCategory {
  id: string;
  name: string;
  description: string;
  parentId?: string;
  isActive: boolean;
  productCount: number;
  averagePrice: number;
}

export interface CustomerSegment {
  id: string;
  name: string;
  description: string;
  criteria: {
    minValue?: number;
    maxValue?: number;
    minFrequency?: number;
    region?: string[];
  };
  customerCount: number;
  averageValue: number;
}

export interface AuxiliaryData {
  costCenters: CostCenter[];
  paymentMethods: PaymentMethod[];
  productCategories: ProductCategory[];
  customerSegments: CustomerSegment[];
  lastUpdated: string;
}

export class CEOAuxiliaryDataService {
  private static readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutos
  private static cache: Map<string, { data: any; timestamp: number }> = new Map();

  /**
   * Busca centros de custo reais da API Betel
   */
  static async getCostCenters(): Promise<CostCenter[]> {
    const cacheKey = 'cost-centers';
    const cached = this.getCachedData(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      // Buscar dados reais da API Betel
      const apiResponse = await fetch('https://api.beteltecnologia.com/centros_custos', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!apiResponse.ok) {
        throw new Error(`Erro na API Betel: ${apiResponse.status} ${apiResponse.statusText}`);
      }

      const data = await apiResponse.json();
      const costCenters: CostCenter[] = (data || []).map((item: any) => ({
        id: item.id || '',
        name: item.name || 'Centro sem nome',
        description: item.description || '',
        type: this.mapCostCenterType(item.type),
        isActive: item.isActive ?? true,
        parentId: item.parentId || undefined
      }));

      this.setCachedData(cacheKey, costCenters);
      return costCenters;

    } catch (error) {
      console.error('Erro ao buscar centros de custo:', error);
      return this.getDefaultCostCenters();
    }
  }

  /**
   * Busca formas de pagamento reais da API Betel
   */
  static async getPaymentMethods(): Promise<PaymentMethod[]> {
    const cacheKey = 'payment-methods';
    const cached = this.getCachedData(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      // Buscar dados reais da API Betel
      const apiResponse = await fetch('https://api.beteltecnologia.com/formas_pagamentos', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!apiResponse.ok) {
        throw new Error(`Erro na API Betel: ${apiResponse.status} ${apiResponse.statusText}`);
      }

      const data = await apiResponse.json();
      const paymentMethods: PaymentMethod[] = (data || []).map((item: any) => ({
        id: item.id || '',
        name: item.name || 'Método sem nome',
        type: this.mapPaymentMethodType(item.type),
        isActive: item.isActive ?? true,
        processingFee: item.processingFee || 0,
        averageProcessingTime: item.averageProcessingTime || 24
      }));

      this.setCachedData(cacheKey, paymentMethods);
      return paymentMethods;

    } catch (error) {
      console.error('Erro ao buscar formas de pagamento:', error);
      return this.getDefaultPaymentMethods();
    }
  }

  /**
   * Busca categorias de produtos reais da API Betel
   */
  static async getProductCategories(): Promise<ProductCategory[]> {
    const cacheKey = 'product-categories';
    const cached = this.getCachedData(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      // Buscar dados reais da API Betel (Grupos de Produto)
      const apiResponse = await fetch('https://api.beteltecnologia.com/grupos_produtos', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!apiResponse.ok) {
        throw new Error(`Erro na API Betel: ${apiResponse.status} ${apiResponse.statusText}`);
      }

      const data = await apiResponse.json();
      const productCategories: ProductCategory[] = (data || []).map((item: any) => ({
        id: item.id || '',
        name: item.name || 'Categoria sem nome',
        description: item.description || '',
        parentId: item.parentId || undefined,
        isActive: item.isActive ?? true,
        productCount: item.productCount || 0,
        averagePrice: item.averagePrice || 0
      }));

      this.setCachedData(cacheKey, productCategories);
      return productCategories;

    } catch (error) {
      console.error('Erro ao buscar categorias de produtos:', error);
      return this.getDefaultProductCategories();
    }
  }

  /**
   * Busca segmentos de clientes reais da API Betel
   */
  static async getCustomerSegments(): Promise<CustomerSegment[]> {
    const cacheKey = 'customer-segments';
    const cached = this.getCachedData(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      // Buscar dados reais da API Betel (Clientes e processar para criar segmentos)
      const apiResponse = await fetch('https://api.beteltecnologia.com/clientes', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!apiResponse.ok) {
        throw new Error(`Erro na API Betel: ${apiResponse.status} ${apiResponse.statusText}`);
      }

      const clientes = await apiResponse.json();
      // Processar clientes para criar segmentos baseados em valor de compras
      const customerSegments = this.createCustomerSegmentsFromData(clientes);
      
      this.setCachedData(cacheKey, customerSegments);
      return customerSegments;

    } catch (error) {
      console.error('Erro ao buscar segmentos de clientes:', error);
      return this.getDefaultCustomerSegments();
    }
  }

  /**
   * Cria segmentos de clientes a partir dos dados da API
   */
  private static createCustomerSegmentsFromData(clientes: any[]): CustomerSegment[] {
    // Analisar clientes e criar segmentos
    const segments: CustomerSegment[] = [];
    
    // Agrupar por valor total de compras
    const highValue = clientes.filter(c => (c.valorTotal || 0) >= 5000);
    const mediumValue = clientes.filter(c => (c.valorTotal || 0) >= 1000 && (c.valorTotal || 0) < 5000);
    const lowValue = clientes.filter(c => (c.valorTotal || 0) < 1000);

    if (highValue.length > 0) {
      segments.push({
        id: 'high-value',
        name: 'Alto Valor',
        description: 'Clientes com compras acima de R$ 5.000',
        criteria: { minValue: 5000 },
        customerCount: highValue.length,
        averageValue: highValue.reduce((sum, c) => sum + (c.valorTotal || 0), 0) / highValue.length
      });
    }

    if (mediumValue.length > 0) {
      segments.push({
        id: 'medium-value',
        name: 'Médio Valor',
        description: 'Clientes com compras entre R$ 1.000 e R$ 5.000',
        criteria: { minValue: 1000, maxValue: 5000 },
        customerCount: mediumValue.length,
        averageValue: mediumValue.reduce((sum, c) => sum + (c.valorTotal || 0), 0) / mediumValue.length
      });
    }

    if (lowValue.length > 0) {
      segments.push({
        id: 'low-value',
        name: 'Baixo Valor',
        description: 'Clientes com compras abaixo de R$ 1.000',
        criteria: { maxValue: 1000 },
        customerCount: lowValue.length,
        averageValue: lowValue.reduce((sum, c) => sum + (c.valorTotal || 0), 0) / lowValue.length
      });
    }

    return segments;
  }

  /**
   * Busca todos os dados auxiliares
   */
  static async getAllAuxiliaryData(): Promise<AuxiliaryData> {
    try {
      const [
        costCenters,
        paymentMethods,
        productCategories,
        customerSegments
      ] = await Promise.all([
        this.getCostCenters(),
        this.getPaymentMethods(),
        this.getProductCategories(),
        this.getCustomerSegments()
      ]);

      return {
        costCenters,
        paymentMethods,
        productCategories,
        customerSegments,
        lastUpdated: new Date().toISOString()
      };

    } catch (error) {
      console.error('Erro ao buscar dados auxiliares:', error);
      throw error;
    }
  }

  /**
   * Agrupa centros de custo por tipo
   */
  static groupCostCentersByType(costCenters: CostCenter[]): Record<string, CostCenter[]> {
    return costCenters.reduce((groups, center) => {
      const type = center.type;
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(center);
      return groups;
    }, {} as Record<string, CostCenter[]>);
  }

  /**
   * Agrupa formas de pagamento por tipo
   */
  static groupPaymentMethodsByType(paymentMethods: PaymentMethod[]): Record<string, PaymentMethod[]> {
    return paymentMethods.reduce((groups, method) => {
      const type = method.type;
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(method);
      return groups;
    }, {} as Record<string, PaymentMethod[]>);
  }

  /**
   * Agrupa categorias de produtos hierarquicamente
   */
  static groupProductCategoriesHierarchically(categories: ProductCategory[]): {
    root: ProductCategory[];
    children: Record<string, ProductCategory[]>;
  } {
    const root = categories.filter(cat => !cat.parentId);
    const children = categories.reduce((groups, category) => {
      if (category.parentId) {
        if (!groups[category.parentId]) {
          groups[category.parentId] = [];
        }
        groups[category.parentId].push(category);
      }
      return groups;
    }, {} as Record<string, ProductCategory[]>);

    return { root, children };
  }

  /**
   * Filtra segmentos de clientes por critérios
   */
  static filterCustomerSegmentsByCriteria(
    segments: CustomerSegment[],
    criteria: {
      minValue?: number;
      maxValue?: number;
      region?: string;
    }
  ): CustomerSegment[] {
    return segments.filter(segment => {
      if (criteria.minValue && segment.criteria.minValue && segment.criteria.minValue < criteria.minValue) {
        return false;
      }
      if (criteria.maxValue && segment.criteria.maxValue && segment.criteria.maxValue > criteria.maxValue) {
        return false;
      }
      if (criteria.region && segment.criteria.region && !segment.criteria.region.includes(criteria.region)) {
        return false;
      }
      return true;
    });
  }

  // Métodos auxiliares privados

  private static getCachedData(key: string): any {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }

  private static setCachedData(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }


  private static mapCostCenterType(type: string): 'revenue' | 'cost' | 'support' {
    switch (type) {
      case 'revenue': return 'revenue';
      case 'cost': return 'cost';
      case 'support': return 'support';
      default: return 'cost';
    }
  }

  private static mapPaymentMethodType(type: string): 'credit_card' | 'debit_card' | 'pix' | 'bank_transfer' | 'cash' | 'other' {
    switch (type) {
      case 'credit_card': return 'credit_card';
      case 'debit_card': return 'debit_card';
      case 'pix': return 'pix';
      case 'bank_transfer': return 'bank_transfer';
      case 'cash': return 'cash';
      default: return 'other';
    }
  }

  // Dados padrão para casos de erro
  private static getDefaultCostCenters(): CostCenter[] {
    return [
      { id: 'default-1', name: 'Vendas', description: 'Centro de custo padrão', type: 'revenue', isActive: true },
      { id: 'default-2', name: 'Administrativo', description: 'Centro de custo administrativo', type: 'cost', isActive: true }
    ];
  }

  private static getDefaultPaymentMethods(): PaymentMethod[] {
    return [
      { id: 'default-1', name: 'Cartão de Crédito', type: 'credit_card', isActive: true, processingFee: 0.03, averageProcessingTime: 2 },
      { id: 'default-2', name: 'PIX', type: 'pix', isActive: true, processingFee: 0.01, averageProcessingTime: 0.1 }
    ];
  }

  private static getDefaultProductCategories(): ProductCategory[] {
    return [
      { id: 'default-1', name: 'Produtos', description: 'Categoria padrão', isActive: true, productCount: 0, averagePrice: 0 }
    ];
  }

  private static getDefaultCustomerSegments(): CustomerSegment[] {
    return [
      { id: 'default-1', name: 'Geral', description: 'Segmento padrão', criteria: {}, customerCount: 0, averageValue: 0 }
    ];
  }
}

export default CEOAuxiliaryDataService;
