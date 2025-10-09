import { ReactNode, useEffect, useState } from 'react';
import { ProdutoItem, OrdenacaoTipo, VisualizacaoTipo } from './hooks/useProdutosMaisVendidos';
import { GraficoMUI } from './GraficoMUI';
import { TabelaMUI } from './TabelaMUI';
import { ChevronDown } from 'lucide-react';
import { MobileRanking } from './MobileRanking';

interface CategoriaCardProps {
  titulo: string;
  icone: ReactNode;
  produtos: ProdutoItem[];
  corGrafico: string;
  ordenacao: OrdenacaoTipo;
  visualizacao: VisualizacaoTipo;
  formatarDinheiro: (valor: number) => string;
  formatarMargem: (valor: number | string) => string;
  onItemClick: (produto: ProdutoItem) => void;
  expanded: boolean;
  onToggleExpand: () => void;
}

export function CategoriaCard({
  titulo,
  icone,
  produtos,
  corGrafico,
  ordenacao,
  visualizacao,
  formatarDinheiro,
  formatarMargem,
  onItemClick,
  expanded,
  onToggleExpand
}: CategoriaCardProps) {
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
    return null;
  }
  
  // Truncar título se for muito longo em telas móveis
  const tituloExibido = isMobile && titulo.length > 35
    ? titulo.substring(0, 35) + '...'
    : titulo;

  return (
    <div className="mb-6 bg-card border rounded-lg shadow-md overflow-hidden">
      <button 
        onClick={onToggleExpand}
        className="w-full flex items-center justify-between p-4 text-left focus:outline-none focus:ring-2 focus:ring-amber-500 hover:bg-muted/10 transition-colors duration-200"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-2">
          <div className={`text-xl ${isMobile ? 'hidden sm:block' : ''}`}>{icone}</div>
          <div>
            <h3 className="text-lg font-semibold">{tituloExibido}</h3>
            <span className="text-sm text-muted-foreground mt-1 block">
              {produtos.length} {produtos.length === 1 ? 'item' : 'itens'} 
              {!isMobile && <> • Clique para {expanded ? 'recolher' : 'expandir'}</>}
            </span>
          </div>
        </div>
        
        <div className={`transform transition-transform duration-300 text-muted-foreground ${expanded ? 'rotate-180' : ''}`}>
          <ChevronDown className="w-5 h-5" />
        </div>
      </button>
      
      {expanded && (
        <div className="p-4 pt-0">
          {/* Visualização por tipo e dispositivo */}
          {isMobile ? (
            // Versão especial para dispositivos móveis
            <>
              {/* Em celulares, usamos o ranking visual independente da preferência do usuário */}
              <MobileRanking
                produtos={produtos}
                ordenacao={ordenacao}
                corDestaque={corGrafico}
                formatarDinheiro={formatarDinheiro}
                formatarMargem={formatarMargem}
                onItemClick={onItemClick}
              />
              
              {/* Alternativamente, podemos mostrar a tabela se o usuário preferir */}
              {visualizacao === "tabela" && (
                <TabelaMUI
                  produtos={produtos}
                  onItemClick={onItemClick}
                  formatarDinheiro={formatarDinheiro}
                  formatarMargem={formatarMargem}
                  titulo={titulo.includes("Produto") ? "Produto" : "Acessório"}
                  altura={isMobile ? 400 : 500}
                />
              )}
            </>
          ) : (
            // Versão padrão para desktop
            visualizacao === "grafico" ? (
              <GraficoMUI
                produtos={produtos}
                ordenacao={ordenacao}
                formatarDinheiro={formatarDinheiro}
                onItemClick={onItemClick}
                corGrafico={corGrafico}
                altura={400}
              />
            ) : (
              <TabelaMUI
                produtos={produtos}
                onItemClick={onItemClick}
                formatarDinheiro={formatarDinheiro}
                formatarMargem={formatarMargem}
                titulo={titulo.includes("Produto") ? "Produto" : "Acessório"}
                altura={500}
              />
            )
          )}
        </div>
      )}
    </div>
  );
} 