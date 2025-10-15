"use client";

import { useMemo, memo } from "react";
import { formatCurrency } from "@/app/_utils/format";
import { Vendedor } from "@/app/_services/betelTecnologia";
import { Badge } from "@/app/_components/ui/badge";
import { User, TrendingUp, BarChart } from "lucide-react";

// Estender a interface Vendedor para incluir campos adicionais
interface VendedorData extends Vendedor {
  percentual?: number;
  posicao?: number;
}

interface VendedoresTableProps {
  vendedores: VendedorData[];
  onClickVendedor?: (vendedor: VendedorData) => void;
}

// Componente de linha da tabela memoizado
const VendedorRow = memo(({
  vendedor,
  index,
  onClickVendedor
}: {
  vendedor: VendedorData;
  index: number;
  onClickVendedor?: (vendedor: VendedorData) => void;
}) => {
  const handleClick = () => {
    if (onClickVendedor) {
      onClickVendedor({...vendedor, posicao: index + 1});
    }
  };

  // Estilização de posição baseada na classificação
  const getPositionStyle = (position: number) => {
    if (position === 0) return "bg-amber-500 text-white";
    if (position === 1) return "bg-gray-400 text-white";
    if (position === 2) return "bg-amber-700 text-white";
    return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
  };

  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-200">
      <td className="px-2 sm:px-4 py-2 sm:py-3 font-medium whitespace-nowrap">
        <div className="flex items-center gap-1 sm:gap-2">
          <Badge 
            className={`${getPositionStyle(index)} min-w-6 sm:min-w-7 h-6 sm:h-7 flex items-center justify-center rounded-full text-xs font-bold`}
            aria-label={`Posição ${index + 1}`}
          >
            {index + 1}
          </Badge>
          {onClickVendedor ? (
            <button 
              onClick={handleClick}
              className="text-gray-800 dark:text-gray-200 hover:text-primary dark:hover:text-primary transition-colors duration-200 focus:outline-none focus:text-primary text-xs sm:text-sm"
              aria-label={`Ver detalhes de ${vendedor.nome}`}
            >
              <span className="flex items-center">
                <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-gray-400" />
                <span className="truncate max-w-[100px] sm:max-w-[200px]">{vendedor.nome}</span>
              </span>
            </button>
          ) : (
            <span className="flex items-center text-xs sm:text-sm">
              <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-gray-400" />
              <span className="truncate max-w-[100px] sm:max-w-[200px]">{vendedor.nome}</span>
            </span>
          )}
        </div>
      </td>
      <td className="px-2 sm:px-4 py-2 sm:py-3 text-right whitespace-nowrap">
        <span className="flex items-center justify-end gap-1 text-gray-800 dark:text-gray-200 text-xs sm:text-sm">
          <BarChart className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
          {vendedor.vendas}
        </span>
      </td>
      <td className="px-2 sm:px-4 py-2 sm:py-3 text-right font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap text-xs sm:text-sm">
        {formatCurrency(vendedor.faturamento)}
      </td>
      <td className="px-2 sm:px-4 py-2 sm:py-3 text-right whitespace-nowrap">
        <span className="flex items-center justify-end gap-1 text-gray-800 dark:text-gray-200 text-xs sm:text-sm">
          <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
          {formatCurrency(vendedor.ticketMedio)}
        </span>
      </td>
    </tr>
  );
});

VendedorRow.displayName = 'VendedorRow';

export function VendedoresTable({ 
  vendedores, 
  onClickVendedor
}: VendedoresTableProps) {
  // Ordenar vendedores como um valor memoizado para evitar recálculos desnecessários
  const vendedoresOrdenados = useMemo(() => {
    if (!vendedores || vendedores.length === 0) {
      return [];
    }
    
    // Criar uma cópia para não modificar o array original
    return [...vendedores].sort((a, b) => {
      // Se ambos têm faturamento zero, ordenar por nome
      if (a.faturamento === 0 && b.faturamento === 0) {
        return a.nome.localeCompare(b.nome);
      }
      // Colocar vendedores com faturamento no topo
      if (a.faturamento === 0) return 1;
      if (b.faturamento === 0) return -1;
      // Ordenação normal por faturamento (decrescente)
      return b.faturamento - a.faturamento;
    });
  }, [vendedores]);

  // Se não há vendedores, mostrar mensagem
  if (!vendedoresOrdenados.length) {
    return (
      <div 
        className="flex items-center justify-center h-[200px] sm:h-[300px] bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 text-xs sm:text-sm"
        role="status"
        aria-live="polite"
      >
        <p>Nenhum dado disponível para o período</p>
      </div>
    );
  }
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-300">
      <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
        <table 
          className="w-full text-sm" 
          role="grid" 
          aria-label="Listagem de vendedores ordenados por faturamento"
        >
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-900/50 text-[10px] xs:text-xs uppercase text-gray-600 dark:text-gray-400">
              <th className="px-2 sm:px-4 py-2 sm:py-3 font-medium text-left" scope="col">Vendedor</th>
              <th className="px-2 sm:px-4 py-2 sm:py-3 font-medium text-right" scope="col">Vendas</th>
              <th className="px-2 sm:px-4 py-2 sm:py-3 font-medium text-right" scope="col">Faturamento</th>
              <th className="px-2 sm:px-4 py-2 sm:py-3 font-medium text-right" scope="col">Ticket Médio</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {vendedoresOrdenados.map((vendedor, index) => (
              <VendedorRow 
                key={`${vendedor.id || index}`}
                vendedor={vendedor}
                index={index}
                onClickVendedor={onClickVendedor}
              />
            ))}
          </tbody>
        </table>
      </div>
      <div className="py-2 sm:py-3 px-3 sm:px-4 border-t border-gray-100 dark:border-gray-800 text-[10px] xs:text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/30">
        Total: {vendedoresOrdenados.length} vendedores
      </div>
    </div>
  );
} 
