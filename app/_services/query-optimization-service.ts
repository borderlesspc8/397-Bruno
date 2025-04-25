import { Prisma } from "@prisma/client";

/**
 * Serviço para ajudar na otimização de consultas ao banco de dados
 */
export class QueryOptimizationService {
  /**
   * Seleciona apenas os campos necessários para uma consulta de transações
   * Isso reduz a quantidade de dados transferidos e pode melhorar significativamente a performance
   */
  static getTransactionSelectFields(includeDetails: boolean = false): Prisma.TransactionSelect {
    // Select básico para listagens
    const basicSelect: Prisma.TransactionSelect = {
      id: true,
      type: true,
      amount: true,
      date: true,
      name: true,
      description: true,
      category: true,
      walletId: true,
      tags: true,
      metadata: true,
      wallet: {
        select: {
          id: true,
          name: true,
          color: true,
          icon: true,
        }
      }
    };

    // Se for para detalhe de transação, inclui mais campos
    if (includeDetails) {
      return {
        ...basicSelect,
        createdAt: true,
        updatedAt: true,
        categoryObj: {
          select: {
            id: true,
            name: true,
            icon: true,
            color: true,
          }
        },
        attachments: true
      };
    }

    return basicSelect;
  }

  /**
   * Constrói uma cláusula WHERE otimizada para filtros de transações
   */
  static buildTransactionWhereClause(filters: Record<string, any>): Prisma.TransactionWhereInput {
    const {
      userId,
      walletId,
      startDate,
      endDate,
      type,
      category,
      tags,
      search,
      amount,
      dateRange,
      reconciled,
      minAmount,
      maxAmount,
      isReconciled
    } = filters;

    const where: Prisma.TransactionWhereInput = { userId };

    // Adicionar filtros conforme fornecidos
    if (walletId) {
      where.walletId = walletId;
    }

    // Filtro de data
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = startDate;
      if (endDate) where.date.lte = endDate;
    } else if (dateRange) {
      // Implementar lógica para dateRange (último mês, último ano, etc.)
      const now = new Date();
      where.date = {};
      
      switch (dateRange) {
        case "thisMonth":
          where.date.gte = new Date(now.getFullYear(), now.getMonth(), 1);
          where.date.lte = now;
          break;
        case "lastMonth":
          where.date.gte = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          where.date.lte = new Date(now.getFullYear(), now.getMonth(), 0);
          break;
        case "thisYear":
          where.date.gte = new Date(now.getFullYear(), 0, 1);
          where.date.lte = now;
          break;
        case "lastYear":
          where.date.gte = new Date(now.getFullYear() - 1, 0, 1);
          where.date.lte = new Date(now.getFullYear() - 1, 11, 31);
          break;
        // Adicionar outros ranges conforme necessário
      }
    }

    // Filtro de tipo
    if (type) {
      where.type = type;
    }

    // Filtro de categoria
    if (category) {
      where.category = category;
    }

    // Filtro de tags
    if (tags && tags.length > 0) {
      where.tags = {
        hasSome: Array.isArray(tags) ? tags : [tags]
      };
    }

    // Filtro de valor
    if (minAmount !== undefined || maxAmount !== undefined) {
      where.amount = {};
      if (minAmount !== undefined) where.amount.gte = minAmount;
      if (maxAmount !== undefined) where.amount.lte = maxAmount;
    } else if (amount !== undefined) {
      where.amount = amount;
    }

    // Filtro de reconciliação (campo legado)
    if (reconciled !== undefined) {
      where.status = reconciled ? "RECONCILED" : "PENDING";
    }
    
    // Filtro de conciliação (armazenado em metadata)
    if (isReconciled !== undefined) {
      // A conciliação é determinada pela existência de vendas relacionadas
      where.sales = isReconciled 
        ? { some: {} }  // Tem pelo menos uma venda associada
        : { none: {} }; // Não tem vendas associadas
    }

    // Filtro de busca textual
    if (search) {
      // Garantir que search seja sempre uma string
      const searchText = typeof search === 'function' ? '' : String(search);
      
      where.OR = [
        { description: { contains: searchText, mode: 'insensitive' } },
        { category: { contains: searchText, mode: 'insensitive' } }
      ];
      
      // Log para depuração
      console.log('[QUERY_DEBUG] Aplicando filtro de busca:', {
        searchOriginal: search,
        searchText,
        searchType: typeof search
      });
    }

    return where;
  }

  /**
   * Constrói o ordenamento para consultas de transações
   */
  static buildTransactionOrderBy(
    sortField: string = 'date', 
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Prisma.TransactionOrderByWithRelationInput[] {
    const orderBy: Prisma.TransactionOrderByWithRelationInput[] = [];
    
    // Mapeamento de campos para ordenação
    const fieldMap: Record<string, Prisma.TransactionOrderByWithRelationInput> = {
      date: { date: sortOrder },
      amount: { amount: sortOrder },
      category: { category: sortOrder },
      description: { description: sortOrder },
      wallet: { wallet: { name: sortOrder } }
    };
    
    // Adicionar o campo de ordenação selecionado
    if (fieldMap[sortField]) {
      orderBy.push(fieldMap[sortField]);
    } else {
      // Campo padrão se o informado não for reconhecido
      orderBy.push({ date: sortOrder });
    }
    
    // Sempre adicionar um segundo campo de ordenação para consistência
    // quando houver valores iguais no primeiro campo
    if (sortField !== 'date') {
      orderBy.push({ date: 'desc' });
    }

    // Sempre adicionar 'id' como desempate final para garantir ordem consistente
    orderBy.push({ id: 'asc' });
    
    return orderBy;
  }

  /**
   * Constrói os parâmetros de paginação para consultas
   */
  static buildPaginationParams(
    page: number = 1, 
    limit: number = 20, 
    cursor?: string
  ): { skip?: number; take: number; cursor?: any } {
    const paginationParams: { skip?: number; take: number; cursor?: any } = {
      take: limit
    };
    
    // Se tiver cursor, usa paginação baseada em cursor
    if (cursor) {
      paginationParams.cursor = { id: cursor };
      paginationParams.skip = 1; // Pula o próprio cursor
    } 
    // Caso contrário, usa paginação baseada em offset
    else {
      paginationParams.skip = (page - 1) * limit;
    }
    
    return paginationParams;
  }
} 