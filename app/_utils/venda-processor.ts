/**
 * Utilitários para processamento de dados de vendas
 * Este arquivo centraliza as funções de processamento de dados de vendas
 * para garantir consistência entre diferentes componentes
 */

// Interfaces para tipagem
export interface Pagamento {
  forma_pagamento: string;
  nome?: string;
  parcelas: number;
  valor: number;
  data?: string;
  data_vencimento?: string;
  dataVencimento?: string;
  formaPagamento?: string;
  forma_pagamento_id?: string;
  plano_conta?: string;
  nome_plano_conta?: string;
  nome_forma_pagamento?: string;
}

export interface Produto {
  nome_produto?: string;
  nome?: string;
  produto?: string;
  quantidade: number;
  qtd?: number;
  valor_unitario?: number;
  precoUnitario?: number;
  valorUnitario?: number;
  preco_unitario?: number;
  valor_venda?: number | string;
  valor_total?: number | string;
  valorTotal?: number | string;
  total?: number | string;
  unidade?: string;
  sigla_unidade?: string;
  desconto?: number | string;
  desconto_valor?: number | string;
  desconto_porcentagem?: number | string;
  tipo_desconto?: string;
  detalhes?: string;
}

export interface VendaProcessada {
  id: string | number;
  cliente?: string;
  cliente_id?: string | number;
  nome_cliente?: string;
  vendedor_nome?: string;
  nome_vendedor?: string;
  valor_total: number;
  data?: Date | string;
  data_inclusao?: Date | string;
  prazo_entrega?: Date | string;
  nome_situacao?: string;
  situacao_descricao?: string;
  nome_canal_venda?: string;
  nome_loja?: string;
  condicao_pagamento?: string;
  tecnico_id?: string | number;
  nome_tecnico?: string;
  observacoes_interna?: string;
  pagamentos: Pagamento[];
  produtos: Produto[];
  [key: string]: any; // Para propriedades adicionais
}

/**
 * Converte um valor para número, tratando diferentes formatos
 * @param valor - Valor a ser convertido
 * @param valorPadrao - Valor padrão caso a conversão falhe
 * @returns Número convertido ou valor padrão
 */
export function converterParaNumero(valor: any, valorPadrao: number = 0): number {
  if (valor === null || valor === undefined) return valorPadrao;
  
  if (typeof valor === 'number') return valor;
  
  if (typeof valor === 'string') {
    // Trata strings vazias
    if (valor.trim() === '') return valorPadrao;
    
    try {
      // Para valores no formato brasileiro, precisamos ter cuidado com separadores
      // Remover qualquer caractere que não seja dígito, ponto ou vírgula
      let valorLimpo = valor.replace(/[^\d.,]/g, '');
      
      // Verificar se estamos lidando com um valor no formato brasileiro (1.234,56)
      const formatoBrasileiro = /^\d{1,3}(\.\d{3})+(,\d+)?$/.test(valorLimpo);
      const temVirgula = valorLimpo.includes(',');
      
      if (formatoBrasileiro || temVirgula) {
        // Formato brasileiro: remover pontos e substituir vírgula por ponto
        valorLimpo = valorLimpo.replace(/\./g, '').replace(',', '.');
      }
      
      // Converter para número
      const valorNumerico = parseFloat(valorLimpo);
      
      if (isNaN(valorNumerico)) {
        console.warn(`Conversão de valor falhou para: ${valor}. Usando valor padrão.`);
        return valorPadrao;
      }
      
      return valorNumerico;
    } catch (erro) {
      console.warn(`Erro ao converter valor: ${valor}`, erro);
      return valorPadrao;
    }
  }
  
  // Se o valor for um objeto, tenta usar toString() antes de desistir
  if (typeof valor === 'object' && valor !== null) {
    try {
      // Tenta conversão recursiva usando toString
      const valorString = valor.toString();
      if (valorString !== '[object Object]') {
        return converterParaNumero(valorString, valorPadrao);
      }
    } catch (e) {
      // Ignora erros na tentativa
    }
  }
  
  return valorPadrao;
}

