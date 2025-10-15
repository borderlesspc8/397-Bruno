import { useState } from 'react';
import { OrdenacaoTipo, VisualizacaoTipo } from './hooks/useProdutosMaisVendidos';
import { ArrowUpDown, TrendingUp, BarChart2, TableIcon, ActivityIcon, FilterIcon } from 'lucide-react';

interface FiltrosInteligentesProp {
  ordenacao: OrdenacaoTipo;
  visualizacao: VisualizacaoTipo;
  onChangeOrdenacao: (tipo: OrdenacaoTipo) => void;
  onChangeVisualizacao: (tipo: VisualizacaoTipo) => void;
}

export function FiltrosInteligentes({
  ordenacao,
  visualizacao,
  onChangeOrdenacao,
  onChangeVisualizacao
}: FiltrosInteligentesProp) {
  // Estado para controlar se os filtros estão colapsados em telas móveis
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);

  // Função para alternar a visibilidade dos filtros em telas móveis
  const toggleFiltros = () => setFiltrosAbertos(!filtrosAbertos);

  return (
    <div className="mb-6 bg-card/30 rounded-lg border border-accent/20">
      {/* Cabeçalho dos filtros - sempre visível */}
      <div className="p-4 flex items-center justify-between">
        <h3 className="text-base font-medium flex items-center gap-2">
          <ActivityIcon className="w-4 h-4 text-amber-500" />
          <span>Opções de visualização</span>
        </h3>
        
        {/* Botão para mostrar/ocultar filtros em telas pequenas */}
        <button
          onClick={toggleFiltros}
          className="md:hidden flex items-center gap-1 px-3 py-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-md text-sm"
          aria-expanded={filtrosAbertos}
        >
          <FilterIcon className="w-4 h-4" />
          <span>{filtrosAbertos ? 'Ocultar' : 'Mostrar'}</span>
        </button>
      </div>
      
      {/* Conteúdo dos filtros - responsivo */}
      <div className={`px-4 pb-4 ${filtrosAbertos ? 'block' : 'hidden md:block'}`}>
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground mb-1">Ordenar por:</div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => onChangeOrdenacao("quantidade")}
                className={`flex items-center gap-2 py-2 px-3 rounded-md text-sm transition-all duration-200 ${
                  ordenacao === "quantidade" 
                    ? "bg-amber-500 text-white shadow-md" 
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                }`}
                aria-pressed={ordenacao === "quantidade"}
                aria-label="Ordenar por quantidade"
              >
                <ArrowUpDown className="h-4 w-4" />
                <span>Quantidade</span>
              </button>
              
              <button
                onClick={() => onChangeOrdenacao("valor")}
                className={`flex items-center gap-2 py-2 px-3 rounded-md text-sm transition-all duration-200 ${
                  ordenacao === "valor" 
                    ? "bg-amber-500 text-white shadow-md" 
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                }`}
                aria-pressed={ordenacao === "valor"}
                aria-label="Ordenar por faturamento"
              >
                <TrendingUp className="h-4 w-4" />
                <span>Faturamento</span>
              </button>
              
              <button
                onClick={() => onChangeOrdenacao("margem")}
                className={`flex items-center gap-2 py-2 px-3 rounded-md text-sm transition-all duration-200 ${
                  ordenacao === "margem" 
                    ? "bg-amber-500 text-white shadow-md" 
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                }`}
                aria-pressed={ordenacao === "margem"}
                aria-label="Ordenar por lucro"
              >
                <TrendingUp className="h-4 w-4" />
                <span>Lucro</span>
              </button>
            </div>
          </div>
          
          <div className="space-y-2 mt-4 md:mt-0">
            <div className="text-sm text-muted-foreground mb-1">Formato:</div>
            <div className="flex gap-2">
              <button
                onClick={() => onChangeVisualizacao("grafico")}
                className={`flex items-center gap-2 py-2 px-3 rounded-md text-sm transition-all duration-200 ${
                  visualizacao === "grafico" 
                    ? "bg-amber-500 text-white shadow-md" 
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                }`}
                aria-pressed={visualizacao === "grafico"}
                aria-label="Visualizar em formato de gráfico"
              >
                <BarChart2 className="h-4 w-4" />
                <span>Gráfico</span>
              </button>
              
              <button
                onClick={() => onChangeVisualizacao("tabela")}
                className={`flex items-center gap-2 py-2 px-3 rounded-md text-sm transition-all duration-200 ${
                  visualizacao === "tabela" 
                    ? "bg-amber-500 text-white shadow-md" 
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                }`}
                aria-pressed={visualizacao === "tabela"}
                aria-label="Visualizar em formato de tabela"
              >
                <TableIcon className="h-4 w-4" />
                <span>Tabela</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
