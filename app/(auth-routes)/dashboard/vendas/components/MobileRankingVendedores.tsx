import { useMemo, useState, useEffect } from 'react';
import { Vendedor } from "@/app/_services/betelTecnologia";
import { 
  ChevronRight,
  Medal,
  User,
  DollarSign,
  ShoppingCart,
  CreditCard,
  Target
} from 'lucide-react';
import { formatCurrency } from "@/app/_utils/format";
import { cn } from "@/app/_lib/utils";

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
  "FERNANDO LOYO": "fernando-loyo",
  "ADMINISTRATIVO": "administrativo"
};

interface MobileRankingVendedoresProps {
  vendedores: Vendedor[];
  ordenacao: "faturamento" | "vendas" | "ticket";
  onVendedorClick?: (vendedor: Vendedor) => void;
}

export function MobileRankingVendedores({
  vendedores,
  ordenacao,
  onVendedorClick
}: MobileRankingVendedoresProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [metas, setMetas] = useState<Meta[]>([]);
  const [metaAtual, setMetaAtual] = useState<Meta | null>(null);
  const [isLoadingMetas, setIsLoadingMetas] = useState(false);

  // Garantir que o componente só renderize no cliente
  useEffect(() => {
    setIsMounted(true);
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
    
    if (isMounted) {
      carregarMetas();
    }
  }, [isMounted]);

  // Filtrar vendedores específicos (Marcus, Diuly, Bruna, Fernando e Administrativo)
  const vendedoresFiltrados = useMemo(() => {
    if (!vendedores || vendedores.length === 0) return [];
    
    // Filtrar apenas os vendedores de interesse
    return vendedores.filter(vendedor => {
      const nomeNormalizado = vendedor.nome.toUpperCase();
      return (
        nomeNormalizado.includes("MARCUS") || 
        nomeNormalizado.includes("DIULY") || 
        nomeNormalizado.includes("BRUNA") || 
        nomeNormalizado.includes("FERNANDO") ||
        nomeNormalizado.includes("ADMINISTRATIVO")
      );
    });
  }, [vendedores]);

  // Ordenar vendedores com base no critério selecionado e adicionar dados de metas
  const vendedoresOrdenados = useMemo(() => {
    if (!vendedoresFiltrados || vendedoresFiltrados.length === 0) {
      return [];
    }
    
    // Criar uma cópia para não modificar o array original
    return [...vendedoresFiltrados]
      .sort((a, b) => {
        switch (ordenacao) {
          case "faturamento":
            return b.faturamento - a.faturamento;
          case "vendas":
            return b.vendas - a.vendas;
          case "ticket":
            return b.ticketMedio - a.ticketMedio;
          default:
            return b.faturamento - a.faturamento;
        }
      })
      .map(vendedor => {
        // Buscar meta do vendedor
        let metaVendedor = 0;
        let percentualMeta = 0;
        
        if (metaAtual) {
          // Normalizar o nome do vendedor
          const nomeNormalizado = vendedor.nome.toUpperCase();
          
          // Caso especial para o Fernando (usa a meta de Coordenador)
          if (nomeNormalizado.includes("FERNANDO")) {
            metaVendedor = metaAtual.metaCoordenador;
            percentualMeta = metaVendedor > 0 ? (vendedor.faturamento / metaVendedor) * 100 : 0;
          } 
          // Para os demais vendedores, buscar no array metasVendedores
          else if (metaAtual.metasVendedores) {
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
        }
        
        return {
          ...vendedor,
          meta: metaVendedor,
          percentualMeta: percentualMeta
        };
      })
      .slice(0, 15); // Limitar a 15 vendedores para melhor visualização
  }, [vendedoresFiltrados, ordenacao, metaAtual]);

  // Se não há vendedores, mostrar mensagem
  if (!isMounted || isLoadingMetas) {
    return <div className="py-6 text-center text-muted-foreground">Carregando dados...</div>;
  }

  if (!vendedoresOrdenados.length) {
    return <div className="py-6 text-center text-muted-foreground">Nenhum dado disponível</div>;
  }

  return (
    <div className="mt-2 pb-2">
      <div className="flex items-center justify-between mb-3 text-sm font-medium text-gray-400 border-b border-gray-700 pb-2">
        <div>
          Evolução Vendas vs Metas
        </div>
        <div>
          {ordenacao === "faturamento" ? "Valor" : 
           ordenacao === "vendas" ? "Qtde" : 
           "Ticket"}
        </div>
      </div>

      <div className="space-y-3">
        {vendedoresOrdenados.map((vendedor, index) => {
          // Definir cores de fundo para os itens
          let bgColor = "bg-gray-800/50";
          
          // Os três primeiros terão cores destacadas
          if (index < 3) {
            bgColor = "bg-purple-900/90";
          }
          
          // Estilo para medalhas/posições com cores diferentes para os 3 primeiros
          let medalhaStyle = "bg-gray-200 text-gray-800"; // Padrão para posição 4+
          
          if (index === 0) {
            // Ouro - dourado/amarelo
            medalhaStyle = "bg-amber-400 text-amber-950"; 
          } else if (index === 1) {
            // Prata - prateado/cinza claro
            medalhaStyle = "bg-gray-300 text-gray-800";
          } else if (index === 2) {
            // Bronze - bronze/marrom
            medalhaStyle = "bg-amber-700 text-amber-50";
          }
          
          // Ícone com base na ordenação
          const IconComponent = ordenacao === "faturamento" ? DollarSign : 
                               ordenacao === "vendas" ? ShoppingCart : 
                               CreditCard;
          
          // Valor a ser exibido no card
          const valorExibido = ordenacao === "faturamento" ? formatCurrency(vendedor.faturamento) :
                               ordenacao === "vendas" ? vendedor.vendas :
                               formatCurrency(vendedor.ticketMedio);
          
          return (
            <div 
              key={vendedor.id || index} 
              className="relative cursor-pointer" 
              onClick={() => onVendedorClick && onVendedorClick(vendedor)}
            >
              {/* Card do item */}
              <div className={`rounded-lg ${bgColor} relative overflow-hidden py-3`}>
                {/* Conteúdo */}
                <div className="flex items-center relative z-10 px-3 pr-6">
                  {/* Medalha/Posição */}
                  <div 
                    className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full text-sm font-bold mr-3 ${medalhaStyle}`}
                    aria-label={index === 0 ? "Primeiro lugar - Ouro" : 
                              index === 1 ? "Segundo lugar - Prata" : 
                              index === 2 ? "Terceiro lugar - Bronze" : 
                              `Posição ${index + 1}`}
                  >
                    {index < 3 ? 
                      <Medal className="h-5 w-5" /> : 
                      (index + 1)
                    }
                  </div>
                  
                  {/* Informações do vendedor */}
                  <div className="flex-1 flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <User className="h-4 w-4 text-gray-400" />
                      <div className="font-medium text-white">{vendedor.nome}</div>
                    </div>
                    <div className="text-sm text-gray-400 mt-0.5">
                      {ordenacao !== "vendas" && 
                        <span className="mr-2">{vendedor.vendas} vendas</span>
                      }
                      {ordenacao !== "faturamento" && 
                        <span>{formatCurrency(vendedor.faturamento)}</span>
                      }
                    </div>

                    {/* Barra de progresso em relação à meta */}
                    {vendedor.meta > 0 && (
                      <div className="mt-2 relative w-full">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="flex items-center text-gray-500 dark:text-gray-400">
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
                  
                  {/* Valor em destaque */}
                  <div className="flex items-center">
                    <div className="text-blue-400 font-bold text-lg mr-1">
                      {ordenacao === "vendas" ? 
                        vendedor.vendas : 
                        <IconComponent className="h-5 w-5 text-amber-400 mr-1.5 inline-block" />
                      }
                      {ordenacao !== "vendas" && ordenacao === "faturamento" ? 
                        formatCurrency(vendedor.faturamento).replace("R$", "") : 
                        ordenacao === "ticket" ? 
                        formatCurrency(vendedor.ticketMedio).replace("R$", "") : 
                        ""
                      }
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {vendedores.length > 15 && (
        <div className="mt-3 pt-2 text-center text-xs text-muted-foreground">
          Mostrando 15 de {vendedores.length} vendedores disponíveis
        </div>
      )}
    </div>
  );
} 