import { NextRequest, NextResponse } from 'next/server';
import { processarDatasURL } from '@/app/_utils/dates';
import { BetelTecnologiaService } from '@/app/_services/betelTecnologia';

// Configuração para forçar o comportamento dinâmico
export const dynamic = "force-dynamic";


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

    console.log(`Buscando vendas por forma de pagamento no período de ${dataInicio} até ${dataFim}`);

    // Buscar todas as vendas no período
    const vendasResult = await BetelTecnologiaService.buscarVendas({
      dataInicio: resultadoDatas.dataInicio!,
      dataFim: resultadoDatas.dataFim!
    });

    // Mapeamento para categorias específicas de forma de pagamento
    const CATEGORIAS_PAGAMENTO: Record<string, string> = {
      // Categoria: Dinheiro à Vista
      'Dinheiro à Vista': 'Dinheiro à Vista',
      
      // Categoria: Boleto
      'BOLETO': 'Boleto',
      'Boleto Bancário': 'Boleto',
      
      // Categoria: PIX
      'PIX': 'PIX',
      'PIX C6': 'PIX',
      'PIX - C6': 'PIX',
      
      // Categoria: Crédito
      'ELO CRÉDITO STONE': 'Crédito',
      'MASTERCARD CRÉDITO STONE': 'Crédito',
      'MASTER CRÉDITO': 'Crédito',
      'VISA CRÉDITO STONE': 'Crédito',
      'Cartão de Crédito Stone': 'Crédito',
      'CRÉDITO - Stone': 'Crédito',
      'CRÉDITO - STONE': 'Crédito',
      'CRÉDITO - Itaú': 'Crédito',
      'CRÉDITO - ITAÚ': 'Crédito',
      'CRÉDITO - Slipay': 'Crédito',
      'CRÉDITO - SLIPAY': 'Crédito',
      
      // Categoria: Débito
      'DÉBITO - Slipay': 'Débito',
      'DÉBITO - SLIPAY': 'Débito',
      'DEBITO - Slipay': 'Débito',
      'DEBITO - SLIPAY': 'Débito',
      'DÉBITO - Stone': 'Débito',
      'DÉBITO - STONE': 'Débito',
      'DÉBITO - Itaú': 'Débito',
      'DÉBITO - ITAÚ': 'Débito',
      'DÉBITO - C6': 'Débito',
      
      // Link de Pagamento
      'LINK DE PAGAMENTO - STONE': 'Link de Pagamento',
      'Link de Pagamento - Stone': 'Link de Pagamento'
    };

    // Função para normalizar a forma de pagamento
    const normalizarFormaPagamento = (forma: string): string => {
      if (!forma) return 'Outros';
      
      // Verificar se a forma está no mapeamento exato
      if (CATEGORIAS_PAGAMENTO[forma]) {
        return CATEGORIAS_PAGAMENTO[forma];
      }
      
      // Verificar de forma mais ampla para casos não mapeados exatamente
      const formaNormalizada = forma.trim();
      
      if (formaNormalizada.includes('PIX')) return 'PIX';
      if (formaNormalizada.includes('BOLETO') || formaNormalizada.includes('Boleto')) return 'Boleto';
      if (formaNormalizada.toLowerCase().includes('dinheiro') || formaNormalizada.toLowerCase().includes('à vista')) return 'Dinheiro à Vista';
      
      if (formaNormalizada.includes('CRÉDIT') || formaNormalizada.includes('Crédit') || 
          formaNormalizada.includes('CREDIT') || formaNormalizada.includes('Credit')) return 'Crédito';
      
      if (formaNormalizada.includes('DÉBIT') || formaNormalizada.includes('Débit') ||
          formaNormalizada.includes('DEBIT') || formaNormalizada.includes('Debit')) return 'Débito';
      
      if (formaNormalizada.includes('LINK DE PAGAMENTO') || formaNormalizada.includes('Link de Pagamento')) return 'Link de Pagamento';
      
      // Se não corresponder a nenhuma das categorias, retorna como Outros
      return 'Outros';
    };

    // Agrupar vendas por forma de pagamento
    const formasPagamentoMap = new Map<string, { totalVendas: number; totalValor: number }>();
    let valorTotal = 0;
    
    vendasResult.vendas.forEach((venda: any) => {
      // Processa todos os pagamentos da venda
      if (venda.pagamentos && Array.isArray(venda.pagamentos) && venda.pagamentos.length > 0) {
        venda.pagamentos.forEach((pagamentoItem: any) => {
          const pagamento = pagamentoItem.pagamento;
          if (!pagamento) return;
          
          // Extrair e normalizar a forma de pagamento
          const formaPagamentoOriginal = pagamento.nome_forma_pagamento || 'Outros';
          const formaPagamento = normalizarFormaPagamento(formaPagamentoOriginal);
          
          // Converter o valor para número
          const valorPagamento = typeof pagamento.valor === 'string' 
            ? parseFloat(pagamento.valor) 
            : Number(pagamento.valor) || 0;
          
          valorTotal += valorPagamento;
          
          console.log(`Pagamento: ${formaPagamentoOriginal} -> ${formaPagamento}, Valor: ${valorPagamento}`);
          
          // Adicionar à contagem
          if (formasPagamentoMap.has(formaPagamento)) {
            const dadosExistentes = formasPagamentoMap.get(formaPagamento)!;
            formasPagamentoMap.set(formaPagamento, {
              totalVendas: dadosExistentes.totalVendas + 1,
              totalValor: dadosExistentes.totalValor + valorPagamento
            });
          } else {
            formasPagamentoMap.set(formaPagamento, {
              totalVendas: 1,
              totalValor: valorPagamento
            });
          }
        });
      } else {
        // Caso não tenha pagamentos detalhados, usar o valor total e método principal
        // Extrair e normalizar a forma de pagamento
        const formaPagamentoOriginal = venda.forma_pagamento || venda.metodo_pagamento || 'Outros';
        const formaPagamento = normalizarFormaPagamento(formaPagamentoOriginal);
        
        // Converter o valor para número
        const valorVenda = typeof venda.valor_total === 'string' 
          ? parseFloat(venda.valor_total) 
          : Number(venda.valor_total) || 0;
        
        valorTotal += valorVenda;
        
        console.log(`Venda sem pagamentos detalhados: ${formaPagamentoOriginal} -> ${formaPagamento}, Valor: ${valorVenda}`);
        
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
    
    console.log(`Processadas ${formasPagamento.length} formas de pagamento no período`);
    console.log(`Formas de pagamento encontradas: ${formasPagamento.map(f => f.formaPagamento).join(', ')}`);

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
