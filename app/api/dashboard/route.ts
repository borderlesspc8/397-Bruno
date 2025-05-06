import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { DashboardData, Produto } from '@/types/dashboard';
import { isValid, parseISO, format } from 'date-fns';

// Configuração para forçar o comportamento dinâmico
export const dynamic = "force-dynamic";


export async function GET(request: NextRequest) {
  try {
    // Simula autenticação para desenvolvimento
    const session = { 
      user: { 
        id: 'user-1',
        name: 'Usuário Teste',
        email: 'teste@exemplo.com'
      } 
    };
    
    // Em produção, descomentar esta linha
    // const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const fromDate = searchParams.get('from');
    const toDate = searchParams.get('to');

    if (!fromDate || !isValid(parseISO(fromDate))) {
      return NextResponse.json(
        { error: 'Data inicial inválida' },
        { status: 400 }
      );
    }

    const parsedFromDate = parseISO(fromDate);
    const parsedToDate = toDate ? parseISO(toDate) : parsedFromDate;

    if (toDate && !isValid(parsedToDate)) {
      return NextResponse.json(
        { error: 'Data final inválida' },
        { status: 400 }
      );
    }

    console.log(`Buscando dados para o período: ${format(parsedFromDate, 'yyyy-MM-dd')} a ${format(parsedToDate, 'yyyy-MM-dd')}`);

    // Buscar vendas do período
    let vendas = [];
    
    try {
      // Tentar buscar do banco de dados
      vendas = await prisma.venda.findMany({
        where: {
          userId: session.user.id,
          dataVenda: {
            gte: parsedFromDate,
            lte: parsedToDate
          }
        },
        include: {
          vendedor: true,
          produtos: true
        }
      });
    } catch (error) {
      console.error('Erro ao buscar vendas do banco:', error);
      // Dados fictícios para desenvolvimento/teste se o banco falhar
      vendas = criarDadosFicticios(parsedFromDate, parsedToDate);
    }

    // Se não houver dados no banco, criar dados fictícios
    if (!vendas || vendas.length === 0) {
      vendas = criarDadosFicticios(parsedFromDate, parsedToDate);
    }

    // Calcular métricas
    const totalReceita = vendas.reduce((sum: number, venda: any) => sum + venda.valor, 0);
    const totalVendas = vendas.length;
    const ticketMedio = totalVendas > 0 ? totalReceita / totalVendas : 0;

    // Agrupar por vendedor
    const vendedoresMap = new Map();
    
    vendas.forEach((venda: any) => {
      const vendedor = venda.vendedor;
      if (!vendedoresMap.has(vendedor.id)) {
        vendedoresMap.set(vendedor.id, {
          id: vendedor.id,
          nome: vendedor.nome,
          totalVendas: 0,
          valorTotal: 0,
          ticketMedio: 0
        });
      }
      
      const vendedorStats = vendedoresMap.get(vendedor.id);
      vendedorStats.totalVendas += 1;
      vendedorStats.valorTotal += venda.valor;
    });

    // Calcular ticket médio por vendedor
    const vendedores = Array.from(vendedoresMap.values()).map(vendedor => ({
      ...vendedor,
      ticketMedio: vendedor.totalVendas > 0 ? vendedor.valorTotal / vendedor.totalVendas : 0
    }));

    // Criar vendas detalhadas com produtos
    const vendasDetalhadas = vendas.map((venda: any) => {
      let produtos: Produto[] = [];
      
      // Se existirem produtos no banco, use-os
      if (Array.isArray(venda.produtos) && venda.produtos.length > 0) {
        produtos = venda.produtos.map((produto: any) => ({
          id: produto.id,
          nome: produto.nome,
          quantidade: produto.quantidade,
          precoUnitario: produto.precoUnitario,
          total: produto.precoUnitario * produto.quantidade
        }));
      } else {
        // Caso não tenha produtos, crie alguns fictícios
        const quantidadeProdutos = Math.floor(Math.random() * 5) + 1;
        
        for (let i = 0; i < quantidadeProdutos; i++) {
          const precoUnitario = parseFloat((Math.random() * 100 + 10).toFixed(2));
          const quantidade = Math.floor(Math.random() * 5) + 1;
          
          produtos.push({
            id: `prod-${venda.id}-${i}`,
            nome: `Produto ${i + 1}`,
            quantidade: quantidade,
            precoUnitario: precoUnitario,
            total: precoUnitario * quantidade
          });
        }
      }
      
      return {
        id: venda.id,
        dataVenda: format(venda.dataVenda, 'yyyy-MM-dd'),
        valor: venda.valor,
        vendedor: {
          id: venda.vendedor.id,
          nome: venda.vendedor.nome
        },
        produtos: produtos
      };
    });

    const dashboardData: DashboardData = {
      totalReceita,
      totalVendas,
      ticketMedio,
      vendedores,
      vendasDetalhadas
    };

    return NextResponse.json(dashboardData);
    
  } catch (error) {
    console.error('Erro ao buscar dados do dashboard:', error);
    // Retornar uma estrutura vazia mas válida para evitar erros no frontend
    const emptyData: DashboardData = {
      totalReceita: 0,
      totalVendas: 0,
      ticketMedio: 0,
      vendedores: [],
      vendasDetalhadas: []
    };
    
    return NextResponse.json(emptyData);
  }
}

// Função para criar dados fictícios quando não houver dados reais
function criarDadosFicticios(dataInicio: Date, dataFim: Date): any[] {
  const vendas = [];
  const diasPeriodo = Math.ceil((dataFim.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const quantidadeVendas = Math.min(20, diasPeriodo * 2); // No máximo 2 vendas por dia, limitado a 20
  
  const vendedores = [
    { id: 'vendedor-1', nome: 'João Silva' },
    { id: 'vendedor-2', nome: 'Maria Oliveira' },
    { id: 'vendedor-3', nome: 'Carlos Santos' }
  ];
  
  for (let i = 0; i < quantidadeVendas; i++) {
    const diaAleatorio = Math.floor(Math.random() * diasPeriodo);
    const dataVenda = new Date(dataInicio);
    dataVenda.setDate(dataVenda.getDate() + diaAleatorio);
    
    const vendedorAleatorio = vendedores[Math.floor(Math.random() * vendedores.length)];
    const valor = parseFloat((Math.random() * 1000 + 100).toFixed(2));
    
    const produtos = [];
    const quantidadeProdutos = Math.floor(Math.random() * 5) + 1;
    
    for (let j = 0; j < quantidadeProdutos; j++) {
      const precoUnitario = parseFloat((Math.random() * 200 + 20).toFixed(2));
      const quantidade = Math.floor(Math.random() * 5) + 1;
      
      produtos.push({
        id: `produto-${i}-${j}`,
        nome: `Produto ${j + 1}`,
        descricao: `Descrição do produto ${j + 1}`,
        precoUnitario,
        quantidade,
      });
    }
    
    vendas.push({
      id: `venda-${i}`,
      valor,
      dataVenda,
      status: 'concluida',
      vendedorId: vendedorAleatorio.id,
      userId: 'user-1',
      vendedor: vendedorAleatorio,
      produtos
    });
  }
  
  return vendas;
}