/**
 * Processa um objeto para renderização segura
 * @param obj - Objeto a ser processado
 * @returns Versão processada para renderização
 */
export function processarParaRenderizacao(obj: any): any {
  if (obj === null || obj === undefined) {
    return "";
  }
  
  if (typeof obj === 'object') {
    if (obj instanceof Date) {
      return obj.toLocaleDateString('pt-BR');
    }
    
    if (Array.isArray(obj)) {
      return obj.map((item: any) => processarParaRenderizacao(item));
    }
    
    return JSON.stringify(obj);
  }
  
  return obj;
}

/**
 * Processa os pagamentos de uma venda
 * @param pagamentos - Array ou objeto de pagamentos
 * @param valorTotal - Valor total da venda (usado como fallback)
 * @returns Array processado de pagamentos
 */
export function processarPagamentos(pagamentos: any, valorTotal: any = 0): Pagamento[] {
  if (!pagamentos) {
    // Caso não tenha pagamentos, cria um padrão
    return [{ 
      forma_pagamento: "Não especificado", 
      parcelas: 1, 
      valor: converterParaNumero(valorTotal) 
    }];
  }
  
  try {
    let pagamentosArray: any[] = pagamentos;
    
    // Se for string JSON, tenta fazer o parse
    if (typeof pagamentos === 'string') {
      try {
        pagamentosArray = JSON.parse(pagamentos);
      } catch (e) {
        console.warn("Erro ao parsear JSON de pagamentos:", e);
        return [{ 
          forma_pagamento: "Não especificado", 
          parcelas: 1, 
          valor: converterParaNumero(valorTotal)
        }];
      }
    }
    
    // Garante que pagamentos é um array
    if (!Array.isArray(pagamentosArray)) {
      // Se for um objeto único, converte para array
      if (typeof pagamentosArray === 'object' && pagamentosArray !== null) {
        pagamentosArray = [pagamentosArray];
      } else {
        pagamentosArray = [];
      }
    }
    
    // Se o array estiver vazio, adiciona um pagamento padrão
    if (pagamentosArray.length === 0) {
      return [{ 
        forma_pagamento: "Não especificado", 
        parcelas: 1, 
        valor: converterParaNumero(valorTotal) 
      }];
    }
    
    // Verificação adicional para casos onde a API retorna um array de itens vazios
    // ou com valores inválidos - vamos validar cada item antes de processar
    const pagamentosValidos = pagamentosArray.filter(pagamento => {
      // Verifica se o item é um objeto não nulo
      if (!pagamento || typeof pagamento !== 'object') {
        return false;
      }
      
      // Se for um objeto aninhado, verifica se tem o objeto interno
      if (pagamento.pagamento && typeof pagamento.pagamento === 'object') {
        return true;
      }
      
      // Verifica se tem pelo menos uma das propriedades esperadas
      return pagamento.valor !== undefined || 
             pagamento.forma_pagamento !== undefined || 
             pagamento.nome_forma_pagamento !== undefined ||
             pagamento.formaPagamento !== undefined ||
             pagamento.nome !== undefined;
    });
    
    // Se não há pagamentos válidos após a filtragem, usa o fallback
    if (pagamentosValidos.length === 0) {
      return [{ 
        forma_pagamento: "Não especificado", 
        parcelas: 1, 
        valor: converterParaNumero(valorTotal) 
      }];
    }
    
    // Processa cada pagamento para garantir campos obrigatórios
    return pagamentosValidos.map((pagamento: any) => {
      // Extrair o objeto de pagamento real (pode estar aninhado)
      const pagamentoReal = pagamento.pagamento || pagamento;

      // Criar objeto pagamento com valores padrão
      const pagamentoProcessado: Pagamento = {
        forma_pagamento: "Não especificado",
        parcelas: 1,
        valor: 0
      };
      
      // Processar campos específicos esperados
      pagamentoProcessado.forma_pagamento = typeof pagamentoReal.forma_pagamento === 'string' && pagamentoReal.forma_pagamento.trim() !== ''
        ? pagamentoReal.forma_pagamento 
        : typeof pagamentoReal.nome_forma_pagamento === 'string' && pagamentoReal.nome_forma_pagamento.trim() !== ''
          ? pagamentoReal.nome_forma_pagamento
          : typeof pagamentoReal.formaPagamento === 'string' && pagamentoReal.formaPagamento.trim() !== ''
            ? pagamentoReal.formaPagamento
            : typeof pagamentoReal.nome === 'string' && pagamentoReal.nome.trim() !== ''
              ? pagamentoReal.nome
              : typeof pagamentoReal.forma_pagamento_id === 'string' && pagamentoReal.forma_pagamento_id.trim() !== ''
                ? pagamentoReal.forma_pagamento_id
                : "Não especificado";
          
      pagamentoProcessado.parcelas = typeof pagamentoReal.parcelas === 'number' 
        ? pagamentoReal.parcelas 
        : typeof pagamentoReal.parcelas === 'string' && !isNaN(Number(pagamentoReal.parcelas))
          ? Number(pagamentoReal.parcelas)
          : 1;
          
      // Certifica-se de que o valor seja processado corretamente
      const valorRaw = pagamentoReal.valor !== undefined ? pagamentoReal.valor : 
                       pagamentoReal.total !== undefined ? pagamentoReal.total :
                       pagamentoReal.valorTotal !== undefined ? pagamentoReal.valorTotal : 0;
                       
      pagamentoProcessado.valor = converterParaNumero(valorRaw);
      
      // Verificação adicional para garantir que o valor não seja zero quando há um valor total na venda
      // Isso ocorre quando a API retorna pagamentos incorretos
      if (pagamentoProcessado.valor === 0 && pagamentosValidos.length === 1 && valorTotal > 0) {
        pagamentoProcessado.valor = converterParaNumero(valorTotal);
      }
      
      // Preservar os campos originais para uso no componente
      if (pagamentoReal.data_vencimento) pagamentoProcessado.data_vencimento = pagamentoReal.data_vencimento;
      if (pagamentoReal.dataVencimento) pagamentoProcessado.dataVencimento = pagamentoReal.dataVencimento;
      if (pagamentoReal.data) pagamentoProcessado.data = pagamentoReal.data;
      if (pagamentoReal.nome_plano_conta) pagamentoProcessado.nome_plano_conta = pagamentoReal.nome_plano_conta;
      if (pagamentoReal.plano_conta) pagamentoProcessado.plano_conta = pagamentoReal.plano_conta;
      if (pagamentoReal.forma_pagamento_id) pagamentoProcessado.forma_pagamento_id = pagamentoReal.forma_pagamento_id;
      if (pagamentoReal.nome_forma_pagamento) pagamentoProcessado.nome_forma_pagamento = pagamentoReal.nome_forma_pagamento;
      if (pagamentoReal.formaPagamento) pagamentoProcessado.formaPagamento = pagamentoReal.formaPagamento;
          
      // Retornar apenas o objeto com campos processados
      return pagamentoProcessado;
    });
  } catch (erro) {
    console.error("Erro ao processar pagamentos:", erro);
    // Em caso de erro, retorna um pagamento com o valor total
    return [{ 
      forma_pagamento: "Não especificado", 
      parcelas: 1, 
      valor: converterParaNumero(valorTotal) 
    }];
  }
}

