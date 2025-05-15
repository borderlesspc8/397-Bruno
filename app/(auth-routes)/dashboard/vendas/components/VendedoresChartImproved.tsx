import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/_components/ui/card';
import { formatCurrency } from '@/app/_utils/format';
import { BadgeCheck, TrendingUp, Target } from 'lucide-react';
import { cn } from '@/app/_lib/utils';
import { Vendedor as VendedorBetel } from '@/app/_services/betelTecnologia';

// Usamos a interface Vendedor importada diretamente do serviço BetelTecnologia
interface VendedoresChartImprovedProps {
  vendedores: VendedorBetel[];
  onVendedorClick?: (vendedor: VendedorBetel, index?: number) => void;
}

// Interface para metas
interface Meta {
  id: string;
  mesReferencia: Date;
  metaMensal: number;
  metaSalvio: number;
  metaCoordenador: number;
  metasVendedores?: Array<{
    vendedorId: string;
    nome: string;
    meta: number;
  }>;
}

// Objeto de mapeamento entre nomes de vendedores e IDs usados no sistema de metas
const VENDEDORES_MAPEAMENTO = {
  "MARCUS VINICIUS MACEDO": "marcus-vinicius",
  "DIULY MORAES": "diuly-moraes",
  "BRUNA RAMOS": "bruna-ramos",
  "FERNANDO LOYO": "fernando-loyo"
};

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
  const [metas, setMetas] = useState<Meta[]>([]);
  const [metaAtual, setMetaAtual] = useState<Meta | null>(null);
  const [isLoadingMetas, setIsLoadingMetas] = useState(false);

  // Garantir que o componente só renderize completamente no cliente
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Buscar metas do servidor
  useEffect(() => {
    const carregarMetas = async () => {
      setIsLoadingMetas(true);
      try {
        const response = await fetch("/api/dashboard/metas");
        if (response.ok) {
          const data = await response.json();
          
          // Converter datas para objetos Date
          const metasFormatadas = data.map((meta: any) => ({
            ...meta,
            mesReferencia: new Date(meta.mesReferencia)
          }));
          
          setMetas(metasFormatadas);
          
          // Obter a meta mais recente (considerando o mês atual)
          const hoje = new Date();
          const mesAtual = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
          
          // Tenta encontrar a meta para o mês atual
          let metaDoMesAtual = metasFormatadas.find((meta: Meta) => 
            meta.mesReferencia.getMonth() === mesAtual.getMonth() && 
            meta.mesReferencia.getFullYear() === mesAtual.getFullYear()
          );
          
          // Se não encontrar meta para o mês atual, pega a meta mais recente
          if (!metaDoMesAtual && metasFormatadas.length > 0) {
            metaDoMesAtual = metasFormatadas.sort((a: Meta, b: Meta) => 
              new Date(b.mesReferencia).getTime() - new Date(a.mesReferencia).getTime()
            )[0];
          }
          
          setMetaAtual(metaDoMesAtual || null);
        } else {
          console.error("Erro ao carregar metas:", await response.text());
        }
      } catch (error) {
        console.error("Erro ao carregar metas:", error);
      } finally {
        setIsLoadingMetas(false);
      }
    };
    
    carregarMetas();
  }, []);

  // Filtrar vendedores específicos (Marcus, Diuly, Bruna e Fernando)
  const vendedoresFiltrados = useMemo(() => {
    if (!vendedores || vendedores.length === 0) return [];
    
    // Filtrar apenas os vendedores de interesse
    return vendedores.filter(vendedor => {
      const nomeNormalizado = vendedor.nome.toUpperCase();
      return (
        nomeNormalizado.includes("MARCUS") || 
        nomeNormalizado.includes("DIULY") || 
        nomeNormalizado.includes("BRUNA") || 
        nomeNormalizado.includes("FERNANDO")
      );
    });
  }, [vendedores]);

  // Preparar dados para o componente, incluindo metas
  const dadosFormatados = useMemo(() => {
    if (!vendedoresFiltrados || vendedoresFiltrados.length === 0) return [];

    // Ordenar vendedores por valor de vendas (decrescente)
    const vendedoresOrdenados = [...vendedoresFiltrados]
      .sort((a, b) => b.faturamento - a.faturamento);

    // Calcular o total de vendas para referência percentual
    const totalVendas = vendedoresOrdenados.reduce((acc, curr) => acc + curr.faturamento, 0);

    // Preparar dados formatados com percentuais, metas e cores
    return vendedoresOrdenados.map((vendedor, index) => {
      const percentual = totalVendas > 0 ? (vendedor.faturamento / totalVendas) * 100 : 0;
      
      // Buscar meta do vendedor
      let metaVendedor = 0;
      let percentualMeta = 0;
      
      if (metaAtual && metaAtual.metasVendedores) {
        // Normalizar o nome do vendedor
        const nomeNormalizado = vendedor.nome.toUpperCase();
        let vendedorId = "";
        
        // Identificar o ID do vendedor com base no nome
        Object.entries(VENDEDORES_MAPEAMENTO).forEach(([nome, id]) => {
          if (nomeNormalizado.includes(nome)) {
            vendedorId = id;
          }
        });
        
        // Buscar meta do vendedor pelo ID
        const vendedorMeta = metaAtual.metasVendedores.find(mv => mv.vendedorId === vendedorId);
        
        if (vendedorMeta) {
          metaVendedor = vendedorMeta.meta;
          percentualMeta = metaVendedor > 0 ? (vendedor.faturamento / metaVendedor) * 100 : 0;
        }
      }
      
      return {
        ...vendedor,
        valor: vendedor.faturamento,
        percentual: percentual,
        color: COLORS[index % COLORS.length],
        meta: metaVendedor,
        percentualMeta: percentualMeta
      };
    });
  }, [vendedoresFiltrados, metaAtual]);

  // Calcular totais
  const totais = useMemo(() => {
    if (!vendedoresFiltrados || vendedoresFiltrados.length === 0) 
      return { valorTotal: 0, vendasTotal: 0 };
    
    return {
      valorTotal: vendedoresFiltrados.reduce((acc, curr) => acc + curr.faturamento, 0),
      vendasTotal: vendedoresFiltrados.reduce((acc, curr) => acc + curr.vendas, 0)
    };
  }, [vendedoresFiltrados]);

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
              Evolução Vendas vs Metas
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400 text-sm">
              Acompanhamento de vendedores em relação às metas
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
        {isLoadingMetas ? (
          <div className="flex items-center justify-center h-[300px]">
            <p className="text-gray-500 dark:text-gray-400">Carregando dados...</p>
          </div>
        ) : vendedoresFiltrados.length === 0 ? (
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
                    
                    {/* Barra de progresso de vendas totais */}
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
                    
                    {/* Barra de progresso em relação à meta */}
                    {vendedor.meta > 0 && (
                      <div className="mt-2 relative w-full">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="flex items-center text-gray-600 dark:text-gray-400">
                            <Target className="h-3 w-3 mr-1" /> Meta: {formatCurrency(vendedor.meta)}
                          </span>
                          <span className={cn(
                            "font-medium",
                            vendedor.percentualMeta >= 100 
                              ? "text-green-600 dark:text-green-400" 
                              : vendedor.percentualMeta >= 70 
                                ? "text-amber-600 dark:text-amber-400"
                                : "text-red-600 dark:text-red-400"
                          )}>
                            {vendedor.percentualMeta.toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className={cn(
                              "h-full rounded-full transition-all duration-500",
                              vendedor.percentualMeta >= 100 
                                ? "bg-green-500" 
                                : vendedor.percentualMeta >= 70 
                                  ? "bg-amber-500"
                                  : "bg-red-500"
                            )}
                            style={{ 
                              width: `${Math.min(Math.max(vendedor.percentualMeta, 3), 100)}%`,
                            }} 
                          />
                        </div>
                      </div>
                    )}
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