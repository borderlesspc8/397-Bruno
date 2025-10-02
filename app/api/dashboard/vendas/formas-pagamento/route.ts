import { NextRequest, NextResponse } from 'next/server';
import { processarDatasURL } from '@/app/_utils/dates';
import { BetelTecnologiaService } from '@/app/_services/betelTecnologia';

// Configuração para forçar o comportamento dinâmico
export const dynamic = "force-dynamic";

// Constantes para otimização - mesmas da API principal de vendas
const STATUS_VALIDOS = ["Concretizada", "Em andamento"];


/**
 * @api {get} /api/dashboard/vendas/formas-pagamento Buscar vendas por forma de pagamento
 * @apiDescription Endpoint para buscar vendas agrupadas por forma de pagamento no período
 * 
 * @apiParam {String} dataInicio Data inicial no formato ISO ou dd/MM/yyyy
 * @apiParam {String} dataFim Data final no formato ISO ou dd/MM/yyyy
 * 
 * @apiSuccess {Object[]} formasPagamento Lista de vendas agrupadas por forma de pagamento
 * @apiSuccess {String} formasPagamento.formaPagamento Nome da forma de pagamento
 * @apiSuccess {Number} formasPagamento.totalVendas Total de vendas com esta forma de pagamento
 * @apiSuccess {Number} formasPagamento.totalValor Valor total das vendas com esta forma de pagamento
 * @apiSuccess {Number} formasPagamento.percentual Percentual do valor total que esta forma representa
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const dataInicio = searchParams.get('dataInicio');
    const dataFim = searchParams.get('dataFim');
    const forceUpdate = searchParams.get('forceUpdate') === 'true';

    // Validar e processar parâmetros de data
    const resultadoDatas = processarDatasURL(dataInicio, dataFim);
    
    // Se houve erro no processamento das datas
    if (!resultadoDatas.success) {
      return NextResponse.json(
        { 
          erro: resultadoDatas.error,
          formasPagamento: []
        },
        { status: 400 }
      );
    }

    console.log(`Buscando vendas por forma de pagamento no período de ${dataInicio} até ${dataFim}${forceUpdate ? ' (forçando atualização)' : ''}`);
    console.log(`Datas recebidas: dataInicio=${dataInicio}, dataFim=${dataFim}`);
    console.log(`Datas processadas: dataInicio=${resultadoDatas.dataInicio?.toISOString()}, dataFim=${resultadoDatas.dataFim?.toISOString()}`);

    // Buscar todas as vendas no período
    const vendasResult = await BetelTecnologiaService.buscarVendas({
      dataInicio: resultadoDatas.dataInicio!,
      dataFim: resultadoDatas.dataFim!
    });

    console.log(`Total de vendas recebidas da API: ${vendasResult.vendas.length}`);
    
    // Calcular valor total usando o mesmo critério da API principal para comparação
    const valorTotalAPI = vendasResult.vendas
      .filter(venda => STATUS_VALIDOS.includes(venda.nome_situacao || ''))
      .reduce((total, venda) => total + parseFloat(venda.valor_total || '0'), 0);
    
    console.log(`Valor total calculado (mesmo critério da API principal): R$ ${valorTotalAPI.toFixed(2)}`);

    // Mapeamento para categorias específicas de forma de pagamento - usando exatamente os rótulos do Gestão Click
    const CATEGORIAS_PAGAMENTO: Record<string, string> = {
      // PIX - C6
      'PIX': 'PIX - C6',
      'PIX C6': 'PIX - C6',
      'PIX - C6': 'PIX - C6',
      
      // CRÉDITO - STONE
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
      
      // ESPÉCIE - BB
      'Dinheiro à Vista': 'ESPÉCIE - BB',
      'Dinheiro': 'ESPÉCIE - BB',
      'Especie': 'ESPÉCIE - BB',
      'ESPÉCIE - BB': 'ESPÉCIE - BB',
      'Moeda': 'ESPÉCIE - BB',
      
      // LINK DE PAGAMENTO - STONE
      'LINK DE PAGAMENTO - STONE': 'LINK DE PAGAMENTO - STONE',
      'Link de Pagamento - Stone': 'LINK DE PAGAMENTO - STONE',
      'Link de Pagamento': 'LINK DE PAGAMENTO - STONE',
      
      // CHEQUE
      'CHEQUE': 'CHEQUE',
      'Cheque': 'CHEQUE',
      'CHEQUE - BB': 'CHEQUE',
      'CHEQUE - STONE': 'CHEQUE',
      
      // BOLETO - BB
      'BOLETO': 'BOLETO - BB',
      'Boleto Bancário': 'BOLETO - BB',
      'Boleto': 'BOLETO - BB',
      'BOLETO - BB': 'BOLETO - BB',
      
      // A COMBINAR
      'A COMBINAR': 'A COMBINAR',
      'A Combinar': 'A COMBINAR',
      'A combinar': 'A COMBINAR'
    };

    // Função para normalizar a forma de pagamento - usando exatamente os rótulos do Gestão Click
    const normalizarFormaPagamento = (forma: string): string => {
      if (!forma) return 'A COMBINAR';
      
      // Verificar se a forma está no mapeamento exato
      if (CATEGORIAS_PAGAMENTO[forma]) {
        return CATEGORIAS_PAGAMENTO[forma];
      }
      
      // Verificar de forma mais ampla para casos não mapeados exatamente
      const formaNormalizada = forma.trim();
      
      if (formaNormalizada.includes('PIX')) return 'PIX - C6';
      if (formaNormalizada.includes('BOLETO') || formaNormalizada.includes('Boleto')) return 'BOLETO - BB';
      if (formaNormalizada.toLowerCase().includes('dinheiro') || formaNormalizada.toLowerCase().includes('à vista') || 
          formaNormalizada.toLowerCase().includes('especie') || formaNormalizada.toLowerCase().includes('moeda')) return 'ESPÉCIE - BB';
      
      if (formaNormalizada.includes('CRÉDIT') || formaNormalizada.includes('Crédit') || 
          formaNormalizada.includes('CREDIT') || formaNormalizada.includes('Credit')) return 'CRÉDITO - STONE';
      
      if (formaNormalizada.includes('DÉBIT') || formaNormalizada.includes('Débit') ||
          formaNormalizada.includes('DEBIT') || formaNormalizada.includes('Debit')) return 'DÉBITO - STONE';
      
      if (formaNormalizada.includes('CHEQUE') || formaNormalizada.includes('Cheque')) return 'CHEQUE';
      
      if (formaNormalizada.includes('LINK DE PAGAMENTO') || formaNormalizada.includes('Link de Pagamento')) return 'LINK DE PAGAMENTO - STONE';
      
      // Se não corresponder a nenhuma das categorias, retorna como A COMBINAR
      return 'A COMBINAR';
    };

    // Agrupar vendas por forma de pagamento - usando exatamente a mesma lógica da API principal
    const formasPagamentoMap = new Map<string, { totalVendas: number; totalValor: number }>();
    let valorTotal = 0;
    let vendasProcessadas = 0;
    let vendasFiltradasCount = 0;
    
    // Filtrar vendas exatamente como a API principal faz
    // Primeiro: filtrar por data (mesmo que a API principal)
    const formattedDataInicio = resultadoDatas.dataInicio!.toISOString().split('T')[0];
    const formattedDataFim = resultadoDatas.dataFim!.toISOString().split('T')[0];
    
    const vendasFiltradasPorData = vendasResult.vendas.filter(venda => {
      const dataVenda = venda.data.split('T')[0];
      return dataVenda >= formattedDataInicio && dataVenda <= formattedDataFim;
    });
    
    // Segundo: filtrar por status (mesmo que a API principal)
    const vendasFiltradas = vendasFiltradasPorData.filter((venda: any) => {
      vendasProcessadas++;
      
      // Filtrar apenas vendas com status válidos (mesmo filtro da API principal)
      if (!STATUS_VALIDOS.includes(venda.nome_situacao)) {
        vendasFiltradasCount++;
        return false;
      }
      
      return true;
    });
    
    // Processar vendas filtradas
    vendasFiltradas.forEach((venda: any) => {
      // Usar o valor total da venda (mesmo critério da API principal)
      const valorVenda = typeof venda.valor_total === 'string' 
        ? parseFloat(venda.valor_total) 
        : Number(venda.valor_total) || 0;
      
      valorTotal += valorVenda;
      
      // Determinar a forma de pagamento da venda
      let formaPagamento = 'Outros';
      
      // Primeiro, tentar usar a forma de pagamento principal da venda
      if (venda.forma_pagamento || venda.metodo_pagamento) {
        formaPagamento = normalizarFormaPagamento(venda.forma_pagamento || venda.metodo_pagamento || 'Outros');
      } else if (venda.pagamentos && Array.isArray(venda.pagamentos) && venda.pagamentos.length > 0) {
        // Se não há forma principal, usar a do primeiro pagamento
        const primeiroPagamento = venda.pagamentos[0]?.pagamento;
        if (primeiroPagamento?.nome_forma_pagamento) {
          formaPagamento = normalizarFormaPagamento(primeiroPagamento.nome_forma_pagamento);
        }
      }
      
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
    const formasPagamento = Array.from(formasPagamentoMap.entries()).map(([formaPagamento, dados]) => ({
      formaPagamento,
      totalVendas: dados.totalVendas,
      totalValor: dados.totalValor,
      percentual: valorTotal > 0 ? (dados.totalValor / valorTotal) * 100 : 0
    }));
    
    // Ordenar por valor total (decrescente)
    formasPagamento.sort((a, b) => b.totalValor - a.totalValor);
    
    console.log(`Vendas processadas: ${vendasProcessadas}, Vendas filtradas (status inválido): ${vendasFiltradasCount}, Vendas válidas: ${vendasProcessadas - vendasFiltradasCount}`);
    console.log(`Processadas ${formasPagamento.length} formas de pagamento no período`);
    console.log(`Formas de pagamento encontradas: ${formasPagamento.map(f => f.formaPagamento).join(', ')}`);
    console.log(`Valor total das formas de pagamento: R$ ${valorTotal.toFixed(2)}`);
    console.log(`Diferença entre APIs: R$ ${(valorTotal - valorTotalAPI).toFixed(2)} (${valorTotal > valorTotalAPI ? 'formas-pagamento maior' : 'API principal maior'})`);
    
    // Log detalhado para debug
    if (Math.abs(valorTotal - valorTotalAPI) > 0.01) {
      console.log('=== DEBUG: Investigando diferença ===');
      console.log(`Valor total API principal: R$ ${valorTotalAPI.toFixed(2)}`);
      console.log(`Valor total formas pagamento: R$ ${valorTotal.toFixed(2)}`);
      console.log(`Diferença absoluta: R$ ${Math.abs(valorTotal - valorTotalAPI).toFixed(2)}`);
      
      // Verificar se há vendas com valores diferentes
      const vendasComDiferenca = vendasResult.vendas
        .filter(venda => STATUS_VALIDOS.includes(venda.nome_situacao || ''))
        .map(venda => {
          const valorVenda = parseFloat(venda.valor_total || '0');
          return { id: venda.id, valor: valorVenda, status: venda.nome_situacao };
        })
        .filter(venda => venda.valor > 0);
      
      console.log(`Total de vendas válidas encontradas: ${vendasComDiferenca.length}`);
      console.log(`Soma das vendas individuais: R$ ${vendasComDiferenca.reduce((sum, v) => sum + v.valor, 0).toFixed(2)}`);
    }

    // Retornar resultados
    return NextResponse.json({
      formasPagamento
    });
  } catch (error) {
    console.error('Erro ao processar requisição de formas de pagamento:', error);
    return NextResponse.json(
      { 
        erro: `Erro interno ao processar requisição: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        formasPagamento: []
      },
      { status: 500 }
    );
  }
} 
