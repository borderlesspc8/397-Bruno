'use client';

import React, { useMemo, useState } from 'react';
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
  Gift,
  Pizza,
  Beer,
  Sandwich,
  Beef,
  IceCream,
  Wine,
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

// Constantes para categorias
const CATEGORIAS = {
  COMIDA: 'Comida',
  BEBIDA: 'Bebida',
  SOBREMESA: 'Sobremesa',
  LANCHE: 'Lanche',
  REFEICAO: 'Refeição',
  CAFE: 'Café',
  PIZZA: 'Pizza',
  CERVEJA: 'Cerveja',
  VINHO: 'Vinho',
  SANDUICHE: 'Sanduíche',
  CARNE: 'Carne',
};

// Constantes para tipos de ordenação
const ORDENACAO = {
  QUANTIDADE: 'quantidade',
  TOTAL: 'total',
};

// Componente para ícone da categoria
const CategoryIcon = ({ category }: { category: string }) => {
  switch (category) {
    case CATEGORIAS.CAFE:
      return <Coffee className="h-4 w-4" />;
    case CATEGORIAS.PIZZA:
      return <Pizza className="h-4 w-4" />;
    case CATEGORIAS.CERVEJA:
    case CATEGORIAS.BEBIDA:
      return <Beer className="h-4 w-4" />;
    case CATEGORIAS.COMIDA:
    case CATEGORIAS.REFEICAO:
      return <Utensils className="h-4 w-4" />;
    case CATEGORIAS.LANCHE:
    case CATEGORIAS.SANDUICHE:
      return <Sandwich className="h-4 w-4" />;
    case CATEGORIAS.CARNE:
      return <Beef className="h-4 w-4" />;
    case CATEGORIAS.SOBREMESA:
      return <IceCream className="h-4 w-4" />;
    case CATEGORIAS.VINHO:
      return <Wine className="h-4 w-4" />;
    default:
      return <Package className="h-4 w-4" />;
  }
};

// Componente para formatação de moeda
const FormatCurrency = ({ value }: { value: number }) => (
  <>
    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)}
  </>
);

// Botão de alternância para ordenação
const SortButton = ({ 
  active, 
  value, 
  currentValue, 
  onClick, 
  children 
}: { 
  active: boolean, 
  value: 'quantidade' | 'total', 
  currentValue: string, 
  onClick: (value: 'quantidade' | 'total') => void, 
  children: React.ReactNode 
}) => (
  <button
    onClick={() => onClick(value)}
    className={`px-3 py-1 text-sm rounded-full ${
      active ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
    }`}
  >
    {children}
  </button>
);

const ProdutosVendidos = ({ produtos }: ProdutosVendidosProps) => {
  const [orderBy, setOrderBy] = useState<'quantidade' | 'total'>(ORDENACAO.QUANTIDADE as 'quantidade');

  const getCategoryColor = (category: string) => {
    switch (category) {
      case CATEGORIAS.CAFE:
        return 'bg-amber-100 text-amber-800';
      case CATEGORIAS.PIZZA:
        return 'bg-red-100 text-red-800';
      case CATEGORIAS.CERVEJA:
      case CATEGORIAS.BEBIDA:
        return 'bg-yellow-100 text-yellow-800';
      case CATEGORIAS.COMIDA:
      case CATEGORIAS.REFEICAO:
        return 'bg-green-100 text-green-800';
      case CATEGORIAS.LANCHE:
      case CATEGORIAS.SANDUICHE:
        return 'bg-orange-100 text-orange-800';
      case CATEGORIAS.CARNE:
        return 'bg-red-100 text-red-800';
      case CATEGORIAS.SOBREMESA:
        return 'bg-purple-100 text-purple-800';
      case CATEGORIAS.VINHO:
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Ordenar produtos usando useMemo para evitar recálculos desnecessários
  const sortedProducts = useMemo(() => {
    if (!produtos) return [];
    
    return [...produtos].sort((a, b) => 
      orderBy === ORDENACAO.QUANTIDADE 
        ? b.quantidade - a.quantidade 
        : b.total - a.total
    );
  }, [produtos, orderBy]);

  // Preparar dados do gráfico com useMemo
  const chartData = useMemo(() => {
    if (!produtos || produtos.length === 0) return { labels: [], datasets: [] };
    
    // Limitar para os top 10 produtos
    const topProducts = sortedProducts.slice(0, 10);
    
    return {
      labels: topProducts.map(p => p.nome),
      datasets: [
        {
          data: topProducts.map(p => orderBy === ORDENACAO.QUANTIDADE ? p.quantidade : p.total),
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

  // Opções do gráfico com useMemo para evitar recriação desnecessária
  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            if (orderBy === ORDENACAO.QUANTIDADE) {
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
            if (orderBy === ORDENACAO.QUANTIDADE) {
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
  }), [orderBy]);

  // Calcular totais gerais
  const totalQuantidade = useMemo(() => 
    produtos?.reduce((acc, curr) => acc + curr.quantidade, 0) || 0,
  [produtos]);
  
  const totalValor = useMemo(() => 
    produtos?.reduce((acc, curr) => acc + curr.total, 0) || 0,
  [produtos]);

  // Componente para exibir quando não há produtos
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

  // Handler para alternar ordenação
  const handleOrderByChange = (value: 'quantidade' | 'total') => {
    setOrderBy(value);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="w-full">
        <CardContent className="p-0 overflow-hidden">
          <div className="p-6 pb-0">
            <h3 className="text-lg font-semibold mb-4">
              Top Produtos por {orderBy === ORDENACAO.QUANTIDADE ? 'Quantidade' : 'Faturamento'}
            </h3>
            <div className="flex justify-end space-x-2 mb-4">
              <SortButton 
                active={orderBy === ORDENACAO.QUANTIDADE} 
                value={'quantidade'}
                currentValue={orderBy}
                onClick={handleOrderByChange}
              >
                Quantidade
              </SortButton>
              <SortButton 
                active={orderBy === ORDENACAO.TOTAL} 
                value={'total'}
                currentValue={orderBy}
                onClick={handleOrderByChange}
              >
                Faturamento
              </SortButton>
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
              <SortButton 
                active={orderBy === ORDENACAO.QUANTIDADE} 
                value={'quantidade'}
                currentValue={orderBy}
                onClick={handleOrderByChange}
              >
                <PlusCircle className="h-4 w-4 inline mr-1" /> Quantidade
              </SortButton>
              <SortButton 
                active={orderBy === ORDENACAO.TOTAL} 
                value={'total'}
                currentValue={orderBy}
                onClick={handleOrderByChange}
              >
                <MinusCircle className="h-4 w-4 inline mr-1" /> Faturamento
              </SortButton>
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
                    key={product.id || index} 
                    className={`border-b last:border-0 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-gray-100 transition-colors`}
                  >
                    <td className="py-3 pl-2">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                          <CategoryIcon category={product.categoria || ''} />
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
                      <FormatCurrency value={product.precoUnitario || product.preco || 0} />
                    </td>
                    <td className="py-3 text-right">
                      <span className="font-semibold">{product.quantidade}</span>
                    </td>
                    <td className="py-3 text-right font-semibold">
                      <FormatCurrency value={product.total} />
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t bg-gray-50">
                <tr>
                  <td className="py-3 font-semibold">Total</td>
                  <td colSpan={2}></td>
                  <td className="py-3 text-right font-semibold">
                    {totalQuantidade}
                  </td>
                  <td className="py-3 text-right font-semibold">
                    <FormatCurrency value={totalValor} />
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