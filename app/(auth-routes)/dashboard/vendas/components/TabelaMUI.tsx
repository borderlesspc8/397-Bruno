import { useState, useEffect } from 'react';
import { ProdutoItem } from './hooks/useProdutosMaisVendidos';
import { ArrowRight } from 'lucide-react';

interface TabelaMUIProps {
  produtos: ProdutoItem[];
  onItemClick: (produto: ProdutoItem) => void;
  formatarDinheiro: (valor: number) => string;
  formatarMargem: (valor: number | string) => string;
  titulo: string;
  altura?: number;
}

export function TabelaMUI({
  produtos,
  onItemClick,
  formatarDinheiro,
  formatarMargem,
  titulo,
  altura = 350
}: TabelaMUIProps) {
  // Estado para armazenar se estamos em um dispositivo móvel
  const [isMobile, setIsMobile] = useState(false);
  
  // Detectar tela mobile
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Verificar na primeira renderização
    checkIsMobile();
    
    // Verificar quando a tela for redimensionada
    window.addEventListener('resize', checkIsMobile);
    
    // Limpar o evento quando o componente for desmontado
    return () => {
      window.removeEventListener('resize', checkIsMobile);
    };
  }, []);

  if (produtos.length === 0) {
    return (
      <div className="flex items-center justify-center h-[150px]" aria-label="Sem dados para exibir">
        <p className="text-muted-foreground">Nenhum dado disponível</p>
      </div>
    );
  }

  // Calcular altura dinâmica baseada no número de itens
  // Cada linha precisa de pelo menos 48px para boa visibilidade
  const alturaMinimaPorLinha = 48;
  const alturaCalculada = Math.max(altura, (produtos.length + 1) * alturaMinimaPorLinha);

  return (
    <div className="overflow-auto mt-2" style={{ maxHeight: `${alturaCalculada}px` }}>
      {isMobile ? (
        // Versão para dispositivos móveis (cards empilhados)
        <div className="space-y-3">
          {produtos.map((produto, index) => (
            <div 
              key={index} 
              className="bg-card/50 border border-border/50 rounded-lg p-3 hover:bg-muted/30 cursor-pointer transition-colors duration-200"
              onClick={() => onItemClick(produto)}
            >
              <div className="font-medium text-base mb-1.5 line-clamp-2">{produto.nome}</div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground mr-1">Qtde:</span>
                  <span className="font-medium">{produto.quantidade}</span>
                </div>
                <div>
                  <span className="text-muted-foreground mr-1">Valor:</span>
                  <span className="font-medium">{formatarDinheiro(produto.valor)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground mr-1">Lucro:</span>
                  <span className="font-medium">{formatarDinheiro(produto.margem || 0)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground mr-1">Margem:</span>
                  <span className="font-medium">{formatarMargem(produto.margemPercentual)}</span>
                </div>
              </div>
              <div className="mt-2 text-xs flex items-center justify-end text-amber-600 dark:text-amber-400">
                <span>Ver detalhes</span>
                <ArrowRight className="ml-1 h-3 w-3" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Versão para desktop (tabela tradicional)
        <table className="w-full" role="grid" aria-label={`Lista de ${titulo.toLowerCase()}`}>
          <thead className="text-sm bg-muted/50 sticky top-0 font-medium">
            <tr>
              <th className="px-4 py-3 text-left">{titulo}</th>
              <th className="px-4 py-3 text-right">Qtde</th>
              <th className="px-4 py-3 text-right">Faturamento</th>
              <th className="px-4 py-3 text-right">Lucro</th>
              <th className="px-4 py-3 text-right">Margem %</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {produtos.map((produto, index) => (
              <tr 
                key={index} 
                className="hover:bg-muted/30 cursor-pointer transition-colors duration-200" 
                onClick={() => onItemClick(produto)}
              >
                <td className="px-4 py-3 font-medium text-base">{produto.nome}</td>
                <td className="px-4 py-3 text-right text-base">{produto.quantidade}</td>
                <td className="px-4 py-3 text-right text-base">{formatarDinheiro(produto.valor)}</td>
                <td className="px-4 py-3 text-right text-base">{formatarDinheiro(produto.margem || 0)}</td>
                <td className="px-4 py-3 text-right text-base">
                  {formatarMargem(produto.margemPercentual)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
} 