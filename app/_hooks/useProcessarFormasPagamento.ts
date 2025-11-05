import { useMemo } from 'react';

// Interface para o resultado do processamento
export interface FormaPagamentoItem {
  formaPagamento: string;
  totalVendas: number;
  totalValor: number;
  percentual: number;
}

// Mapeamento para categorias específicas de forma de pagamento
// Prioriza manter os nomes originais do Gestão Click quando possível
const CATEGORIAS_PAGAMENTO: Record<string, string> = {
  // PIX - C6 (mantém variações do Gestão Click)
  'PIX - C6': 'PIX - C6',
  'PIX C6': 'PIX - C6',
  'PIX C6 IMPORTS': 'PIX C6 IMPORTS', // Mantém nome original do Gestão Click
  'PIX - BB': 'PIX - BB',
  'PIX - STONE': 'PIX - STONE',
  'PIX': 'PIX',
  // CRÉDITO - STONE (mantém variações do Gestão Click)
  'ELO CRÉDITO STONE': 'CRÉDITO - STONE',
  'MASTERCARD CRÉDITO STONE': 'CRÉDITO - STONE',
  'MASTER CRÉDITO': 'CRÉDITO - STONE',
  'VISA CRÉDITO STONE': 'CRÉDITO - STONE',
  'Cartão de Crédito Stone': 'CRÉDITO - STONE',
  'CRÉDITO - Stone': 'CRÉDITO - STONE',
  'CRÉDITO - STONE': 'CRÉDITO - STONE',
  'CRÉDITO - Itaú': 'CRÉDITO - STONE',
  'CRÉDITO - ITAÚ': 'CRÉDITO - STONE',
  'CRÉDITO - Slipay': 'CRÉDITO - STONE',
  'CRÉDITO - SLIPAY': 'CRÉDITO - STONE',
  'Cartão de Crédito': 'CRÉDITO - STONE',
  'Crédito': 'CRÉDITO - STONE',
  // LINK DE PAGAMENTO (mantém nome original do Gestão Click)
  'LINK DE PAGAMENTO - STONE': 'LINK DE PAGAMENTO - STONE', // Mantém nome original do Gestão Click
  'LINK DE PAGAMENTO STONE': 'LINK DE PAGAMENTO - STONE',
  // DÉBITO - STONE
  'DÉBITO - Slipay': 'DÉBITO - STONE',
  'DÉBITO - SLIPAY': 'DÉBITO - STONE',
  'DEBITO - Slipay': 'DÉBITO - STONE',
  'DEBITO - SLIPAY': 'DÉBITO - STONE',
  'DÉBITO - Stone': 'DÉBITO - STONE',
  'DÉBITO - STONE': 'DÉBITO - STONE',
  'DÉBITO - Itaú': 'DÉBITO - STONE',
  'DÉBITO - ITAÚ': 'DÉBITO - STONE',
  'DÉBITO - C6': 'DÉBITO - STONE',
  'Cartão de Débito': 'DÉBITO - STONE',
  'Débito': 'DÉBITO - STONE',
  // ESPÉCIE
  'Dinheiro à Vista': 'ESPÉCIE - BB',
  'Dinheiro': 'ESPÉCIE - BB',
  'Especie': 'ESPÉCIE - BB',
  'ESPÉCIE - BB': 'ESPÉCIE - BB',
  'Moeda': 'ESPÉCIE - BB',
  // BOLETO
  'BOLETO': 'BOLETO - BB',
  'Boleto Bancário': 'BOLETO - BB',
  'Boleto': 'BOLETO - BB',
  'BOLETO - BB': 'BOLETO - BB',
  // OUTROS
  'A COMBINAR': 'A COMBINAR',
  'A Combinar': 'A COMBINAR',
  'A combinar': 'A COMBINAR'
};

