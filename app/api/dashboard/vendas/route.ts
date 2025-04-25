import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/_lib/auth";
import { GestaoClickClientService } from "@/app/_services/gestao-click-client-service";
import { prisma } from "@/app/_lib/prisma";
import { BetelTecnologiaService } from '@/app/_services/betelTecnologia';
import { parse, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Função para memoização de dados para evitar múltiplas requisições redundantes
const memoizedResults = new Map<string, { data: any, timestamp: number }>();
const CACHE_EXPIRATION = 5 * 60 * 1000; // 5 minutos em milissegundos

// Funções auxiliares para processamento de dados
function processVendasPorConsultor(vendas: any, funcionarios: any) {
  // Inicializar map para armazenar vendas por vendedor
  const vendasPorVendedor = new Map();
  
  console.log("Processando vendas do consultor. Dados recebidos:");
  console.log("Vendas:", vendas?.data ? `${vendas.data.length} registros` : "Sem dados");
  console.log("Funcionarios:", funcionarios?.data ? `${funcionarios.data.length} registros` : "Sem dados");
  
  // Exibir amostra da primeira venda para debug
  if (vendas?.data && vendas.data.length > 0) {
    const primeiraVenda = vendas.data[0];
    console.log("Exemplo da primeira venda:", {
      id: primeiraVenda.id,
      vendedor_id: primeiraVenda.vendedor_id,
      nome_vendedor: primeiraVenda.nome_vendedor
    });
  }
  
  // Preparar dados de funcionários para lookup rápido
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
  
  // Processar vendas
  if (vendas && Array.isArray(vendas.data)) {
    vendas.data.forEach((venda: any) => {
      if (!venda.vendedor_id) return;
      
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
  
  const resultado = Array.from(vendasPorVendedor.values())
    .filter(vendedor => vendedor.valorTotal > 0)
    .sort((a, b) => b.valorTotal - a.valorTotal);
  
  // Logar amostra do resultado
  console.log("Resultado do processamento de vendedores:", 
    resultado.length > 0 ? 
    resultado.slice(0, 2).map(v => ({id: v.id, nome: v.nome, nome_vendedor: v.nome_vendedor})) : 
    "Nenhum vendedor processado");
  
  // Converter para array e ordenar por valor total (decrescente)
  return resultado;
}

function processQuantidadeVendas(vendas: any) {
  // Inicializar contadores
  let totalVendas = 0;
  let valorTotal = 0;
  
  // Inicializar contadores por dia
  const vendasPorDia = new Map();
  
  if (vendas && Array.isArray(vendas.data)) {
    vendas.data.forEach((venda: any) => {
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
    vendas.data.forEach((venda: any) => {
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

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const dataInicio = searchParams.get('dataInicio');
    const dataFim = searchParams.get('dataFim');

    // Validar parâmetros obrigatórios
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

    console.log(`Buscando vendas de ${dataInicio} até ${dataFim}`);

    // Tentar realizar o parsing das datas
    let dataInicioObj: Date;
    let dataFimObj: Date;
    
    try {
      // Tentar primeiro no formato ISO
      dataInicioObj = new Date(dataInicio);
      dataFimObj = new Date(dataFim);
      
      // Verificar se as datas são válidas
      if (isNaN(dataInicioObj.getTime()) || isNaN(dataFimObj.getTime())) {
        // Tentar no formato dd/MM/yyyy que pode vir da UI
        dataInicioObj = parse(dataInicio, 'dd/MM/yyyy', new Date(), { locale: ptBR });
        dataFimObj = parse(dataFim, 'dd/MM/yyyy', new Date(), { locale: ptBR });
      }
      
      // Verificar novamente se as datas são válidas
      if (isNaN(dataInicioObj.getTime()) || isNaN(dataFimObj.getTime())) {
        throw new Error('Formato de data inválido');
      }
    } catch (error) {
      console.error('Erro ao processar datas:', error);
      return NextResponse.json(
        { 
          erro: 'Formato de data inválido. Use o formato ISO ou dd/MM/yyyy',
          vendas: [],
          totalVendas: 0,
          totalValor: 0
        },
        { status: 400 }
      );
    }

    // Ajustar as datas para incluir todo o período
    dataInicioObj.setHours(0, 0, 0, 0);
    dataFimObj.setHours(23, 59, 59, 999);

    console.log('Datas processadas:', {
      dataInicio: dataInicioObj.toISOString(),
      dataFim: dataFimObj.toISOString()
    });

    try {
      console.log('Buscando vendas da API externa...');
      const vendasResponse = await BetelTecnologiaService.buscarVendas({
        dataInicio: dataInicioObj,
        dataFim: dataFimObj
      });

      // Verificar se houve erro
      if (vendasResponse.erro) {
        console.warn('Erro na API externa:', vendasResponse.erro);
        
        // Se o erro está relacionado a credenciais, retornar mensagem específica
        if (
          vendasResponse.erro.includes('Token de acesso não configurado') || 
          vendasResponse.erro.includes('Token secreto não configurado') ||
          vendasResponse.erro.includes('credenciais inválidas')
        ) {
          return NextResponse.json(
            { 
              erro: 'É necessário configurar as credenciais da API externa. Verifique as variáveis de ambiente GESTAO_CLICK_ACCESS_TOKEN e GESTAO_CLICK_SECRET_ACCESS_TOKEN.',
              vendas: [],
              totalVendas: 0,
              totalValor: 0
            },
            { status: 401 }
          );
        }
        
        // Outros erros da API
        return NextResponse.json(
          { 
            erro: `Erro na API externa: ${vendasResponse.erro}`,
            vendas: [],
            totalVendas: 0,
            totalValor: 0
          },
          { status: 500 }
        );
      }

      // Se não encontrou vendas
      if (vendasResponse.vendas.length === 0) {
        return NextResponse.json(
          {
            vendas: [],
            totalVendas: 0,
            totalValor: 0,
            mensagem: 'Nenhuma venda encontrada no período especificado.'
          },
          { status: 200 }
        );
      }

      // Retornar dados das vendas
      return NextResponse.json({
        vendas: vendasResponse.vendas,
        totalVendas: vendasResponse.totalVendas,
        totalValor: vendasResponse.totalValor
      });
    } catch (error) {
      console.error('Erro ao processar requisição de vendas:', error);
      return NextResponse.json(
        { 
          erro: `Erro interno ao processar requisição: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
          vendas: [],
          totalVendas: 0,
          totalValor: 0
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Erro ao processar requisição de vendas:', error);
    return NextResponse.json(
      { 
        erro: `Erro interno ao processar requisição: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        vendas: [],
        totalVendas: 0,
        totalValor: 0
      },
      { status: 500 }
    );
  }
} 