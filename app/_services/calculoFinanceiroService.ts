import { calcularLucroVendas } from '@/app/_utils/calculoFinanceiro';
import { BetelTecnologiaService } from './betelTecnologia';

/**
 * Serviço para cálculos financeiros da aplicação
 */
export class CalculoFinanceiroService {
  /**
   * Calcula a somatória de todos os valores de custo e faturamento das vendas no período informado
   * @param dataInicio Data de início do período
   * @param dataFim Data de fim do período
   * @returns Objeto com valores totais de custo, faturamento, lucro e informações estatísticas
   */
  static async calcularSomatoriaCustos(dataInicio: Date, dataFim: Date): Promise<{
    valorTotalCusto: number;
    valorTotalFaturamento: number;
    valorTotalDescontos: number;
    valorTotalFretes: number;
    lucroTotal: number;
    margemLucroPercentual: number;
    totalVendasComCusto: number;
    percentualVendasComCusto: number;
    totalVendas: number;
  }> {
    try {
      // Buscar vendas da API
      const vendasResult = await BetelTecnologiaService.buscarVendas({
        dataInicio,
        dataFim
      });

      let valorTotalCusto = 0;
      let valorTotalDescontos = 0;
      let valorTotalFretes = 0;
      let totalVendasComCusto = 0;
      const totalVendas = vendasResult.vendas.length;
      const valorTotalFaturamento = vendasResult.totalValor;

      // Calcular a somatória dos valores de custo, descontos e fretes
      for (const venda of vendasResult.vendas) {
        // Processar custos
        if (venda.valor_custo) {
          valorTotalCusto += parseFloat(venda.valor_custo);
          totalVendasComCusto++;
        }

        // Processar descontos (se disponíveis na venda)
        if (venda.desconto) {
          valorTotalDescontos += parseFloat(typeof venda.desconto === 'string' ? venda.desconto : venda.desconto.toString());
        }

        // Processar fretes (se disponíveis na venda)
        if (venda.frete) {
          valorTotalFretes += parseFloat(typeof venda.frete === 'string' ? venda.frete : venda.frete.toString());
        }

        // Buscar itens de frete e desconto nas vendas
        if (venda.itens && Array.isArray(venda.itens)) {
          venda.itens.forEach(item => {
            // Verificar se o item é um registro de desconto
            if (item.produto && item.produto.toLowerCase().includes('desconto')) {
              const valorDesconto = Math.abs(parseFloat(item.valor_total));
              valorTotalDescontos += valorDesconto;
            }

            // Verificar se o item é um registro de frete
            if (item.produto && item.produto.toLowerCase().includes('frete')) {
              valorTotalFretes += parseFloat(item.valor_total);
            }
          });
        }
      }

      // Calcular o lucro (faturamento - custo - descontos)
      const lucroTotal = valorTotalFaturamento - valorTotalCusto - valorTotalDescontos;

      // Calcular a margem de lucro
      const margemLucroPercentual = valorTotalFaturamento > 0 
        ? parseFloat(((lucroTotal / valorTotalFaturamento) * 100).toFixed(2))
        : 0;

      // Calcular percentual de vendas com informação de custo
      const percentualVendasComCusto = totalVendas > 0 
        ? parseFloat(((totalVendasComCusto / totalVendas) * 100).toFixed(2))
        : 0;

      return {
        valorTotalCusto,
        valorTotalFaturamento,
        valorTotalDescontos,
        valorTotalFretes,
        lucroTotal,
        margemLucroPercentual,
        totalVendasComCusto,
        percentualVendasComCusto,
        totalVendas
      };
    } catch (error) {
      console.error('Erro ao calcular somatória de custos:', error);
      return {
        valorTotalCusto: 0,
        valorTotalFaturamento: 0,
        valorTotalDescontos: 0,
        valorTotalFretes: 0,
        lucroTotal: 0,
        margemLucroPercentual: 0,
        totalVendasComCusto: 0,
        percentualVendasComCusto: 0,
        totalVendas: 0
      };
    }
  }

  /**
   * Calcula o lucro total das vendas no período
   * @param dataInicio Data de início
   * @param dataFim Data de fim
   * @returns Resultado do cálculo de lucro
   */
  static async calcularLucroTotal(dataInicio: Date, dataFim: Date) {
    try {
      // Buscar vendas da API
      const vendasResult = await BetelTecnologiaService.buscarVendas({
        dataInicio,
        dataFim
      });

      // Calcular o lucro usando a função utilitária
      const resultadoLucro = calcularLucroVendas(vendasResult.vendas);
      
      return resultadoLucro;
    } catch (error) {
      console.error('Erro ao calcular lucro total:', error);
      return {
        lucro: 0,
        faturamento: 0,
        custo: 0,
        faturamentoTotal: 0,
        vendasComCusto: 0,
        totalVendas: 0,
        margemLucro: 0,
        temDadosSuficientes: false
      };
    }
  }
} 