// Função para normalizar a forma de pagamento
const normalizarFormaPagamento = (forma: string): string => {
  if (!forma) {
    return 'A COMBINAR';
  }
  
  if (CATEGORIAS_PAGAMENTO[forma]) {
    return CATEGORIAS_PAGAMENTO[forma];
  }
  
  const formaNormalizada = forma.trim();
  
  // Verificar LINK DE PAGAMENTO primeiro (mantém nome original do Gestão Click)
  if (formaNormalizada.toUpperCase().includes('LINK DE PAGAMENTO')) {
    if (formaNormalizada.includes('STONE')) {
      return 'LINK DE PAGAMENTO - STONE';
    }
  }
  
  if (formaNormalizada.includes('PIX')) {
    // PIX C6 IMPORTS - mantém nome original do Gestão Click
    if (formaNormalizada.toUpperCase().includes('PIX C6 IMPORTS') || formaNormalizada.includes('PIX C6 IMPORTS')) {
      return 'PIX C6 IMPORTS';
    } else if (formaNormalizada.includes('C6')) {
      return 'PIX - C6';
    } else if (formaNormalizada.includes('BB')) {
      return 'PIX - BB';
    } else if (formaNormalizada.includes('STONE')) {
      return 'PIX - STONE';
    } else {
      return 'PIX';
    }
  }
  if (formaNormalizada.includes('BOLETO') || formaNormalizada.includes('Boleto')) return 'BOLETO - BB';
  if (formaNormalizada.toLowerCase().includes('dinheiro') || formaNormalizada.toLowerCase().includes('à vista') || 
      formaNormalizada.toLowerCase().includes('especie') || formaNormalizada.toLowerCase().includes('moeda')) return 'ESPÉCIE - BB';
  
  if (formaNormalizada.includes('CRÉDIT') || formaNormalizada.includes('Crédit') || 
      formaNormalizada.includes('CREDIT') || formaNormalizada.includes('Credit')) {
    return 'CRÉDITO - STONE';
  }
  
  if (formaNormalizada.includes('DÉBIT') || formaNormalizada.includes('Débit') ||
      formaNormalizada.includes('DEBIT') || formaNormalizada.includes('Debit')) {
    return 'DÉBITO - STONE';
  }
  
  return 'A COMBINAR';
};

// FUNÇÃO SIMPLIFICADA PARA ENCONTRAR FORMA DE PAGAMENTO
const analiseForenseFormaPagamento = (venda: any): { forma: string; fonte: string; detalhes: any } => {
  // 1. VERIFICAR CAMPOS DIRETOS MAIS PROVÁVEIS
  const camposDiretos = ['forma_pagamento', 'metodo_pagamento', 'forma_pagamento_original', 'tipo_pagamento'];
  
  for (const campo of camposDiretos) {
    if (venda[campo] && typeof venda[campo] === 'string' && venda[campo].trim() !== '') {
      return { forma: venda[campo].trim(), fonte: `campo_direto.${campo}`, detalhes: { campo, valor: venda[campo] } };
    }
  }
  
  // 2. VERIFICAR ARRAY DE PAGAMENTOS (mais provável)
  if (venda.pagamentos && Array.isArray(venda.pagamentos) && venda.pagamentos.length > 0) {
    for (let i = 0; i < venda.pagamentos.length; i++) {
      const pagamento = venda.pagamentos[i];
      
      // Verificar campo direto no pagamento
      if (pagamento.forma_pagamento && typeof pagamento.forma_pagamento === 'string' && pagamento.forma_pagamento.trim() !== '') {
        return { forma: pagamento.forma_pagamento.trim(), fonte: `array.pagamentos[${i}].forma_pagamento`, detalhes: { indice: i, valor: pagamento.forma_pagamento } };
      }
      
      // Verificar objeto pagamento aninhado
      if (pagamento.pagamento && typeof pagamento.pagamento === 'object') {
        const camposPagamento = ['nome_forma_pagamento', 'forma_pagamento', 'tipo_pagamento', 'metodo_pagamento'];
        for (const campo of camposPagamento) {
          if (pagamento.pagamento[campo] && typeof pagamento.pagamento[campo] === 'string' && pagamento.pagamento[campo].trim() !== '') {
            return { forma: pagamento.pagamento[campo].trim(), fonte: `array.pagamentos[${i}].pagamento.${campo}`, detalhes: { indice: i, subcampo: campo, valor: pagamento.pagamento[campo] } };
          }
        }
      }
      
      // Verificar campo nome direto
      if (pagamento.nome && typeof pagamento.nome === 'string' && pagamento.nome.trim() !== '') {
        return { forma: pagamento.nome.trim(), fonte: `array.pagamentos[${i}].nome`, detalhes: { indice: i, valor: pagamento.nome } };
      }
    }
  }
  
  // 3. VERIFICAR OUTROS CAMPOS ESPECÍFICOS
  const outrosCampos = ['payment_method', 'payment_type', 'payment_form', 'pagamento_tipo', 'pagamento_metodo', 'pagamento_forma'];
  
  for (const campo of outrosCampos) {
    if (venda[campo] && venda[campo].toString().trim() !== '') {
      return { forma: venda[campo].toString().trim(), fonte: `campo_especifico.${campo}`, detalhes: { campo, valor: venda[campo] } };
    }
  }
  
  // 4. VERIFICAR METADATA
  if (venda.metadata && typeof venda.metadata === 'object') {
    const camposMeta = Object.keys(venda.metadata).filter(key => 
      key.toLowerCase().includes('pag') || 
      key.toLowerCase().includes('pay') || 
      key.toLowerCase().includes('form') || 
      key.toLowerCase().includes('method')
    );
    
    for (const campo of camposMeta) {
      const valor = venda.metadata[campo];
      if (valor && valor.toString().trim() !== '') {
        return { forma: valor.toString().trim(), fonte: `metadata.${campo}`, detalhes: { campo, valor } };
      }
    }
  }
  
  // 5. VERIFICAR OBSERVAÇÕES E NOTAS
  const camposTexto = ['observacoes', 'notas', 'info_pagamento', 'payment_info', 'transaction_details', 'detalhes_pagamento'];
  
  for (const campo of camposTexto) {
    if (venda[campo] && typeof venda[campo] === 'string' && venda[campo].trim() !== '') {
      const texto = venda[campo].toLowerCase();
      
      // Buscar palavras-chave de formas de pagamento no texto
      const palavrasChave = [
        { palavra: 'pix', resultado: 'PIX' },
        { palavra: 'credito', resultado: 'CRÉDITO' },
        { palavra: 'crédito', resultado: 'CRÉDITO' },
        { palavra: 'debito', resultado: 'DÉBITO' },
        { palavra: 'débito', resultado: 'DÉBITO' },
        { palavra: 'dinheiro', resultado: 'ESPÉCIE' },
        { palavra: 'especie', resultado: 'ESPÉCIE' },
        { palavra: 'boleto', resultado: 'BOLETO' },
        { palavra: 'cartao', resultado: 'CRÉDITO' },
        { palavra: 'cartão', resultado: 'CRÉDITO' }
      ];
      
      for (const palavra of palavrasChave) {
        if (texto.includes(palavra.palavra)) {
          return { forma: palavra.resultado, fonte: `texto.${campo}`, detalhes: { campo, palavra: palavra.palavra, texto: venda[campo] } };
        }
      }
    }
  }
  
  return { forma: 'A COMBINAR', fonte: 'nao_encontrado', detalhes: { motivo: 'Nenhum campo de forma de pagamento identificado' } };
};

