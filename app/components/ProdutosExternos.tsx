'use client';

import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_components/ui/card';
import { BarChart } from '@/app/components/ui/bar-chart';
import { formatCurrency } from '@/app/_utils/format';
import { ProdutosService } from '@/app/_services/produtos';

interface Produto {
  id: string;
  nome: string;
  quantidade: number;
  precoUnitario: number;
  total: number;
  categoria?: string;
}

interface ProdutosExternosProps {
  dataInicio: Date;
  dataFim: Date;
}

export function ProdutosExternos({ dataInicio, dataFim }: ProdutosExternosProps) {
  const [ordenacao, setOrdenacao] = useState<'quantidade' | 'total'>('total');
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    const buscarProdutos = async () => {
      try {
        setLoading(true);
        setErro(null);
        
        const response = await ProdutosService.buscarProdutosExternos({
          dataInicio,
          dataFim
        });
        
        if (response.erro) {
          throw new Error(response.erro);
        }
        
        if (response.mensagem) {
          console.log('Mensagem da API:', response.mensagem);
        }
        
        setProdutos(response.produtos || []);
        console.log('ProdutosExternos recebeu:', { 
          produtos: response.produtos, 
          isArray: Array.isArray(response.produtos),
          length: response.produtos?.length 
        });
      } catch (error) {
        console.error('Erro ao buscar produtos externos:', error);
        setErro(error instanceof Error ? error.message : 'Erro ao buscar produtos externos');
      } finally {
        setLoading(false);
      }
    };
    
    buscarProdutos();
  }, [dataInicio, dataFim]);

  // Garantir que produtos é sempre um array
  const produtosValidos = Array.isArray(produtos) ? produtos : [];

  const produtosOrdenados = [...produtosValidos].sort((a, b) => {
    if (ordenacao === 'quantidade') {
      return b.quantidade - a.quantidade;
    }
    return b.total - a.total;
  });

  const dadosGrafico = produtosOrdenados.slice(0, 5).map((produto) => ({
    name: produto.nome,
    total: produto.total,
    quantidade: produto.quantidade,
  }));

  // Log dos dados do gráfico
  useEffect(() => {
    console.log('Dados para o gráfico de produtos externos:', dadosGrafico);
  }, [dadosGrafico]);

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Produtos Externos - API Betel Tecnologia</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#faba33] mx-auto mb-4"></div>
              <p className="text-muted-foreground">Carregando produtos externos...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (erro) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Produtos Externos - API Betel Tecnologia</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-red-500">
            <div className="text-center">
              <div className="text-red-500 text-xl mb-4">⚠️</div>
              <p>{erro}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (produtosValidos.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Produtos Externos - API Betel Tecnologia</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            Nenhum produto encontrado no período selecionado
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Produtos Externos - API Betel Tecnologia</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          <div className="h-[300px]">
            <BarChart
              data={dadosGrafico}
              index="name"
              categories={['total', 'quantidade']}
              colors={['blue', 'green']}
              valueFormatter={(value: any) => {
                if (typeof value === 'number') {
                  return formatCurrency(value);
                }
                return String(value);
              }}
            />
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Preço Unitário</TableHead>
                <TableHead 
                  className="text-right cursor-pointer hover:bg-gray-100"
                  onClick={() => setOrdenacao('quantidade')}
                >
                  Quantidade
                </TableHead>
                <TableHead 
                  className="text-right cursor-pointer hover:bg-gray-100"
                  onClick={() => setOrdenacao('total')}
                >
                  Total
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {produtosOrdenados.map((produto) => (
                <TableRow key={produto.id}>
                  <TableCell>{produto.nome}</TableCell>
                  <TableCell>{produto.categoria || 'N/A'}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(produto.precoUnitario)}
                  </TableCell>
                  <TableCell className="text-right">{produto.quantidade}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(produto.total)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
} 
