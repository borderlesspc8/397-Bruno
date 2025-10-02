import { useState, useEffect, useMemo } from 'react';
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
  "MARCUS VINICIUS MACEDO": "marcus-vinicius-macedo-unidade-matriz",
  "DIULY MORAES": "diuly-moraes-filial-golden",
  "BRUNA RAMOS": "bruna-ramos-filial-golden",
  "FERNANDO LOYO": "fernando-loyo-unidade-matriz",
  "ALYNE LIMA": "alyne-lima-unidade-matriz",
  "ADMINISTRATIVO": "administrativo"
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

  // Buscar metas do servidor - OTIMIZADO COM CACHE
  useEffect(() => {
    // Verificar se já há metas carregadas globalmente
    if (window.__METAS_CACHE__) {
      setMetas(window.__METAS_CACHE__);
      setMetaAtual(window.__META_ATUAL_CACHE__);
      setIsLoadingMetas(false);
      return;
    }

    const carregarMetas = async () => {
      setIsLoadingMetas(true);
      try {
        const response = await fetch("/api/dashboard/metas", {
          cache: 'force-cache', // Usar cache para evitar múltiplas chamadas
          headers: {
            'Cache-Control': 'max-age=300' // Cache por 5 minutos
          }
        });
        
        if (!response.ok) {
          throw new Error(`Erro ao carregar metas: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Converter datas para objetos Date
        const metasFormatadas = data.map((meta: any) => ({
          ...meta,
          mesReferencia: new Date(meta.mesReferencia),
          metasVendedores: Array.isArray(meta.metasVendedores) 
            ? meta.metasVendedores 
            : typeof meta.metasVendedores === 'string'
              ? JSON.parse(meta.metasVendedores)
              : []
        }));
        
        // Armazenar no cache global
        window.__METAS_CACHE__ = metasFormatadas;
        
        setMetas(metasFormatadas);
        
        // Obter a meta mais recente (considerando o mês atual)
        const hoje = new Date();
        const mesAtual = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        
        // Tenta encontrar a meta para o mês atual
        let metaDoMesAtual = metasFormatadas.find((meta: Meta) => {
          const mesRef = new Date(meta.mesReferencia);
          return mesRef.getMonth() === mesAtual.getMonth() && 
                 mesRef.getFullYear() === mesAtual.getFullYear();
        });
        
        // Se não encontrar meta para o mês atual, pega a meta mais recente
        if (!metaDoMesAtual && metasFormatadas.length > 0) {
          metaDoMesAtual = metasFormatadas.sort((a: Meta, b: Meta) => 
            new Date(b.mesReferencia).getTime() - new Date(a.mesReferencia).getTime()
          )[0];
        }
        
        // Meta atual selecionada
        const metaAtual = metaDoMesAtual || null;
        window.__META_ATUAL_CACHE__ = metaAtual;
        setMetaAtual(metaAtual);
      } catch (error) {
        console.error("❌ Erro ao carregar metas:", error);
      } finally {
        setIsLoadingMetas(false);
      }
    };
    
    carregarMetas();
  }, []);

  // Usar todos os vendedores sem filtro
  const vendedoresFiltrados = useMemo(() => {
    if (!vendedores || vendedores.length === 0) return [];
    return vendedores;
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
      
      if (metaAtual?.metasVendedores) {
        // Gerar o ID do vendedor no formato correto
        const nomeNormalizado = vendedor.nome.toUpperCase();
        let vendedorId = "";
        
        // Caso especial para o Fernando (usa a meta de Coordenador)
        if (nomeNormalizado.includes("FERNANDO")) {
          metaVendedor = metaAtual.metaCoordenador;
        } else {
          // Buscar o ID exato do vendedor
          for (const [nome, id] of Object.entries(VENDEDORES_MAPEAMENTO)) {
            if (nomeNormalizado.includes(nome)) {
              vendedorId = id;
              break; // Sai do loop assim que encontrar o primeiro match
            }
          }

          if (vendedorId) {
            // Buscar meta do vendedor pelo ID exato
            const vendedorMeta = metaAtual.metasVendedores.find(mv => {
              const idNormalizado = mv.vendedorId.toLowerCase().replace(/[()-]/g, '');
              const vendedorIdNormalizado = vendedorId.toLowerCase().replace(/[()-]/g, '');
              return idNormalizado === vendedorIdNormalizado;
            });

            if (vendedorMeta) {
              metaVendedor = vendedorMeta.meta;
            }
          } else {
            console.log(`⚠️ Não foi possível determinar o ID para ${vendedor.nome}`);
          }
        }
        
        // Calcular percentual apenas se houver meta
        if (metaVendedor > 0) {
          percentualMeta = (vendedor.faturamento / metaVendedor) * 100;
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
  }, [vendedoresFiltrados, metaAtual?.metasVendedores, metaAtual?.metaCoordenador]);

  // Calcular totais apenas com vendedores não administrativos
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
    <div className="ios26-chart-container ios26-animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="flex items-center gap-3 text-xl font-bold text-foreground">
            <div className="p-2 bg-gradient-to-br from-orange-100 to-yellow-100 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-2xl">
              <TrendingUp className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            Evolução Vendas vs Metas
          </h3>
          <p className="text-muted-foreground text-sm mt-1">
            Acompanhamento de vendedores em relação às metas
          </p>
        </div>
        
        {/* Resumo de totais */}
        <div className="text-right">
          <div className="text-sm text-muted-foreground">
            Total: <span className="ios26-currency-small text-orange-600 dark:text-orange-400">{formatCurrency(totais.valorTotal)}</span>
          </div>
          <div className="text-xs text-muted-foreground">{totais.vendasTotal} vendas no período</div>
        </div>
      </div>
      
      {isLoadingMetas ? (
        <div className="flex items-center justify-center h-[300px]">
          <div className="ios26-skeleton h-8 w-48" />
        </div>
      ) : vendedoresFiltrados.length === 0 ? (
        <div className="flex items-center justify-center h-[300px]">
          <p className="text-muted-foreground">Nenhum vendedor encontrado no período selecionado</p>
        </div>
      ) : (
        <div className="space-y-4 max-h-screen overflow-y-auto pr-1 custom-scrollbar">
          {dadosFormatados.map((vendedor, index) => (
            <div 
              key={vendedor.id} 
              className="group relative cursor-pointer ios26-card p-4 transition-all duration-300 hover:shadow-lg"
              onClick={() => onVendedorClick && onVendedorClick(vendedor, index)}
              style={{ transform: 'translateZ(0)' }}
            >
              <div className="flex items-center gap-4">
                {/* Posição/Rank */}
                <div className={cn(
                  "flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-bold shadow-sm transition-transform group-hover:scale-110",
                  index === 0 ? "bg-gradient-to-br from-yellow-400 to-orange-500 text-white" : 
                  index === 1 ? "bg-gradient-to-br from-blue-400 to-blue-600 text-white" : 
                  index === 2 ? "bg-gradient-to-br from-orange-400 to-red-500 text-white" : 
                  "bg-gradient-to-br from-gray-200 to-gray-300 text-gray-700 dark:from-gray-700 dark:to-gray-600 dark:text-gray-300"
                )}>
                  {index + 1}
                </div>
                
                {/* Informações do vendedor */}
                <div className="flex-1">
                  <div className="font-semibold text-foreground flex items-center gap-2">
                    {vendedor.nome}
                    {index < 3 && <BadgeCheck className="h-4 w-4 text-orange-500" />}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {vendedor.vendas} {vendedor.vendas === 1 ? 'venda' : 'vendas'}
                    {vendedor.lojaNome && ` • ${vendedor.lojaNome}`}
                  </div>
                    
                  {/* Barra de progresso de vendas totais */}
                  <div className="mt-3 ios26-progress">
                    <div 
                      className="ios26-progress-bar transition-all duration-500 group-hover:opacity-90"
                      style={{ 
                        width: `${Math.max(vendedor.percentual, 3)}%`, 
                        backgroundColor: vendedor.color,
                        boxShadow: '0 1px 3px rgba(0,0,0,0.12)'
                      }} 
                    />
                  </div>
                  
                  {/* Barra de progresso em relação à meta - Garantir que seja exibida */}
                  {vendedor.meta > 0 && (
                    <div className="mt-3 relative w-full">
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="flex items-center text-muted-foreground font-medium">
                          <Target className="h-3 w-3 mr-1" /> Meta: {formatCurrency(vendedor.meta)}
                        </span>
                        <span className={cn(
                          "font-semibold",
                          vendedor.percentualMeta >= 100 
                            ? "text-green-600 dark:text-green-400" 
                            : vendedor.percentualMeta >= 70 
                              ? "text-orange-600 dark:text-orange-400"
                              : "text-red-600 dark:text-red-400"
                        )}>
                          {vendedor.percentualMeta.toFixed(1)}%
                        </span>
                      </div>
                      <div className="ios26-progress">
                        <div 
                          className={cn(
                            "ios26-progress-bar transition-all duration-500",
                            vendedor.percentualMeta >= 100 
                              ? "bg-gradient-to-r from-green-500 to-green-600" 
                              : vendedor.percentualMeta >= 70 
                                ? "bg-gradient-to-r from-orange-500 to-yellow-500"
                                : "bg-gradient-to-r from-red-500 to-red-600"
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
                  <div className="ios26-currency-medium text-orange-600 dark:text-orange-400">
                    {formatCurrency(vendedor.valor)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {vendedor.percentual.toFixed(1)}% do total
                  </div>
                </div>
              </div>
            </div>
            ))}
          </div>
        )}
    </div>
  );
} 