// Hook principal para processar formas de pagamento
export const useProcessarFormasPagamento = (vendas: any[]): FormaPagamentoItem[] => {
  return useMemo(() => {
    if (!vendas || !Array.isArray(vendas) || vendas.length === 0) {
      return [];
    }

    // Agrupar vendas por forma de pagamento
    const formasPagamentoMap = new Map<string, { totalVendas: number; totalValor: number }>();
    let valorTotal = 0;
    
    let vendasComValorZero = 0;
    let vendasComValorInvalido = 0;
    
    vendas.forEach((venda: any, index: number) => {
      const valorVenda = typeof venda.valor_total === 'string' 
        ? parseFloat(venda.valor_total) 
        : Number(venda.valor_total) || 0;
      
      if (valorVenda === 0) {
        vendasComValorZero++;
      }
      
      if (isNaN(valorVenda)) {
        vendasComValorInvalido++;
      }
      
      valorTotal += valorVenda;
      
      // Determinar a forma de pagamento da venda usando análise forense
      const resultadoAnalise = analiseForenseFormaPagamento(venda);
      const formaOriginal = resultadoAnalise.forma;
      const formaPagamento = normalizarFormaPagamento(formaOriginal);
      
      // Adicionar à contagem
      if (formasPagamentoMap.has(formaPagamento)) {
        const dadosExistentes = formasPagamentoMap.get(formaPagamento)!;
        formasPagamentoMap.set(formaPagamento, {
          totalVendas: dadosExistentes.totalVendas + 1,
          totalValor: dadosExistentes.totalValor + valorVenda
        });
      } else {
        formasPagamentoMap.set(formaPagamento, {
          totalVendas: 1,
          totalValor: valorVenda
        });
      }
    });
    
    // Converter o Map para um array e calcular percentuais
    const formasPagamentoProcessadas = Array.from(formasPagamentoMap.entries()).map(([formaPagamento, dados]) => ({
      formaPagamento,
      totalVendas: dados.totalVendas,
      totalValor: dados.totalValor,
      percentual: valorTotal > 0 ? (dados.totalValor / valorTotal) * 100 : 0
    }));
    
    // Ordenar por valor total (decrescente)
    formasPagamentoProcessadas.sort((a, b) => b.totalValor - a.totalValor);
    
    return formasPagamentoProcessadas;
  }, [vendas]);
};
