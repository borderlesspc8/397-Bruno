/**
 * Utilitários para cálculos financeiros na aplicação
 * 
 * Este módulo contém funções utilitárias para cálculos financeiros, como:
 * - Conversão segura de valores para números
 * - Cálculo de lucro a partir de vendas
 * - Cálculo de variações percentuais
 */

/**
 * Interface para representar um item de venda
 */
export interface BetelItem {
  produto_id: number;
  produto: string;
  quantidade: string;
  valor_unitario: string;
  valor_total: string;
  valor_custo?: string;
}

/**
 * Interface para representar uma venda
 */
export interface BetelVenda {
  id: number;
  cliente: string;
  cliente_id: number;
  valor_total: string;
  data_inclusao: string;
  vendedor_id?: number;
  vendedor_nome?: string;
  nome_vendedor?: string;
  loja_id?: string | number;
  nome_loja?: string;
  valor_custo?: string;
  desconto?: string | number;
  frete?: string | number;
  itens: BetelItem[];
}

/**
 * Resultado do cálculo do lucro
 */
export interface ResultadoLucro {
  lucro: number;
  faturamento: number;
  custo: number;
  descontos: number;
  fretes: number;
  faturamentoTotal: number;
  vendasComCusto: number;
  totalVendas: number;
  margemLucro: number;
  temDadosSuficientes: boolean;
}

/**
 * Converte qualquer valor para um número seguro
 * @param valor Valor a ser convertido
 * @returns Número válido ou 0 se o valor for inválido
 */
export function parseValorSeguro(valor: any): number {
  if (typeof valor === 'number') return valor;
  if (!valor) return 0;
  const parsed = parseFloat(String(valor).replace(',', '.'));
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Calcula o lucro a partir de uma lista de vendas
 * Usa apenas vendas que tenham informações reais de custo
 * 
 * @param vendas Lista de vendas com dados de valor_total e valor_custo
 * @returns Objeto com informações de lucro e estatísticas relacionadas
 */
export function calcularLucroVendas(vendas: BetelVenda[]): ResultadoLucro {
  if (!vendas || !Array.isArray(vendas) || vendas.length === 0) {
    return {
      lucro: 0,
      faturamento: 0,
      custo: 0,
      descontos: 0,
      fretes: 0,
      faturamentoTotal: 0,
      vendasComCusto: 0,
      totalVendas: 0,
      margemLucro: 0,
      temDadosSuficientes: false
    };
  }

  // Valores acumulados
  let valorCustoTotal = 0;
  let valorDescontosTotal = 0;
  let valorFretesTotal = 0;
  let valorFaturamentoComCusto = 0;
  let vendasComCusto = 0;
  let faturamentoTotal = 0;

  // Processar cada venda
  vendas.forEach(venda => {
    const valorTotal = parseValorSeguro(venda.valor_total);
    faturamentoTotal += valorTotal;
    
    let custoDaVenda = 0;
    let descontosDaVenda = 0;
    let fretesDaVenda = 0;
    let temCusto = false;
    
    // Verificar se a venda possui valor_custo
    if (venda.valor_custo) {
      custoDaVenda = parseValorSeguro(venda.valor_custo);
      temCusto = true;
    } else if (venda.itens && Array.isArray(venda.itens)) {
      // Se não tem na venda, buscar nos itens
      venda.itens.forEach(item => {
        if (item.valor_custo) {
          custoDaVenda += parseValorSeguro(item.valor_custo) * 
                          parseValorSeguro(item.quantidade || '1');
          temCusto = true;
        }
      });
    }
    
    // Processar descontos
    if (venda.desconto) {
      descontosDaVenda = parseValorSeguro(venda.desconto);
    }
    
    // Processar itens de desconto e frete
    if (venda.itens && Array.isArray(venda.itens)) {
      venda.itens.forEach(item => {
        // Verificar se o item é um registro de desconto
        if (item.produto && item.produto.toLowerCase().includes('desconto')) {
          descontosDaVenda += Math.abs(parseValorSeguro(item.valor_total));
        }
        
        // Verificar se o item é um registro de frete
        if (item.produto && item.produto.toLowerCase().includes('frete')) {
          fretesDaVenda += parseValorSeguro(item.valor_total);
        }
      });
    }
    
    // Processar fretes
    if (venda.frete) {
      fretesDaVenda = parseValorSeguro(venda.frete);
    }
    
    // Acumular descontos e fretes
    valorDescontosTotal += descontosDaVenda;
    valorFretesTotal += fretesDaVenda;
    
    // Só considerar vendas que tenham informação de custo real
    if (temCusto) {
      valorCustoTotal += custoDaVenda;
      valorFaturamentoComCusto += valorTotal;
      vendasComCusto++;
    }
  });

  // Calcular lucro e margem
  const lucro = parseFloat((valorFaturamentoComCusto - valorCustoTotal - valorDescontosTotal).toFixed(2));
  const margemLucro = valorFaturamentoComCusto > 0 
    ? parseFloat(((lucro / valorFaturamentoComCusto) * 100).toFixed(2)) 
    : 0;

  return {
    lucro,
    faturamento: valorFaturamentoComCusto,
    custo: valorCustoTotal,
    descontos: valorDescontosTotal,
    fretes: valorFretesTotal,
    faturamentoTotal,
    vendasComCusto,
    totalVendas: vendas.length,
    margemLucro,
    temDadosSuficientes: vendasComCusto > 0
  };
}

/**
 * Calcula a variação percentual entre dois valores
 * @param atual Valor atual
 * @param anterior Valor anterior para comparação
 * @returns Variação percentual ou undefined se o valor anterior for zero
 */
export function calcularVariacaoPercentual(atual: number, anterior: number): number | undefined {
  if (anterior === 0) return undefined;
  return parseFloat((((atual - anterior) / anterior) * 100).toFixed(2));
} 
