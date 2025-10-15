import { NextRequest, NextResponse } from 'next/server';
import { validateSessionForAPI } from "@/app/_utils/auth";
import { requireVendasAccess } from "@/app/_lib/auth-permissions";
import { GestaoClickClientService } from "@/app/_services/gestao-click-client-service";
import { prisma } from "@/app/_lib/prisma";
import { BetelTecnologiaService } from '@/app/_services/betelTecnologia';
import { parse, format, startOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
// Cache removido para garantir dados em tempo real
import { BetelVenda } from '@/app/_utils/calculoFinanceiro';
import { roundToCents, parseValueSafe, sumWithPrecision } from '@/app/_utils/number-processor';

// Configuração para forçar o comportamento dinâmico
export const dynamic = "force-dynamic";


// Constantes para otimização
const STATUS_VALIDOS = ["Concretizada", "Em andamento"];
// Cache removido - dados sempre em tempo real

// Interface para vendas recebidas da API, estendendo BetelVenda
interface VendaBetel extends BetelVenda {
  desconto_valor?: string | number;
  valor_frete?: string | number;
}

// Funções auxiliares para processamento de dados
function processVendasPorConsultor(vendas: any, funcionarios: any) {
  // Inicializar map para armazenar vendas por vendedor
  const vendasPorVendedor = new Map();
  
  // Preparar dados de funcionários para lookup rápido - otimizado para usar Map
  const funcionariosMap = new Map();
  if (Array.isArray(funcionarios.data)) {
    funcionarios.data.forEach((funcionario: any) => {
      funcionariosMap.set(funcionario.id, {
        id: funcionario.id,
        nome: funcionario.nome || "Nome não disponível",
        cargo: funcionario.cargo_nome || "Cargo não especificado"
      });
    });
  }
  
  // Processar vendas - Filtrar apenas para status válidos
  if (vendas && Array.isArray(vendas.data)) {
    // Usar forEach em vez de map para evitar criar um array intermediário
    vendas.data.forEach((venda: any) => {
      if (!venda.vendedor_id || !STATUS_VALIDOS.includes(venda.nome_situacao)) {
        return;
      }
      
      const vendedorId = venda.vendedor_id;
      const valorVenda = parseFloat(venda.valor_liquido || venda.valor_total || "0");
      
      if (!vendasPorVendedor.has(vendedorId)) {
        // Usar o nome_vendedor diretamente da venda, se disponível
        const nomeVendedor = venda.nome_vendedor || 
                             (funcionariosMap.get(vendedorId)?.nome || `Vendedor ${vendedorId}`);
        
        vendasPorVendedor.set(vendedorId, {
          id: vendedorId,
          nome: nomeVendedor,
          nome_vendedor: nomeVendedor,
          cargo: funcionariosMap.get(vendedorId)?.cargo || "Não especificado",
          valorTotal: 0,
          quantidadeVendas: 0
        });
      }
      
      const vendedorInfo = vendasPorVendedor.get(vendedorId);
      vendedorInfo.valorTotal += valorVenda;
      vendedorInfo.quantidadeVendas += 1;
    });
  }
  
  // Converter para array, filtrar e ordenar - otimizado para uma única operação de array
  return Array.from(vendasPorVendedor.values())
    .filter(vendedor => vendedor.valorTotal > 0)
    .sort((a, b) => b.valorTotal - a.valorTotal);
}

function processQuantidadeVendas(vendas: any) {
  // Inicializar contadores
  let totalVendas = 0;
  let valorTotal = 0;
  
  // Inicializar contadores por dia
  const vendasPorDia = new Map();
  
  if (vendas && Array.isArray(vendas.data)) {
    // Processar vendas em uma única passagem para melhor performance
    vendas.data.forEach((venda: any) => {
      // Verificar se o status da venda está nos status válidos
      if (!STATUS_VALIDOS.includes(venda.nome_situacao)) return;
      
      totalVendas += 1;
      const valor = parseFloat(venda.valor_liquido || venda.valor_total || "0");
      valorTotal += valor;
      
      // Agrupar por data
      if (venda.data_venda) {
        const dataVenda = venda.data_venda.split('T')[0]; // Formato YYYY-MM-DD
        
        if (!vendasPorDia.has(dataVenda)) {
          vendasPorDia.set(dataVenda, {
            data: dataVenda,
            quantidade: 0,
            valor: 0
          });
        }
        
        const diaDados = vendasPorDia.get(dataVenda);
        diaDados.quantidade += 1;
        diaDados.valor += valor;
      }
    });
  }
  
  // Converter para array e ordenar por data
  const vendasDiarias = Array.from(vendasPorDia.values())
    .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
  
  return {
    total: totalVendas,
    valor: valorTotal,
    porDia: vendasDiarias
  };
}

function processProdutosMaisVendidos(vendas: any) {
  // Inicializar map para contagem de produtos
  const produtosContagem = new Map();
  
  if (vendas && Array.isArray(vendas.data)) {
    // Manter contagem em uma única passagem para melhor performance
    vendas.data.forEach((venda: any) => {
      // Verificar se o status da venda está nos status válidos
      if (!STATUS_VALIDOS.includes(venda.nome_situacao)) return;
      
      // Verificar se venda tem produtos
      if (venda && venda.produtos && Array.isArray(venda.produtos)) {
        venda.produtos.forEach((produto: any) => {
          if (!produto) return; // Ignorar produto indefinido
          
          const produtoId = produto.id || produto.produto_id || `unknown-${Math.random()}`;
          const nomeProduto = produto.descricao || produto.nome || "Produto sem nome";
          const quantidade = parseInt(produto.quantidade || "1", 10);
          const valorUnitario = parseFloat(produto.valor_unitario || produto.preco_unitario || "0");
          const valorTotal = quantidade * valorUnitario;
          
          if (!produtosContagem.has(produtoId)) {
            produtosContagem.set(produtoId, {
              id: produtoId,
              nome: nomeProduto,
              quantidade: 0,
              valorTotal: 0
            });
          }
          
          const produtoInfo = produtosContagem.get(produtoId);
          produtoInfo.quantidade += quantidade;
          produtoInfo.valorTotal += valorTotal;
        });
      }
    });
  }
  
  // Converter para array e ordenar por quantidade (decrescente)
  const result = Array.from(produtosContagem.values())
    .sort((a, b) => b.quantidade - a.quantidade)
    .slice(0, 10); // Retornar apenas os 10 mais vendidos
  
  // Adicionar estrutura para compatibilidade
  return result.length > 0 ? [{ produtos: result }] : [];
}

// Função de preload removida - dados sempre em tempo real

export async function GET(request: NextRequest) {
  try {
    // Verificar permissões de acesso
    const { success, error } = await requireVendasAccess(request);
    if (!success) {
      return NextResponse.json(
        { 
          erro: 'Acesso negado',
          mensagem: error || 'Você não tem permissão para acessar esta rota',
          vendas: [],
          totalVendas: 0,
          totalValor: 0
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const dataInicio = searchParams.get('dataInicio');
    const dataFim = searchParams.get('dataFim');
    const debug = searchParams.get('debug') === 'true';
    const forceUpdate = searchParams.get('forceUpdate') === 'true';
    
    // Novo parâmetro para filtrar por situações
    const situacoesParam = searchParams.get('situacoes');
    const situacoesFiltro = situacoesParam ? situacoesParam.split(',').filter(Boolean) : [];

    if (!dataInicio || !dataFim) {
      return NextResponse.json(
        { 
          erro: 'Parâmetros dataInicio e dataFim são obrigatórios',
          vendas: [],
          totalVendas: 0,
          totalValor: 0
        },
        { status: 400 }
      );
    }

    console.log(`Buscando vendas de ${dataInicio} até ${dataFim}${forceUpdate ? ' (ignorando cache)' : ''}`);

    // Extrair as partes da data no formato YYYY-MM-DD diretamente da string de entrada
    // para evitar problemas de conversão de timezone
    let formattedDataInicio: string;
    let formattedDataFim: string;

    // Tentar realizar o parsing das datas
    try {
      if (dataInicio.includes('-') && dataInicio.length === 10) {
        // Formato já é YYYY-MM-DD
        formattedDataInicio = dataInicio;
      } else {
        // Tentar converter de outro formato para YYYY-MM-DD
        const dataInicioObj = parse(dataInicio, 'dd/MM/yyyy', new Date(), { locale: ptBR });
        if (isNaN(dataInicioObj.getTime())) {
          throw new Error('Formato de data inicial inválido');
        }
        formattedDataInicio = format(dataInicioObj, 'yyyy-MM-dd');
      }

      if (dataFim.includes('-') && dataFim.length === 10) {
        // Formato já é YYYY-MM-DD
        formattedDataFim = dataFim;
      } else {
        // Tentar converter de outro formato para YYYY-MM-DD
        const dataFimObj = parse(dataFim, 'dd/MM/yyyy', new Date(), { locale: ptBR });
        if (isNaN(dataFimObj.getTime())) {
          throw new Error('Formato de data final inválido');
        }
        formattedDataFim = format(dataFimObj, 'yyyy-MM-dd');
      }
    } catch (error) {
      console.error('Erro ao processar datas:', error);
      return NextResponse.json(
        { 
          erro: 'Formato de data inválido. Use o formato ISO (YYYY-MM-DD) ou dd/MM/yyyy',
          vendas: [],
          totalVendas: 0,
          totalValor: 0
        },
        { status: 400 }
      );
    }

    // Criar objetos Date com as datas formatadas (apenas para o serviço da API)
    const dataInicioObj = new Date(`${formattedDataInicio}T00:00:00.000Z`);
    const dataFimObj = new Date(`${formattedDataFim}T23:59:59.999Z`);
    
    // Criar strings ISO para a API
    const dataInicioISO = formattedDataInicio;
    const dataFimISO = formattedDataFim;
    
    if (debug) {
      console.log('Datas processadas:', {
        dataInicio: formattedDataInicio,
        dataFim: formattedDataFim,
        dataInicioObj: dataInicioObj.toISOString(),
        dataFimObj: dataFimObj.toISOString()
      });
    }

    // Cache removido - buscando dados diretamente para garantir tempo real
    console.log('Buscando vendas da API externa (sem cache)...');
    
    const resultado = await (async () => {
        console.log('Buscando vendas da API externa...');

        // Buscar vendas
        const vendas = await BetelTecnologiaService.buscarVendas({
          dataInicio: dataInicioObj,
          dataFim: dataFimObj
        });

        // Filtrar vendas pelo período exato
        vendas.vendas = vendas.vendas.filter(venda => {
          const dataVenda = venda.data.split('T')[0];
          return dataVenda >= formattedDataInicio && dataVenda <= formattedDataFim;
        });

        // Aplicar filtro de situações se especificado
        if (situacoesFiltro.length > 0) {
          vendas.vendas = vendas.vendas.filter(venda => {
            const situacaoVenda = venda.nome_situacao || '';
            
            // Mapear situações da API para os filtros
            const situacaoNormalizada = situacaoVenda.toLowerCase().trim();
            
            return situacoesFiltro.some(filtro => {
              const filtroNormalizado = filtro.toLowerCase().replace('_', ' ');
              
              // Verificações específicas para cada situação
              if (filtro === 'concretizada' || filtro === 'aprovada') {
                return situacaoNormalizada.includes('concretizada') || 
                       situacaoNormalizada.includes('confirmada') ||
                       situacaoNormalizada.includes('aprovada');
              } else if (filtro === 'em_andamento') {
                return situacaoNormalizada.includes('andamento') || 
                       situacaoNormalizada.includes('processando') ||
                       situacaoNormalizada.includes('em andamento');
              } else if (filtro === 'cancelada' || filtro === 'rejeitada') {
                return situacaoNormalizada.includes('cancelada') || 
                       situacaoNormalizada.includes('rejeitada') ||
                       situacaoNormalizada.includes('cancelado');
              } else if (filtro === 'pendente') {
                return situacaoNormalizada.includes('pendente') || 
                       situacaoNormalizada.includes('aguardando');
              }
              
              // Fallback: comparação direta
              return situacaoNormalizada.includes(filtroNormalizado);
            });
          });
          
          console.log(`Vendas após filtro de situações [${situacoesFiltro.join(', ')}]: ${vendas.vendas.length}`);
        }

        // Recalcular totais após filtragem
        vendas.totalVendas = vendas.vendas.length;
        vendas.totalValor = sumWithPrecision(vendas.vendas.map(venda => venda.valor_total));

        // Preload removido - dados sempre em tempo real

        console.log(`Total de vendas recebidas da API: ${vendas.vendas.length}`);
        
        if (debug) {
          // Dados para debug
          const statusCount = new Map();
          vendas.vendas.forEach(venda => {
            const status = venda.nome_situacao || 'Sem status';
            statusCount.set(status, (statusCount.get(status) || 0) + 1);
          });
          
          console.log('Distribuição de status nas vendas:');
          statusCount.forEach((count, status) => {
            console.log(`- ${status}: ${count} vendas`);
          });
        }

        // Calcular informações financeiras adicionais
        let totalCusto = 0;
        let totalDescontos = 0;
        let totalFretes = 0;

        vendas.vendas.forEach((venda: any) => {
          // Processar custo
          totalCusto += parseValueSafe(venda.valor_custo);
          
          // Processar descontos
          totalDescontos += parseValueSafe(venda.desconto_valor);
          
          // Processar fretes
          totalFretes += parseValueSafe(venda.valor_frete);
        });

        // Calcular lucro com precisão
        totalCusto = roundToCents(totalCusto);
        totalDescontos = roundToCents(totalDescontos);
        totalFretes = roundToCents(totalFretes);
        
        const lucroTotal = roundToCents(vendas.totalValor - totalCusto - totalDescontos);
        const margemLucro = vendas.totalValor > 0 ? roundToCents((lucroTotal / vendas.totalValor) * 100) : 0;

        if (debug) {
          console.log('Cálculos financeiros:', {
            totalValor: vendas.totalValor,
            totalCusto,
            totalDescontos,
            totalFretes,
            lucroTotal,
            margemLucro: margemLucro.toFixed(2) + '%'
          });
        }

        // Retornar dados filtrados e calculados com precisão
        return {
          vendas: vendas.vendas,
          totalVendas: vendas.totalVendas,
          totalValor: vendas.totalValor,
          financeiro: {
            custo: totalCusto,
            descontos: totalDescontos,
            fretes: totalFretes,
            lucro: lucroTotal,
            margemLucro
          }
        };
    })();

    // CORREÇÃO: Não aplicar filtro novamente, usar os dados do resultado diretamente
    // Isso evita reintroduzir vendas que possam ter sido filtradas anteriormente
    const vendasFiltradas = resultado.vendas;
    const totalVendasFiltradas = vendasFiltradas.length;
    const totalValorFiltrado = resultado.totalValor;
    const financeiro = resultado.financeiro;

    if (debug) {
      console.log(`Totais finais: ${totalVendasFiltradas} vendas, R$ ${totalValorFiltrado}`);
      console.log('Financeiro final:', financeiro);
    }

    // Retornar os dados filtrados
    return NextResponse.json({
      vendas: vendasFiltradas,
      totalVendas: totalVendasFiltradas,
      totalValor: totalValorFiltrado,
      financeiro: financeiro,
      debug: debug ? {
        dataInicioFormatada: formattedDataInicio,
        dataFimFormatada: formattedDataFim,
        statusValidos: STATUS_VALIDOS,
        totalAntesFiltragem: resultado.vendas.length,
        totalAposFiltragem: totalVendasFiltradas
      } : undefined
    });
  } catch (error) {
    console.error('Erro ao buscar dados do dashboard:', error);
    return NextResponse.json(
      { 
        erro: 'Erro ao processar requisição', 
        mensagem: error instanceof Error ? error.message : 'Erro desconhecido',
        vendas: [],
        totalVendas: 0,
        totalValor: 0
      },
      { status: 500 }
    );
  }
} 
