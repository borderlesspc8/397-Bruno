import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/_lib/auth";
import { GestaoClickClientService } from "@/app/_services/gestao-click-client-service";
import { prisma } from "@/app/_lib/prisma";
import { BetelTecnologiaService } from '@/app/_services/betelTecnologia';
import { parse, format, startOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getCachedData, CachePrefix, preloadCache } from '@/app/_services/cache';
import { BetelVenda } from '@/app/_utils/calculoFinanceiro';

// Configuração para forçar o comportamento dinâmico
export const dynamic = "force-dynamic";


// Constantes para otimização
const STATUS_VALIDOS = ["Concretizada", "Em andamento"];
const CACHE_TTL_VENDAS = 15 * 60 * 1000; // 15 minutos

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

// Função para fazer processamento pesado em background
function preloadRelatedData(dataInicio: string, dataFim: string) {
  // Pré-carregar dados de vendedores
  const vendedoresKey = `${CachePrefix.VENDEDORES}${dataInicio}:${dataFim}`;
  preloadCache(vendedoresKey, async () => {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    
    // Iniciar a busca de vendedores para este período
    return await BetelTecnologiaService.buscarVendedores({
      dataInicio: new Date(dataInicio),
      dataFim: new Date(dataFim)
    });
  }, 'low');
  
  // Pré-carregar dados de produtos
  const produtosKey = `${CachePrefix.PRODUTOS}${dataInicio}:${dataFim}`;
  preloadCache(produtosKey, async () => {
    // Iniciar a busca de produtos para este período
    return await BetelTecnologiaService.buscarProdutosVendidos({
      dataInicio: new Date(dataInicio),
      dataFim: new Date(dataFim)
    });
  }, 'low');
}

export async function GET(request: NextRequest) {
  try {
    // Ativar debug apenas se parâmetro ?debug=true estiver presente
    const debug = request.nextUrl.searchParams.get('debug') === 'true';
    
    // Forçar atualização do cache se o parâmetro nocache estiver presente
    const forceUpdate = request.nextUrl.searchParams.has('nocache');
    
    // Parâmetros obrigatórios
    const dataInicio = request.nextUrl.searchParams.get('dataInicio');
    const dataFim = request.nextUrl.searchParams.get('dataFim');
    
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
    const dataInicioISO = `${formattedDataInicio}T00:00:00.000Z`;
    const dataFimISO = `${formattedDataFim}T23:59:59.999Z`;
    
    if (debug) {
      console.log('Datas processadas para a API:', {
        dataInicio: dataInicioISO,
        dataFim: dataFimISO,
        formattedDataInicio,
        formattedDataFim
      });
    }

    const cacheKey = `${CachePrefix.DASHBOARD}vendas:${formattedDataInicio}:${formattedDataFim}:v5`; // Versão atualizada do cache

    // Usar a versão aprimorada do serviço de cache (ignorando cache se forceUpdate for true)
    const resultado = await getCachedData(
      cacheKey,
      async () => {
        console.log('Buscando vendas da API externa...');

        // Buscar vendas
        const vendas = await BetelTecnologiaService.buscarVendas({
          dataInicio: dataInicioObj,
          dataFim: dataFimObj
        });

        // Iniciar o preload de dados relacionados em background
        preloadRelatedData(formattedDataInicio, formattedDataFim);

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

        // Filtrar as vendas para garantir que apenas as com status válidos e ESTRITAMENTE dentro do período sejam incluídas
        const vendasFiltradas = vendas.vendas.filter(venda => {
          // Verificar se tem status válido
          const temStatusValido = STATUS_VALIDOS.includes(venda.nome_situacao || '');
          
          // CORREÇÃO: Verificar se a data está ESTRITAMENTE dentro do período solicitado
          const dataVenda = venda.data || '';
          // Comparar exatamente com as strings de data formatadas para garantir consistência
          const estaDentroDoPeriodo = dataVenda >= formattedDataInicio && dataVenda <= formattedDataFim;
          
          const incluir = temStatusValido && estaDentroDoPeriodo;
          
          if (debug) {
            console.log(`Venda ${venda.id} [${dataVenda}]: ${incluir ? 'incluída' : 'excluída'}`, {
              status: venda.nome_situacao,
              temStatusValido,
              dataVenda,
              estaDentroDoPeriodo,
              formattedDataInicio,
              formattedDataFim
            });
          }
          
          return incluir;
        });
        
        console.log(`Vendas após filtragem: ${vendasFiltradas.length} de ${vendas.vendas.length}`);
        
        const totalVendasFiltradas = vendasFiltradas.length;
        
        // Recalcular o valor total apenas das vendas filtradas - com maior precisão
        const totalValorFiltrado = parseFloat(vendasFiltradas.reduce((acc, venda) => {
          // Garantir que usamos um número válido para o valor total
          const valorVenda = typeof venda.valor_total === 'string' ? 
            parseFloat(venda.valor_total.replace(',', '.')) : 
            parseFloat(String(venda.valor_total || 0));
          
          // Verificar se o valor é um número válido antes de somar
          if (!isNaN(valorVenda)) {
            return acc + valorVenda;
          }
          return acc;
        }, 0).toFixed(2));

        // Calcular informações financeiras adicionais
        let totalCusto = 0;
        let totalDescontos = 0;
        let totalFretes = 0;

        vendasFiltradas.forEach((venda: any) => {
          // Processar custo
          if (venda.valor_custo) {
            const custoParsed = typeof venda.valor_custo === 'string' ? 
              parseFloat(venda.valor_custo.replace(',', '.')) : 
              parseFloat(String(venda.valor_custo || 0));
            
            if (!isNaN(custoParsed)) {
              totalCusto += custoParsed;
            }
          }
          
          // Processar descontos
          if (venda.desconto_valor) {
            const descontoParsed = typeof venda.desconto_valor === 'string' ? 
              parseFloat(venda.desconto_valor.replace(',', '.')) : 
              parseFloat(String(venda.desconto_valor || 0));
            
            if (!isNaN(descontoParsed)) {
              totalDescontos += descontoParsed;
            }
          }
          
          // Processar fretes
          if (venda.valor_frete) {
            const freteParsed = typeof venda.valor_frete === 'string' ? 
              parseFloat(venda.valor_frete.replace(',', '.')) : 
              parseFloat(String(venda.valor_frete || 0));
            
            if (!isNaN(freteParsed)) {
              totalFretes += freteParsed;
            }
          }
        });

        // Calcular lucro
        const lucroTotal = totalValorFiltrado - totalCusto - totalDescontos + totalFretes;
        const margemLucro = totalValorFiltrado > 0 ? (lucroTotal / totalValorFiltrado) * 100 : 0;

        if (debug) {
          console.log('Cálculos financeiros:', {
            totalValorFiltrado,
            totalCusto,
            totalDescontos,
            totalFretes,
            lucroTotal,
            margemLucro: margemLucro.toFixed(2) + '%'
          });
        }

        // Retornar dados filtrados e calculados com precisão
        return {
          vendas: vendasFiltradas, // Incluir apenas vendas filtradas por status e data
          totalVendas: totalVendasFiltradas,
          totalValor: totalValorFiltrado,
          financeiro: {
            custo: totalCusto,
            descontos: totalDescontos,
            fretes: totalFretes,
            lucro: lucroTotal,
            margemLucro
          }
        };
      },
      CACHE_TTL_VENDAS, // TTL personalizado para vendas
      forceUpdate // Ignorar cache se forceUpdate for true
    );

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
