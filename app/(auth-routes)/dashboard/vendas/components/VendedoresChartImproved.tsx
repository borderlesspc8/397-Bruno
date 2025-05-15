import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/_components/ui/card';
import { formatCurrency } from '@/app/_utils/format';
import { BadgeCheck, TrendingUp } from 'lucide-react';
import { cn } from '@/app/_lib/utils';
import { Vendedor as VendedorBetel } from '@/app/_services/betelTecnologia';

// Usamos a interface Vendedor importada diretamente do serviço BetelTecnologia
interface VendedoresChartImprovedProps {
  vendedores: VendedorBetel[];
  onVendedorClick?: (vendedor: VendedorBetel, index?: number) => void;
}

// Cores no estilo Material Design
const COLORS = [
  '#FFC107', // Amber 500
  '#2196F3', // Blue 500
  '#FF5722', // Deep Orange 500
  '#4CAF50', // Green 500
  '#9C27B0', // Purple 500
  '#F44336', // Red 500
  '#607D8B', // Blue Grey 500
  '#00BCD4', // Cyan 500
  '#009688', // Teal 500
  '#673AB7', // Deep Purple 500
];

export function VendedoresChartImproved({ vendedores, onVendedorClick }: VendedoresChartImprovedProps) {
  const [isClient, setIsClient] = useState(false);

  // Garantir que o componente só renderize completamente no cliente
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Preparar dados para o componente
  const dadosFormatados = useMemo(() => {
    if (!vendedores || vendedores.length === 0) return [];

    // Ordenar vendedores por valor de vendas (decrescente)
    const vendedoresOrdenados = [...vendedores]
      .sort((a, b) => b.faturamento - a.faturamento)
      .slice(0, 10); // Limitar a 10 vendedores para melhor visualização

    // Calcular o total de vendas para referência percentual
    const totalVendas = vendedoresOrdenados.reduce((acc, curr) => acc + curr.faturamento, 0);

    // Preparar dados formatados com percentuais e cores
    return vendedoresOrdenados.map((vendedor, index) => {
      const percentual = totalVendas > 0 ? (vendedor.faturamento / totalVendas) * 100 : 0;
      
      return {
        ...vendedor,
        valor: vendedor.faturamento,
        percentual: percentual,
        color: COLORS[index % COLORS.length],
      };
    });
  }, [vendedores]);

  // Calcular totais
  const totais = useMemo(() => {
    if (!vendedores || vendedores.length === 0) 
      return { valorTotal: 0, vendasTotal: 0 };
    
    return {
      valorTotal: vendedores.reduce((acc, curr) => acc + curr.faturamento, 0),
      vendasTotal: vendedores.reduce((acc, curr) => acc + curr.vendas, 0)
    };
  }, [vendedores]);

  if (!isClient) {
    return null; // Evita renderização no servidor
  }

  return (
    <Card className="mt-9 border-0 shadow-md dark:shadow-lg rounded-lg overflow-hidden transition-shadow duration-300 hover:shadow-xl" style={{ boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)' }}>
      <CardHeader className="px-6 py-5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg font-medium text-gray-800 dark:text-white">
              <TrendingUp className="h-5 w-5 text-amber-500" />
              Top Vendedores
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400 text-sm">
              Top 10 vendedores com maior faturamento no período
            </CardDescription>
          </div>
          
          {/* Resumo de totais */}
          <div className="text-right">
            <div className="text-sm text-gray-600 dark:text-gray-400">Total: <span className="font-medium text-amber-600 dark:text-amber-400">{formatCurrency(totais.valorTotal)}</span></div>
            <div className="text-xs text-gray-500 dark:text-gray-500">{totais.vendasTotal} vendas no período</div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0 py-2">
        {vendedores.length === 0 ? (
          <div className="flex items-center justify-center h-[300px]">
            <p className="text-gray-500 dark:text-gray-400">Nenhum vendedor encontrado no período selecionado</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-screen overflow-y-auto pr-1 custom-scrollbar">
            {dadosFormatados.map((vendedor, index) => (
              <div 
                key={vendedor.id} 
                className="group relative cursor-pointer bg-white dark:bg-gray-800 rounded-lg p-4 transition-all duration-300 hover:shadow-md border border-gray-100 dark:border-gray-700"
                onClick={() => onVendedorClick && onVendedorClick(vendedor, index)}
                style={{ transform: 'translateZ(0)' }}
              >
                <div className="flex items-center gap-4">
                  {/* Posição/Rank */}
                  <div className={cn(
                    "flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium shadow-sm transition-transform group-hover:scale-110",
                    index === 0 ? "bg-amber-500 text-white" : 
                    index === 1 ? "bg-blue-500 text-white" : 
                    index === 2 ? "bg-orange-500 text-white" : 
                    "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                  )}>
                    {index + 1}
                  </div>
                  
                  {/* Informações do vendedor */}
                  <div className="flex-1">
                    <div className="font-medium text-gray-800 dark:text-white flex items-center gap-1">
                      {vendedor.nome}
                      {index < 3 && <BadgeCheck className="h-4 w-4 text-amber-500" />}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                      {vendedor.vendas} {vendedor.vendas === 1 ? 'venda' : 'vendas'}
                      {vendedor.lojaNome && ` • ${vendedor.lojaNome}`}
                    </div>
                    
                    {/* Barra de progresso */}
                    <div className="mt-2 w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-500 group-hover:opacity-90"
                        style={{ 
                          width: `${Math.max(vendedor.percentual, 3)}%`, 
                          backgroundColor: vendedor.color,
                          boxShadow: '0 1px 3px rgba(0,0,0,0.12)'
                        }} 
                      />
                    </div>
                  </div>
                  
                  {/* Valor e percentual */}
                  <div className="text-right">
                    <div className="font-bold text-gray-900 dark:text-amber-400">
                      {formatCurrency(vendedor.valor)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {vendedor.percentual.toFixed(1)}% do total
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.15);
        }
      `}</style>
    </Card>
  );
} 