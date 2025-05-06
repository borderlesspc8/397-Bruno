import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/_lib/auth';
import { prisma } from '@/app/_lib/prisma';
import { z } from 'zod';

// Schema de validação para os parâmetros da requisição
const requestSchema = z.object({
  dataInicio: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: "Data inicial inválida"
  }),
  dataFim: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: "Data final inválida"
  }),
  produtoId: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ 
        erro: "Usuário não autenticado" 
      }, { status: 401 });
    }

    // Obter e validar os parâmetros
    const body = await req.json();
    console.log('Parâmetros recebidos:', body);
    
    const result = requestSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json({ 
        erro: "Parâmetros inválidos",
        detalhes: result.error.format() 
      }, { status: 400 });
    }
    
    const { dataInicio, dataFim, produtoId } = result.data;
    console.log('Buscando vendas para produto:', produtoId, 'período:', dataInicio, 'até', dataFim);
    
    // Buscar vendas que contêm o produto especificado
    // Neste exemplo, vamos usar uma consulta simulada, mas você pode adaptar para seu banco de dados real
    const vendas = await buscarVendasComProduto(dataInicio, dataFim, produtoId);
    
    return NextResponse.json({
      vendas: vendas,
      total: vendas.length
    });
    
  } catch (error) {
    console.error('Erro ao buscar vendas por produto:', error);
    return NextResponse.json({ 
      erro: error instanceof Error ? error.message : "Erro interno ao buscar vendas por produto" 
    }, { status: 500 });
  }
}

// Função para buscar vendas que contêm um produto específico
async function buscarVendasComProduto(dataInicio: string, dataFim: string, produtoId: string) {
  try {
    console.log('Gerando vendas ficticias para produto ID:', produtoId);
    
    // Gerar entre 2 e 8 vendas simuladas para o período
    const quantidade = Math.floor(Math.random() * 6) + 2;
    const vendas = [];
    
    // Vamos gerar nomes de clientes mais realistas
    const nomes = ['João Silva', 'Maria Santos', 'Carlos Oliveira', 'Ana Pereira', 
                  'Roberto Costa', 'Patrícia Lima', 'Fernando Souza', 'Camila Rodrigues'];
    
    // E nomes de vendedores
    const vendedores = ['Lucas Ferreira', 'Mariana Alves', 'Gabriel Mendes', 'Juliana Martins'];
    
    // Produtos relacionados ao ID (vamos fingir que conhecemos o nome do produto)
    const nomeProduto = produtoId.replace(/_/g, ' ').toUpperCase();
    
    for (let i = 0; i < quantidade; i++) {
      // Gerar uma data aleatória dentro do período
      const inicio = new Date(dataInicio);
      const fim = new Date(dataFim);
      const data = new Date(inicio.getTime() + Math.random() * (fim.getTime() - inicio.getTime()));
      
      // Gerar um valor aleatório entre 50 e 500
      const valorUnitario = (Math.random() * 150 + 30).toFixed(2);
      
      // Gerar uma quantidade aleatória entre 1 e 3
      const qtdProduto = Math.floor(Math.random() * 3) + 1;
      
      // Calcular valor total
      const valorTotal = (parseFloat(valorUnitario) * qtdProduto).toFixed(2);
      
      // Escolher um cliente e vendedor aleatório
      const cliente = nomes[Math.floor(Math.random() * nomes.length)];
      const vendedor = vendedores[Math.floor(Math.random() * vendedores.length)];
      
      vendas.push({
        id: `venda-${Date.now()}-${i}`,
        data: data.toISOString(),
        data_inclusao: data.toISOString(),
        nome_cliente: cliente,
        valor_total: valorTotal,
        quantidade: qtdProduto,
        valor_unitario: valorUnitario,
        produto: nomeProduto,
        produto_id: produtoId,
        vendedor_nome: vendedor,
        nome_situacao: "Concretizada"
      });
    }
    
    console.log(`Geradas ${vendas.length} vendas ficticias para o produto`);
    return vendas;
    
  } catch (error) {
    console.error('Erro ao buscar vendas com produto:', error);
    throw error;
  }
} 