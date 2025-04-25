import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/_lib/auth-options';
import { GestaoClickClientService } from '@/app/_services/gestao-click-client-service';
import { prisma } from '@/app/_lib/prisma';

// Definir interfaces para tipagem
interface Cliente {
  id: string;
  name: string;
  document?: string;
  documentNumber?: string;
  email?: string;
  phone?: string;
  createdAt: Date;
  active?: boolean;
}

interface Venda {
  id: string;
  customerId: string;
  date: Date;
  totalAmount: number;
  items?: ItemVenda[];
  status?: string;
}

interface ItemVenda {
  description?: string;
  quantity?: number;
  totalPrice?: number;
}

interface TopClienteItem {
  customerId: string;
  _count: { id: number };
  _sum: { totalAmount: number | null };
}

interface Transacao {
  amount: number;
  date: Date;
  category?: string;
}

/**
 * GET /api/gestao-click/relatorios/cruzamento
 * Gera relatório cruzado de clientes, vendas e finanças
 */
export async function GET(req: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Obter parâmetros de consulta
    const searchParams = req.nextUrl.searchParams;
    const clienteId = searchParams.get('clienteId');
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';
    
    // Validar datas
    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'As datas de início e fim são obrigatórias' },
        { status: 400 }
      );
    }

    // Buscar configurações do Gestão Click
    const userId = session.user.id;
    const apiKey = process.env.GESTAO_CLICK_API_KEY || '';
    const secretToken = process.env.GESTAO_CLICK_SECRET_TOKEN || '';
    const apiUrl = process.env.GESTAO_CLICK_API_URL || 'https://api.beteltecnologia.com';

    // Inicializar o serviço
    const gestaoClickService = new GestaoClickClientService({
      apiKey,
      secretToken,
      apiUrl,
      userId
    });

    // Gerar relatório de cruzamento
    const resultado = await gerarRelatorioCruzamento(
      userId,
      clienteId,
      startDate,
      endDate,
      gestaoClickService
    );

    return NextResponse.json({
      success: true,
      resultado
    });
  } catch (error) {
    console.error("Erro ao gerar relatório de cruzamento:", error);
    return NextResponse.json(
      { error: "Erro ao gerar relatório", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

/**
 * Gera relatório cruzado de clientes, vendas e finanças
 */
async function gerarRelatorioCruzamento(
  userId: string,
  clienteId: string | null,
  startDate: string,
  endDate: string,
  gestaoClickService: GestaoClickClientService
) {
  try {
    // Buscar dados das vendas do período
    const dadosVendas = await buscarDadosVendas(
      userId,
      clienteId,
      startDate,
      endDate
    );

    // Buscar dados financeiros do período
    const dadosFinanceiros = await buscarDadosFinanceiros(
      userId,
      clienteId,
      startDate,
      endDate
    );

    // Construir o objeto de resposta
    let clienteData = null;

    // Se há um cliente específico, buscar detalhes desse cliente
    if (clienteId) {
      // Buscar dados do cliente
      const cliente = await prisma.customer.findFirst({
        where: {
          userId,
          id: clienteId
        }
      });

      if (cliente) {
        // Buscar vendas do cliente para análise
        const vendas = await prisma.sale.findMany({
          where: {
            userId,
            customerId: clienteId,
            date: {
              gte: new Date(startDate),
              lte: new Date(endDate)
            }
          },
          orderBy: {
            date: 'asc'
          }
        });

        // Calcular estatísticas do cliente
        const totalVendas = vendas.length;
        const valorTotal = vendas.reduce((total: number, venda: Venda) => total + venda.totalAmount, 0);
        const ticketMedio = totalVendas > 0 ? valorTotal / totalVendas : 0;
        
        // Ordenar vendas por data para obter primeira e última compra
        const primeiraCompra = vendas.length > 0 ? vendas[0].date : null;
        const ultimaCompra = vendas.length > 0 ? vendas[vendas.length - 1].date : null;

        clienteData = {
          cliente: {
            id: cliente.id,
            nome: cliente.name,
            documento: cliente.document,
            email: cliente.email,
            telefone: cliente.phone,
            dataCadastro: cliente.createdAt
          },
          estatisticas: {
            totalCompras: totalVendas,
            valorTotal,
            ticketMedio,
            primeiraCompra,
            ultimaCompra,
            recorrencia: totalVendas > 1 && ultimaCompra && primeiraCompra
              ? Math.round((ultimaCompra.getTime() - primeiraCompra.getTime()) / (1000 * 60 * 60 * 24 * totalVendas))
              : null
          }
        };
      }
    } else {
      // Se não houver cliente específico, buscar estatísticas gerais de clientes
      const clients = await prisma.customer.findMany({
        where: {
          userId,
          metadata: {
            path: ['source'],
            equals: 'GESTAO_CLICK'
          }
        },
        orderBy: {
          name: 'asc'
        },
        take: 100
      });

      // Buscar top clientes com mais compras no período
      const topClientes = await prisma.sale.groupBy({
        by: ['customerId'],
        where: {
          userId,
          date: {
            gte: new Date(startDate),
            lte: new Date(endDate)
          }
        },
        _count: {
          id: true
        },
        _sum: {
          totalAmount: true
        },
        orderBy: {
          _sum: {
            totalAmount: 'desc'
          }
        },
        take: 10
      });

      const clientesDetalhados = await Promise.all(
        topClientes.map(async (item: TopClienteItem) => {
          const cliente = await prisma.customer.findUnique({
            where: { id: item.customerId }
          });
          return {
            id: item.customerId,
            nome: cliente?.name || 'Cliente não encontrado',
            totalCompras: item._count.id,
            valorTotal: item._sum.totalAmount || 0
          };
        })
      );

      clienteData = {
        totalClientes: clients.length,
        clientes: clients.map((cliente: Cliente) => ({
          id: cliente.id,
          nome: cliente.name,
          documento: cliente.documentNumber || cliente.document,
          email: cliente.email
        })),
        topClientes: clientesDetalhados
      };
    }

    // Montar resposta final
    return {
      periodo: {
        inicio: startDate,
        fim: endDate
      },
      dadosCliente: clienteData,
      dadosVendas,
      dadosFinanceiros
    };
  } catch (error) {
    console.error('Erro ao gerar relatório de cruzamento:', error);
    throw new Error(`Falha ao gerar relatório: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Busca dados das vendas para o relatório
 */
async function buscarDadosVendas(
  userId: string,
  clienteId: string | null,
  startDate: string,
  endDate: string
) {
  try {
    // Construir query base
    const whereClause: any = {
      userId,
      date: {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    };

    // Adicionar filtro de cliente se fornecido
    if (clienteId) {
      whereClause.customerId = clienteId;
    }

    // Buscar vendas do período
    const vendas = await prisma.sale.findMany({
      where: whereClause,
      include: {
        items: true,
        customer: true
      },
      orderBy: {
        date: 'desc'
      }
    });

    // Agrupar vendas por situação
    const vendasPorSituacao: Record<string, number> = {};
    
    vendas.forEach((venda: Venda) => {
      const situacao = venda.status || 'Não definido';
      vendasPorSituacao[situacao] = (vendasPorSituacao[situacao] || 0) + 1;
    });

    // Calcular totais
    const totalVendas = vendas.length;
    const valorTotal = vendas.reduce((total: number, venda: Venda) => total + venda.totalAmount, 0);
    
    // Agrupar vendas por mês para gráfico de evolução
    const vendasPorMes: Record<string, number> = {};
    
    vendas.forEach((venda: Venda) => {
      const mesAno = `${venda.date.getFullYear()}-${(venda.date.getMonth() + 1).toString().padStart(2, '0')}`;
      vendasPorMes[mesAno] = (vendasPorMes[mesAno] || 0) + venda.totalAmount;
    });

    // Organizar os meses em ordem cronológica
    const mesesOrdenados = Object.keys(vendasPorMes).sort();
    const vendasPorMesOrdenado: Record<string, number> = {};
    mesesOrdenados.forEach(mes => {
      vendasPorMesOrdenado[mes] = vendasPorMes[mes];
    });

    // Agrupar por produtos mais vendidos
    const produtosMaisVendidos: Record<string, { quantidade: number; valor: number }> = {};
    
    // Processar itens de venda para obter produtos mais vendidos
    vendas.forEach((venda: Venda) => {
      (venda.items || []).forEach((item: ItemVenda) => {
        const nomeProduto = item.description || 'Produto sem nome';
        if (!produtosMaisVendidos[nomeProduto]) {
          produtosMaisVendidos[nomeProduto] = { quantidade: 0, valor: 0 };
        }
        produtosMaisVendidos[nomeProduto].quantidade += item.quantity || 1;
        produtosMaisVendidos[nomeProduto].valor += item.totalPrice || 0;
      });
    });

    // Converter para array e ordenar por valor
    const produtosArray = Object.entries(produtosMaisVendidos).map(([nome, dados]) => ({
      nome,
      quantidade: dados.quantidade,
      valor: dados.valor
    })).sort((a, b) => b.valor - a.valor);

    return {
      totalVendas,
      valorTotal,
      vendasPorSituacao,
      vendasPorMes: vendasPorMesOrdenado,
      produtosMaisVendidos: produtosArray.slice(0, 10) // Top 10 produtos
    };
  } catch (error) {
    console.error('Erro ao buscar dados de vendas:', error);
    // Retornar objeto vazio em caso de erro
    return {
      totalVendas: 0,
      valorTotal: 0,
      vendasPorSituacao: {},
      vendasPorMes: {},
      produtosMaisVendidos: []
    };
  }
}

/**
 * Busca dados financeiros para o relatório
 */
async function buscarDadosFinanceiros(
  userId: string,
  clienteId: string | null,
  startDate: string,
  endDate: string
) {
  try {
    // Construir filtro base para transações
    const whereClause: any = {
      userId,
      date: {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    };

    // Se cliente específico, filtrar pelo metadata.saleCustomerId ou por vendas
    if (clienteId) {
      // Este é um caso mais complexo - precisamos buscar vendas do cliente e depois transações dessas vendas
      const vendasDoCliente = await prisma.sale.findMany({
        where: {
          userId,
          customerId: clienteId
        },
        select: { id: true }
      });

      const vendasIds = vendasDoCliente.map((v: { id: string }) => v.id);
      
      // Modificar where clause para filtrar por vendas do cliente
      whereClause.OR = [
        {
          metadata: {
            path: ['saleCustomerId'],
            equals: clienteId
          }
        },
        {
          metadata: {
            path: ['saleId'],
            in: vendasIds
          }
        }
      ];
    }

    // Buscar todas as transações do período
    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      orderBy: {
        date: 'desc'
      }
    });

    // Separar receitas e despesas
    const receitas = transactions.filter((t: Transacao) => t.amount > 0);
    const despesas = transactions.filter((t: Transacao) => t.amount < 0);
    
    // Calcular totais
    const totalReceitas = receitas.reduce((total: number, receita: Transacao) => total + receita.amount, 0);
    const totalDespesas = despesas.reduce((total: number, despesa: Transacao) => total + Math.abs(despesa.amount), 0);
    const saldo = totalReceitas - totalDespesas;
    
    // Calcular percentual de lucratividade se houver receitas
    const lucratividade = totalReceitas > 0 ? (saldo / totalReceitas) * 100 : 0;

    // Agrupar por categoria
    const receitasPorCategoria: Record<string, number> = {};
    const despesasPorCategoria: Record<string, number> = {};
    
    receitas.forEach((receita: Transacao) => {
      const categoria = receita.category || 'Não categorizado';
      receitasPorCategoria[categoria] = (receitasPorCategoria[categoria] || 0) + receita.amount;
    });
    
    despesas.forEach((despesa: Transacao) => {
      const categoria = despesa.category || 'Não categorizado';
      despesasPorCategoria[categoria] = (despesasPorCategoria[categoria] || 0) + Math.abs(despesa.amount);
    });

    // Preparar dados para fluxo de caixa por mês
    // Primeiro determinamos o intervalo de meses
    const dataInicio = new Date(startDate);
    const dataFim = new Date(endDate);
    
    const fluxoCaixa: Record<string, { receitas: number; despesas: number; saldo: number }> = {};
    
    // Criar entradas para cada mês no intervalo
    let dataAtual = new Date(dataInicio);
    while (dataAtual <= dataFim) {
      const mesAno = `${dataAtual.getFullYear()}-${(dataAtual.getMonth() + 1).toString().padStart(2, '0')}`;
      fluxoCaixa[mesAno] = { receitas: 0, despesas: 0, saldo: 0 };
      
      // Avançar para o próximo mês
      dataAtual.setMonth(dataAtual.getMonth() + 1);
    }
    
    // Preencher os valores
    receitas.forEach((receita: Transacao) => {
      const mesAno = `${receita.date.getFullYear()}-${(receita.date.getMonth() + 1).toString().padStart(2, '0')}`;
      if (fluxoCaixa[mesAno]) {
        fluxoCaixa[mesAno].receitas += receita.amount;
        fluxoCaixa[mesAno].saldo += receita.amount;
      }
    });
    
    despesas.forEach((despesa: Transacao) => {
      const mesAno = `${despesa.date.getFullYear()}-${(despesa.date.getMonth() + 1).toString().padStart(2, '0')}`;
      if (fluxoCaixa[mesAno]) {
        fluxoCaixa[mesAno].despesas += Math.abs(despesa.amount);
        fluxoCaixa[mesAno].saldo -= Math.abs(despesa.amount);
      }
    });

    return {
      totais: {
        receitas: totalReceitas,
        despesas: totalDespesas,
        saldo,
        lucratividade
      },
      receitasPorCategoria,
      despesasPorCategoria,
      fluxoCaixa
    };
  } catch (error) {
    console.error('Erro ao buscar dados financeiros:', error);
    // Retornar objeto vazio em caso de erro
    return {
      totais: {
        receitas: 0,
        despesas: 0,
        saldo: 0,
        lucratividade: 0
      },
      receitasPorCategoria: {},
      despesasPorCategoria: {},
      fluxoCaixa: {}
    };
  }
} 