/**
 * Processa os produtos de uma venda
 * @param produtos - Array ou objeto de produtos ou itens
 * @returns Array processado de produtos
 */
export function processarProdutos(produtos: any): Produto[] {
  if (!produtos) {
    return [];
  }
  
  try {
    let produtosArray = produtos;
    
    // Se for string JSON, tenta fazer o parse
    if (typeof produtos === 'string') {
      try {
        produtosArray = JSON.parse(produtos);
      } catch (e) {
        console.warn("Erro ao parsear JSON de produtos:", e);
        return [];
      }
    }
    
    // Garante que produtos é um array
    if (!Array.isArray(produtosArray)) {
      if (typeof produtosArray === 'object' && produtosArray !== null) {
        produtosArray = [produtosArray];
      } else {
        produtosArray = [];
      }
    }
    
    // Se não há produtos definidos, retorna um array vazio
    if (produtosArray.length === 0) {
      return [];
    }
    
    // Processa cada produto para garantir campos obrigatórios
    return produtosArray.map((produto: any) => {
      // Verificar se é um produto aninhado (item.produto)
      const produtoReal = produto.produto || produto;
      
      // Criar um novo objeto processado para o produto
      const produtoProcessado: Produto = {
        quantidade: 1,
      };
      
      // Extrair propriedades específicas com tratamento de tipo rigoroso
      produtoProcessado.nome_produto = typeof produtoReal.nome_produto === 'string' && produtoReal.nome_produto.trim() !== ''
        ? produtoReal.nome_produto 
        : typeof produtoReal.produtoNome === 'string' && produtoReal.produtoNome.trim() !== ''
          ? produtoReal.produtoNome
          : typeof produtoReal.nome === 'string' && produtoReal.nome.trim() !== ''
            ? produtoReal.nome 
            : typeof produtoReal.produto === 'string' && produtoReal.produto.trim() !== ''
              ? produtoReal.produto
              : "Produto não especificado";
            
      produtoProcessado.quantidade = converterParaNumero(produtoReal.quantidade || produtoReal.qtd, 1);
      produtoProcessado.qtd = produtoProcessado.quantidade;
            
      produtoProcessado.valor_unitario = typeof produtoReal.valor_unitario === 'number' 
        ? produtoReal.valor_unitario 
        : typeof produtoReal.precoUnitario === 'number'
          ? produtoReal.precoUnitario
          : typeof produtoReal.valorUnitario === 'number'
            ? produtoReal.valorUnitario
            : typeof produtoReal.preco_unitario === 'number'
              ? produtoReal.preco_unitario
              : converterParaNumero(
                  produtoReal.valor_venda || 
                  produtoReal.valor_unitario || 
                  produtoReal.precoUnitario || 
                  produtoReal.valorUnitario || 
                  produtoReal.preco_unitario || 
                  0
                );
                
      produtoProcessado.valor_venda = produtoProcessado.valor_unitario;
      produtoProcessado.precoUnitario = produtoProcessado.valor_unitario;
      produtoProcessado.valorUnitario = produtoProcessado.valor_unitario;
      produtoProcessado.preco_unitario = produtoProcessado.valor_unitario;
            
      produtoProcessado.valor_total = typeof produtoReal.valor_total === 'number' 
        ? produtoReal.valor_total 
        : typeof produtoReal.total === 'number'
          ? produtoReal.total
          : typeof produtoReal.valorTotal === 'number'
            ? produtoReal.valorTotal
            : converterParaNumero(produtoReal.valor_total || produtoReal.total || produtoReal.valorTotal || 0);
      
      produtoProcessado.total = produtoProcessado.valor_total;
      produtoProcessado.valorTotal = produtoProcessado.valor_total;
      
      // Se não houver valor total, calcular com base na quantidade e valor unitário
      if (!produtoProcessado.valor_total) {
        produtoProcessado.valor_total = produtoProcessado.quantidade * (produtoProcessado.valor_unitario || 0);
        produtoProcessado.total = produtoProcessado.valor_total;
        produtoProcessado.valorTotal = produtoProcessado.valor_total;
      }
      
      // Adicionar outros campos úteis para exibição
      if (produtoReal.sigla_unidade) produtoProcessado.sigla_unidade = produtoReal.sigla_unidade;
      if (produtoReal.unidade) produtoProcessado.unidade = produtoReal.unidade;
      if (produtoReal.detalhes) produtoProcessado.detalhes = produtoReal.detalhes;
      if (produtoReal.desconto) produtoProcessado.desconto = produtoReal.desconto;
      if (produtoReal.desconto_valor) produtoProcessado.desconto_valor = produtoReal.desconto_valor;
      if (produtoReal.desconto_porcentagem) produtoProcessado.desconto_porcentagem = produtoReal.desconto_porcentagem;
      if (produtoReal.tipo_desconto) produtoProcessado.tipo_desconto = produtoReal.tipo_desconto;
            
      // Apenas retornar objeto com campos processados
      return produtoProcessado;
    });
  } catch (erro) {
    console.error("Erro ao processar produtos:", erro);
    return [];
  }
}

