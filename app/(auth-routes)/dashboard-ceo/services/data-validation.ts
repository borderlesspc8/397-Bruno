// Validadores de dados para o serviço CEO
// Garante que os dados da API Betel estão no formato esperado

export class CEODataValidator {
  /**
   * Valida se um centro de custo tem os campos mínimos necessários
   */
  static validateCentroCusto(centro: any): boolean {
    return centro && typeof centro.id === 'number' && (centro.nome || centro.descricao);
  }

  /**
   * Valida se uma forma de pagamento tem os campos mínimos necessários
   */
  static validateFormaPagamento(forma: any): boolean {
    return forma && typeof forma.id === 'number' && (forma.nome_forma_pagamento || forma.nome);
  }

  /**
   * Valida se uma categoria tem os campos mínimos necessários
   */
  static validateCategoria(categoria: any): boolean {
    return categoria && typeof categoria.id === 'number' && categoria.nome;
  }

  /**
   * Valida se um produto tem os campos mínimos necessários
   */
  static validateProduto(produto: any): boolean {
    return produto && typeof produto.id === 'number' && (produto.nome || produto.descricao);
  }

  /**
   * Valida se um cliente tem os campos mínimos necessários
   */
  static validateCliente(cliente: any): boolean {
    return cliente && typeof cliente.id === 'number' && cliente.nome;
  }

  /**
   * Valida se um vendedor tem os campos mínimos necessários
   */
  static validateVendedor(vendedor: any): boolean {
    return vendedor && typeof vendedor.id === 'number' && vendedor.nome;
  }

  /**
   * Valida se uma loja tem os campos mínimos necessários
   */
  static validateLoja(loja: any): boolean {
    return loja && typeof loja.id === 'number' && loja.nome;
  }

  /**
   * Valida se um canal de venda tem os campos mínimos necessários
   */
  static validateCanalVenda(canal: any): boolean {
    return canal && typeof canal.id === 'number' && canal.nome;
  }

  /**
   * Valida se uma venda tem os campos mínimos necessários
   */
  static validateVenda(venda: any): boolean {
    return venda && typeof venda.id === 'number' && venda.valor_total !== undefined;
  }

  /**
   * Valida se um array não está vazio
   */
  static validateNonEmptyArray(data: any): boolean {
    return Array.isArray(data) && data.length > 0;
  }

  /**
   * Valida se um valor numérico é válido
   */
  static validateNumericValue(value: any): boolean {
    const num = parseFloat(value);
    return !isNaN(num) && isFinite(num);
  }

  /**
   * Valida se uma data é válida
   */
  static validateDate(date: any): boolean {
    if (!date) return false;
    const d = new Date(date);
    return d instanceof Date && !isNaN(d.getTime());
  }
}

