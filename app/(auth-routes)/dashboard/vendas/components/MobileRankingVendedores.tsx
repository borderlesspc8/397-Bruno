import { useMemo, useState, useEffect } from 'react';
import { Vendedor } from "@/app/_services/betelTecnologia";
import { 
  ChevronRight,
  Medal,
  User,
  DollarSign,
  ShoppingCart,
  CreditCard
} from 'lucide-react';
import { formatCurrency } from "@/app/_utils/format";

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

  // Garantir que o componente só renderize no cliente
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Ordenar vendedores com base no critério selecionado
  const vendedoresOrdenados = useMemo(() => {
    if (!vendedores || vendedores.length === 0) {
      return [];
    }
    
    // Criar uma cópia para não modificar o array original
    return [...vendedores]
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
      .slice(0, 15); // Limitar a 15 vendedores para melhor visualização
  }, [vendedores, ordenacao]);

  // Se não há vendedores, mostrar mensagem
  if (!isMounted || !vendedoresOrdenados.length) {
    return <div className="py-6 text-center text-muted-foreground">Nenhum dado disponível</div>;
  }

  return (
    <div className="mt-2 pb-2">
      <div className="flex items-center justify-between mb-3 text-sm font-medium text-gray-400 border-b border-gray-700 pb-2">
        <div>
          Ranking ({ordenacao === "faturamento" ? "faturamento" : 
                    ordenacao === "vendas" ? "vendas" : 
                    "ticket médio"})
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