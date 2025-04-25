'use client';

import { useEffect, useState, useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import { Card, CardContent } from '@/app/components/ui/card';
import { 
  PlusCircle, 
  MinusCircle, 
  ShoppingBag, 
  Package, 
  Coffee, 
  Utensils, 
  Shirt, 
  Smartphone, 
  Book, 
  Gift
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Registrar componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Interface para o tipo de produto
interface Produto {
  id: string;
  nome: string;
  quantidade: number;
  preco: number;
  precoUnitario?: number;
  total: number;
  categoria?: string;
}

// Interface para as props do componente
interface ProdutosVendidosProps {
  produtos: Produto[];
}

const ProdutosVendidos = ({ produtos }: ProdutosVendidosProps) => {
  // Estado para controlar a ordenação (quantidade ou total)
  const [orderBy, setOrderBy] = useState<'quantidade' | 'total'>('quantidade');
  
  // Função para obter ícone baseado na categoria
  const getCategoryIcon = (category: string) => {
    const categoryMap: Record<string, React.ReactNode> = {
      'Alimentos': <Coffee className="h-4 w-4" />,
      'Bebidas': <Utensils className="h-4 w-4" />,
      'Vestuário': <Shirt className="h-4 w-4" />,
      'Eletrônicos': <Smartphone className="h-4 w-4" />,
      'Livros': <Book className="h-4 w-4" />,
      'Presentes': <Gift className="h-4 w-4" />
    };
    
    return categoryMap[category] || <Package className="h-4 w-4" />;
  };
  
  // Função para obter cor baseada na categoria
  const getCategoryColor = (category: string) => {
    const colorMap: Record<string, string> = {
      'Alimentos': 'bg-blue-100 text-blue-800',
      'Bebidas': 'bg-green-100 text-green-800',
      'Vestuário': 'bg-purple-100 text-purple-800',
      'Eletrônicos': 'bg-yellow-100 text-yellow-800',
      'Livros': 'bg-pink-100 text-pink-800',
      'Presentes': 'bg-indigo-100 text-indigo-800'
    };
    
    return colorMap[category] || 'bg-gray-100 text-gray-800';
  };

  // Ordenar produtos conforme a seleção do usuário
  const sortedProducts = useMemo(() => {
    if (!produtos || produtos.length === 0) return [];
    
    console.log('Ordenando produtos por:', orderBy);
    
    return [...produtos].sort((a, b) => 
      orderBy === 'quantidade' 
        ? b.quantidade - a.quantidade 
        : b.total - a.total
    );
  }, [produtos, orderBy]);

  // Dados para o gráfico
  const chartData = useMemo(() => {
    if (!produtos || produtos.length === 0) return { labels: [], datasets: [] };
    
    // Pegar os top 10 produtos ou todos se forem menos que 10
    const topProducts = sortedProducts.slice(0, 10);
    
    console.log('Preparando dados para o gráfico com', topProducts.length, 'produtos');
    
    return {
      labels: topProducts.map(product => product.nome.length > 15 
        ? `${product.nome.substring(0, 15)}...` 
        : product.nome
      ),
      datasets: [
        {
          label: orderBy === 'quantidade' ? 'Quantidade' : 'Faturamento (R$)',
          data: topProducts.map(product => 
            orderBy === 'quantidade' ? product.quantidade : product.total
          ),
          backgroundColor: [
            'rgba(54, 162, 235, 0.6)',
            'rgba(75, 192, 192, 0.6)',
            'rgba(255, 159, 64, 0.6)',
            'rgba(153, 102, 255, 0.6)',
            'rgba(255, 99, 132, 0.6)',
            'rgba(255, 206, 86, 0.6)',
            'rgba(231, 233, 237, 0.6)',
            'rgba(129, 199, 132, 0.6)',
            'rgba(121, 134, 203, 0.6)',
            'rgba(171, 71, 188, 0.6)'
          ],
          borderColor: [
            'rgb(54, 162, 235)',
            'rgb(75, 192, 192)',
            'rgb(255, 159, 64)',
            'rgb(153, 102, 255)',
            'rgb(255, 99, 132)',
            'rgb(255, 206, 86)',
            'rgb(231, 233, 237)',
            'rgb(129, 199, 132)',
            'rgb(121, 134, 203)',
            'rgb(171, 71, 188)'
          ],
          borderWidth: 1,
        },
      ],
    };
  }, [produtos, sortedProducts, orderBy]);

  // Opções do gráfico
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            if (orderBy === 'quantidade') {
              return `Quantidade: ${context.raw}`;
            } else {
              return `Valor: ${new Intl.NumberFormat('pt-BR', { 
                style: 'currency', 
                currency: 'BRL' 
              }).format(context.raw)}`;
            }
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: string | number) {
            if (orderBy === 'quantidade') {
              return value;
            } else {
              return new Intl.NumberFormat('pt-BR', { 
                style: 'currency', 
                currency: 'BRL',
                maximumFractionDigits: 0
              }).format(Number(value));
            }
          }
        }
      }
    }
  } as const;

  if (!produtos || produtos.length === 0) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center min-h-[300px]">
            <ShoppingBag className="h-16 w-16 text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">Nenhum produto encontrado no período selecionado</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="w-full">
        <CardContent className="p-0 overflow-hidden">
          <div className="p-6 pb-0">
            <h3 className="text-lg font-semibold mb-4">Top Produtos por {orderBy === 'quantidade' ? 'Quantidade' : 'Faturamento'}</h3>
            <div className="flex justify-end space-x-2 mb-4">
              <button
                onClick={() => setOrderBy('quantidade')}
                className={`px-3 py-1 text-sm rounded-full ${
                  orderBy === 'quantidade' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
                }`}
              >
                Quantidade
              </button>
              <button
                onClick={() => setOrderBy('total')}
                className={`px-3 py-1 text-sm rounded-full ${
                  orderBy === 'total' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
                }`}
              >
                Faturamento
              </button>
            </div>
          </div>
          <div className="h-[300px] p-4">
            <Bar data={chartData} options={options} />
          </div>
        </CardContent>
      </Card>

      <Card className="w-full">
        <CardContent className="p-0">
          <div className="p-6 pb-0">
            <h3 className="text-lg font-semibold mb-4">Detalhes dos Produtos</h3>
            <div className="flex justify-end space-x-2 mb-4">
              <button
                onClick={() => setOrderBy('quantidade')}
                className={`px-3 py-1 text-sm rounded-full ${
                  orderBy === 'quantidade' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
                }`}
              >
                <PlusCircle className="h-4 w-4 inline mr-1" /> Quantidade
              </button>
              <button
                onClick={() => setOrderBy('total')}
                className={`px-3 py-1 text-sm rounded-full ${
                  orderBy === 'total' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
                }`}
              >
                <MinusCircle className="h-4 w-4 inline mr-1" /> Faturamento
              </button>
            </div>
          </div>
          <div className="max-h-[400px] overflow-auto p-4">
            <table className="w-full">
              <thead className="sticky top-0 bg-white">
                <tr className="border-b">
                  <th className="pb-2 text-left font-medium text-gray-500">Produto</th>
                  <th className="pb-2 text-center font-medium text-gray-500">Categoria</th>
                  <th className="pb-2 text-right font-medium text-gray-500">Preço Unit.</th>
                  <th className="pb-2 text-right font-medium text-gray-500">Qtd.</th>
                  <th className="pb-2 text-right font-medium text-gray-500">Total</th>
                </tr>
              </thead>
              <tbody>
                {sortedProducts.map((product, index) => (
                  <tr 
                    key={index} 
                    className={`border-b last:border-0 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-gray-100 transition-colors`}
                  >
                    <td className="py-3 pl-2">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                          {getCategoryIcon(product.categoria || '')}
                        </div>
                        <span className="font-medium">{product.nome}</span>
                      </div>
                    </td>
                    <td className="py-3 text-center">
                      <span className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(product.categoria || '')}`}>
                        {product.categoria || 'N/A'}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                        product.precoUnitario || product.preco || 0
                      )}
                    </td>
                    <td className="py-3 text-right">
                      <span className="font-semibold">{product.quantidade}</span>
                    </td>
                    <td className="py-3 text-right font-semibold">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t bg-gray-50">
                <tr>
                  <td className="py-3 font-semibold">Total</td>
                  <td colSpan={2}></td>
                  <td className="py-3 text-right font-semibold">
                    {produtos.reduce((acc: number, curr: Produto) => acc + curr.quantidade, 0)}
                  </td>
                  <td className="py-3 text-right font-semibold">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                      produtos.reduce((acc: number, curr: Produto) => acc + curr.total, 0)
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProdutosVendidos; 