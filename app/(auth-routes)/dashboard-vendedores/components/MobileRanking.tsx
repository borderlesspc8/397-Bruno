import { ProdutoItem, OrdenacaoTipo } from './hooks/useProdutosMaisVendidos';
import { 
  ChevronRight,
  Medal,
} from 'lucide-react';

interface MobileRankingProps {
  produtos: ProdutoItem[];
  ordenacao: OrdenacaoTipo;
  corDestaque: string;
  formatarDinheiro: (valor: number) => string;
  formatarMargem?: (valor: number | string) => string;
  onItemClick: (produto: ProdutoItem) => void;
}

export function MobileRanking({
  produtos,
  ordenacao,
  corDestaque,
  formatarDinheiro,
  formatarMargem,
  onItemClick
}: MobileRankingProps) {
  if (!produtos.length) {
    return <div className="py-6 text-center text-muted-foreground">Nenhum dado disponível</div>;
  }

  // Limitar a 15 produtos para melhor visualização
  const produtosExibidos = produtos.slice(0, 15);
  
  return (
    <div className="mt-2 pb-2">
      <div className="flex items-center justify-between mb-3 text-sm font-medium text-gray-400 border-b border-gray-700 pb-2">
        <div>Ranking ({ordenacao === "quantidade" ? "quantidade" : ordenacao === "valor" ? "faturamento" : "lucro"})</div>
        <div>
          {ordenacao === "quantidade" ? "Qtde" : 
           ordenacao === "valor" ? "Valor" : 
           "Lucro"}
        </div>
      </div>

      <div className="space-y-2">
        {produtosExibidos.map((produto, index) => {
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
                      
          return (
            <div 
              key={index} 
              className="relative cursor-pointer" 
              onClick={() => onItemClick(produto)}
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
                  
                  {/* Informações do produto */}
                  <div className="flex-1 flex flex-col">
                    <div className="font-medium text-white">{produto.nome}</div>
                    <div className="text-sm text-gray-400 mt-0.5">
                      {formatarDinheiro(produto.valor)}
                    </div>
                  </div>
                  
                  {/* Quantidade em destaque */}
                  <div className="flex items-center">
                    <div className="text-blue-400 font-bold text-xl mr-1">
                      {produto.quantidade}
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {produtos.length > 15 && (
        <div className="mt-3 pt-2 text-center text-xs text-muted-foreground">
          Mostrando 15 de {produtos.length} itens disponíveis
        </div>
      )}
    </div>
  );
} 