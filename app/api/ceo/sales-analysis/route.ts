/**
 * API: Análise de Vendas CEO - USANDO BetelTecnologiaService COMO FONTE ÚNICA
 * 
 * CORREÇÃO COMPLETA:
 * - ✅ Usa BetelTecnologiaService como fonte única de dados (mesma do Dashboard de Vendas)
 * - ✅ Mantém consistência de valores entre Dashboard de Vendas e Dashboard CEO
 * - ✅ Remove dependência de CEOGestaoClickService
 * - ✅ Usa apenas campos reais da API
 * - ✅ Cálculos baseados em dados reais
 * - ✅ Tratamento robusto de erros
 */

import { NextRequest, NextResponse } from 'next/server';
import { format } from 'date-fns';
import { BetelTecnologiaService } from '@/app/_services/betelTecnologia';

// Configuração para forçar comportamento dinâmico
export const dynamic = "force-dynamic";

/**
 * Estrutura de resposta da análise de vendas
 */
interface SalesAnalysis {
  // Totais
  totalVendas: number;
  totalFaturamento: number;
  ticketMedio: number;
  
  // Vendas por período
  vendasPorPeriodo: Array<{
    periodo: string;
    vendas: number;
    faturamento: number;
    ticketMedio: number;
  }>;
  
  // Vendas por vendedor
  vendasPorVendedor: Array<{
    vendedorId: number;
    vendedorNome: string;
    lojaNome: string;
    vendas: number;
    faturamento: number;
    ticketMedio: number;
  }>;
  
  // Vendas por produto
  vendasPorProduto: Array<{
    produtoId: number;
    produtoNome: string;
    categoria: string;
    quantidadeVendida: number;
    faturamento: number;
    margemLucro: number;
  }>;
  
  // Vendas por cliente
  vendasPorCliente: Array<{
    clienteId: number;
    clienteNome: string;
    vendas: number;
    faturamento: number;
    ticketMedio: number;
    ultimaCompra: string;
  }>;
  
  // Vendas por loja
  vendasPorLoja: Array<{
    lojaId: string | number;
    lojaNome: string;
    vendas: number;
    faturamento: number;
    ticketMedio: number;
  }>;
  
  // Top 5
  topProdutos: Array<any>;
  topClientes: Array<any>;
  
  // Metadados
  lastUpdated: string;
  _metadata: {
    dataSource: 'api' | 'error';
    totalVendasRaw: number;
    totalVendasFiltradas: number;
    statusFiltrados: string[];
    periodo: {
      inicio: string;
      fim: string;
    };
    timestamp: string;
    error?: string;
  };
}