/**
 * Processa uma venda completa
 * @param venda - Objeto de venda a ser processado
 * @returns Objeto processado da venda
 */
export function processarVenda(venda: any): VendaProcessada | null {
  if (!venda) return null;
  
  try {
    // Criar cópia profunda do objeto para evitar modificações no original
    const vendaCopia = JSON.parse(JSON.stringify(venda));
    const vendaProcessada: VendaProcessada = { 
      ...vendaCopia, 
      pagamentos: [],
      produtos: [],
      valor_total: 0
    };
    
    // Log para depuração
    console.log('Processando venda:', JSON.stringify({
      id: venda.id,
      codigo: venda.codigo,
      temPagamentos: Array.isArray(venda.pagamentos) ? venda.pagamentos.length : typeof venda.pagamentos,
      formatoPagamentos: venda.pagamentos ? typeof venda.pagamentos : 'undefined'
    }));
    
    // Garantir valor total com formato correto
    vendaProcessada.valor_total = converterParaNumero(venda.valor_total);
    
    // Processar pagamentos
    vendaProcessada.pagamentos = processarPagamentos(
      venda.pagamentos, 
      vendaProcessada.valor_total
    );
    
    // Log dos pagamentos processados para depuração
    console.log('Pagamentos processados:', JSON.stringify(vendaProcessada.pagamentos));
    
    // Processar produtos
    vendaProcessada.produtos = processarProdutos(
      venda.produtos || venda.itens
    );
    
    // Verificação adicional: se o valor total dos produtos for diferente do valor total da venda
    // e houver apenas um pagamento não especificado, ajustar o valor do pagamento
    const valorTotalProdutos = vendaProcessada.produtos.reduce(
      (total, produto) => total + (typeof produto.valor_total === 'number' ? produto.valor_total : 0), 
      0
    );
    
    if (Math.abs(valorTotalProdutos - vendaProcessada.valor_total) < 0.01 && 
        vendaProcessada.pagamentos.length === 1 &&
        vendaProcessada.pagamentos[0].forma_pagamento === "Não especificado") {
      // O valor total dos produtos bate com o valor total da venda, mas o pagamento não está especificado
      // Este é um caso comum quando a API não retorna detalhes de pagamento corretos
      vendaProcessada.pagamentos[0].valor = valorTotalProdutos;
    }
    
    // Garantir que campos complexos sejam processados
    Object.keys(vendaProcessada).forEach((key: string) => {
      if (typeof vendaProcessada[key] === 'object' && 
          vendaProcessada[key] !== null && 
          !Array.isArray(vendaProcessada[key])) {
        if (!(vendaProcessada[key] instanceof Date)) {
          vendaProcessada[key] = processarParaRenderizacao(vendaProcessada[key]);
        }
      }
    });
    
    return vendaProcessada;
  } catch (erro) {
    console.error("Erro ao processar dados da venda:", erro);
    return null;
  }
} 