/**
 * GET /api/ceo/sales-analysis
 * 
 * @param request - Request com query params startDate e endDate
 * @returns Análise completa de vendas
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    // Validar parâmetros
    if (!startDate || !endDate) {
      return NextResponse.json(
        {
          erro: 'Parâmetros startDate e endDate são obrigatórios',
          message: 'Formato esperado: ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD'
        },
        { status: 400 }
      );
    }
    
    // Converter datas para objetos Date
    const dataInicio = new Date(startDate);
    const dataFim = new Date(endDate);
    
    console.log(`[CEO Sales Analysis] 🔄 Buscando vendas via BetelTecnologiaService: ${format(dataInicio, 'yyyy-MM-dd')} a ${format(dataFim, 'yyyy-MM-dd')}`);
    
    // =======================================================================
    // BUSCAR VENDAS USANDO BetelTecnologiaService (MESMA FONTE DO DASHBOARD DE VENDAS)
    // =======================================================================
    
    const vendasResult = await BetelTecnologiaService.buscarVendas({
      dataInicio,
      dataFim
    });
    
    if (vendasResult.erro) {
      throw new Error(`Erro ao buscar vendas: ${vendasResult.erro}`);
    }
    
    // As vendas já vêm filtradas por status "Concretizada" e "Em andamento" do BetelTecnologiaService
    const vendasFiltradas = vendasResult.vendas || [];
    
    console.log(`[CEO Sales Analysis] ${vendasFiltradas.length} vendas encontradas (já filtradas por status válido)`);
    
    // Se não houver vendas, retornar estrutura vazia
    if (vendasFiltradas.length === 0) {
      return NextResponse.json({
        totalVendas: 0,
        totalFaturamento: 0,
        ticketMedio: 0,
        vendasPorPeriodo: [],
        vendasPorVendedor: [],
        vendasPorProduto: [],
        vendasPorCliente: [],
        vendasPorLoja: [],
        topProdutos: [],
        topClientes: [],
        lastUpdated: new Date().toISOString(),
        _metadata: {
          dataSource: 'api' as const,
          totalVendasRaw: 0,
          totalVendasFiltradas: 0,
          statusFiltrados: ["Concretizada", "Em andamento"],
          periodo: { inicio: format(dataInicio, 'yyyy-MM-dd'), fim: format(dataFim, 'yyyy-MM-dd') },
          timestamp: new Date().toISOString()
        }
      } as SalesAnalysis);
    }
    
    // =======================================================================
    // CALCULAR TOTAIS REAIS
    // =======================================================================
    
    const totalVendas = vendasFiltradas.length;
    
    // Usar totalValor já calculado pelo BetelTecnologiaService (consistente com Dashboard de Vendas)
    const totalFaturamento = vendasResult.totalValor || vendasFiltradas.reduce((acc, venda) => {
      // valor_total vem como string do BetelVenda
      const valor = parseFloat(String(venda.valor_total || '0'));
      return acc + (isNaN(valor) ? 0 : valor);
    }, 0);
    
    const ticketMedio = totalVendas > 0 ? totalFaturamento / totalVendas : 0;
    
    // =======================================================================
    // AGRUPAR POR VENDEDOR
    // =======================================================================
    
    const vendasPorVendedorMap = new Map<number, any>();
    
    vendasFiltradas.forEach(venda => {
      const vendedorId = venda.vendedor_id || 0;
      const vendedorNome = venda.vendedor_nome || venda.nome_vendedor || 'Vendedor Não Identificado';
      const lojaNome = venda.nome_loja || 'Loja Principal';
      // valor_total vem como string do BetelVenda
      const valor = parseFloat(String(venda.valor_total || '0'));
      const valorNum = isNaN(valor) ? 0 : valor;
      
      if (!vendasPorVendedorMap.has(vendedorId)) {
        vendasPorVendedorMap.set(vendedorId, {
          vendedorId,
          vendedorNome,
          lojaNome,
          vendas: 0,
          faturamento: 0,
          ticketMedio: 0
        });
      }
      
      const vendedor = vendasPorVendedorMap.get(vendedorId)!;
      vendedor.vendas += 1;
      vendedor.faturamento += valorNum;
      vendedor.ticketMedio = vendedor.faturamento / vendedor.vendas;
    });
    
    // =======================================================================
    // AGRUPAR POR PRODUTO
    // =======================================================================
    
    const vendasPorProdutoMap = new Map<number, any>();
    
    vendasFiltradas.forEach(venda => {
      // BetelVenda tem campo 'itens' que é array de BetelItem
      const itens = venda.itens || [];
      itens.forEach(item => {
        const produtoId = item.produto_id || item.id || 0;
        const produtoNome = item.produto || item.descricao || item.nome || 'Produto Sem Nome';
        const categoria = item.categoria || 'Não Categorizado';
        // Campos podem vir como string ou number no BetelItem
        const quantidade = typeof item.quantidade === 'number' ? item.quantidade : parseFloat(String(item.quantidade || '0')) || 0;
        const valorTotal = typeof item.valor_total === 'number' ? item.valor_total : parseFloat(String(item.valor_total || '0')) || 0;
        const valorCusto = typeof item.valor_custo === 'number' ? item.valor_custo : parseFloat(String(item.valor_custo || '0')) || 0;
        
        if (!vendasPorProdutoMap.has(produtoId)) {
          vendasPorProdutoMap.set(produtoId, {
            produtoId,
            produtoNome,
            categoria,
            quantidadeVendida: 0,
            faturamento: 0,
            custoTotal: 0,
            margemLucro: 0
          });
        }
        
        const produto = vendasPorProdutoMap.get(produtoId)!;
        produto.quantidadeVendida += quantidade;
        produto.faturamento += valorTotal;
        
        // Calcular custo total (quantidade * valor_custo)
        if (valorCusto > 0) {
          produto.custoTotal += (valorCusto * quantidade);
        }
      });
    });
    
    // Calcular margem de lucro real para cada produto
    vendasPorProdutoMap.forEach(produto => {
      if (produto.custoTotal > 0 && produto.faturamento > 0) {
        const lucro = produto.faturamento - produto.custoTotal;
        produto.margemLucro = (lucro / produto.faturamento) * 100;
      } else {
        produto.margemLucro = 0; // Sem dados de custo, margem desconhecida
      }
      
      // Arredondar para 2 casas decimais
      produto.margemLucro = Math.round(produto.margemLucro * 100) / 100;
    });
    
    // =======================================================================
    // AGRUPAR POR CLIENTE
    // =======================================================================
    
    const vendasPorClienteMap = new Map<number, any>();
    
    vendasFiltradas.forEach(venda => {
      const clienteId = venda.cliente_id || 0;
      const clienteNome = venda.cliente || 'Cliente Não Identificado';
      // valor_total vem como string do BetelVenda
      const valor = parseFloat(String(venda.valor_total || '0'));
      const valorNum = isNaN(valor) ? 0 : valor;
      const dataVenda = venda.data || venda.data_venda || format(dataFim, 'yyyy-MM-dd');
      
      if (!vendasPorClienteMap.has(clienteId)) {
        vendasPorClienteMap.set(clienteId, {
          clienteId,
          clienteNome,
          vendas: 0,
          faturamento: 0,
          ticketMedio: 0,
          ultimaCompra: dataVenda
        });
      }
      
      const cliente = vendasPorClienteMap.get(clienteId)!;
      cliente.vendas += 1;
      cliente.faturamento += valorNum;
      cliente.ticketMedio = cliente.faturamento / cliente.vendas;
      
      // Atualizar última compra se for mais recente
      if (new Date(dataVenda) > new Date(cliente.ultimaCompra)) {
        cliente.ultimaCompra = dataVenda;
      }
    });
    
    // =======================================================================
    // AGRUPAR POR LOJA
    // =======================================================================
    
    const vendasPorLojaMap = new Map<string, any>();
    
    vendasFiltradas.forEach(venda => {
      const lojaId = venda.loja_id?.toString() || 'principal';
      const lojaNome = venda.nome_loja || 'Loja Principal';
      // valor_total vem como string do BetelVenda
      const valor = parseFloat(String(venda.valor_total || '0'));
      const valorNum = isNaN(valor) ? 0 : valor;
      
      if (!vendasPorLojaMap.has(lojaId)) {
        vendasPorLojaMap.set(lojaId, {
          lojaId,
          lojaNome,
          vendas: 0,
          faturamento: 0,
          ticketMedio: 0
        });
      }
      
      const loja = vendasPorLojaMap.get(lojaId)!;
      loja.vendas += 1;
      loja.faturamento += valorNum;
      loja.ticketMedio = loja.faturamento / loja.vendas;
    });
    
    // =======================================================================
    // CONVERTER MAPS PARA ARRAYS E ORDENAR
    // =======================================================================
    
    const vendasPorVendedor = Array.from(vendasPorVendedorMap.values())
      .sort((a, b) => b.faturamento - a.faturamento);
    
    const vendasPorProduto = Array.from(vendasPorProdutoMap.values())
      .sort((a, b) => b.faturamento - a.faturamento);
    
    const vendasPorCliente = Array.from(vendasPorClienteMap.values())
      .sort((a, b) => b.faturamento - a.faturamento);
    
    const vendasPorLoja = Array.from(vendasPorLojaMap.values())
      .sort((a, b) => b.faturamento - a.faturamento);
    
    // =======================================================================
    // TOP 5
    // =======================================================================
    
    const topProdutos = vendasPorProduto.slice(0, 5);
    const topClientes = vendasPorCliente.slice(0, 5);
    
    // =======================================================================
    // VENDAS POR PERÍODO (resumo do período atual)
    // =======================================================================
    
    const vendasPorPeriodo = [
      {
        periodo: format(new Date(startDate), 'MMM/yyyy'),
        vendas: totalVendas,
        faturamento: Math.round(totalFaturamento),
        ticketMedio: Math.round(ticketMedio * 100) / 100
      }
    ];
    
    // =======================================================================
    // MONTAR RESPOSTA FINAL
    // =======================================================================
    
    const salesAnalysis: SalesAnalysis = {
      totalVendas,
      totalFaturamento: Math.round(totalFaturamento),
      ticketMedio: Math.round(ticketMedio * 100) / 100,
      vendasPorPeriodo,
      vendasPorVendedor,
      vendasPorProduto,
      vendasPorCliente,
      vendasPorLoja,
      topProdutos,
      topClientes,
      lastUpdated: new Date().toISOString(),
      _metadata: {
        dataSource: 'api',
        totalVendasRaw: vendasFiltradas.length, // Todas as vendas retornadas já são filtradas
        totalVendasFiltradas: vendasFiltradas.length,
        statusFiltrados: ["Concretizada", "Em andamento"],
        periodo: {
          inicio: format(dataInicio, 'yyyy-MM-dd'),
          fim: format(dataFim, 'yyyy-MM-dd')
        },
        timestamp: new Date().toISOString()
      }
    };
    
    console.log('[CEO Sales Analysis] ✅ Análise concluída:', {
      totalVendas,
      totalFaturamento: Math.round(totalFaturamento),
      vendedores: vendasPorVendedor.length,
      produtos: vendasPorProduto.length,
      clientes: vendasPorCliente.length,
      lojas: vendasPorLoja.length
    });
    
    return NextResponse.json(salesAnalysis);
    
  } catch (error) {
    console.error('[CEO Sales Analysis] ❌ Erro:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    
    // Retornar erro estruturado
    return NextResponse.json(
      {
        erro: 'Erro ao processar análise de vendas',
        mensagem: errorMessage,
        totalVendas: 0,
        totalFaturamento: 0,
        ticketMedio: 0,
        vendasPorPeriodo: [],
        vendasPorVendedor: [],
        vendasPorProduto: [],
        vendasPorCliente: [],
        vendasPorLoja: [],
        topProdutos: [],
        topClientes: [],
        lastUpdated: new Date().toISOString(),
        _metadata: {
          dataSource: 'error' as const,
          totalVendasRaw: 0,
          totalVendasFiltradas: 0,
          statusFiltrados: ["Concretizada", "Em andamento"],
          periodo: {
            inicio: '',
            fim: ''
          },
          timestamp: new Date().toISOString(),
          error: errorMessage
        }
      } as SalesAnalysis,
      { status: 500 }
    );
  }
}
