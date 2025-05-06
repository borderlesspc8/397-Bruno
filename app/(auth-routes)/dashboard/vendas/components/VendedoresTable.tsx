"use client";

import { useMemo, memo } from "react";
import { formatCurrency } from "@/app/_utils/format";
import { Vendedor } from "@/app/_services/betelTecnologia";

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

  return (
    <tr className={`hover:bg-muted/25 transition-colors`}>
      <td className="px-4 py-3 font-medium">
        <span className="inline-block min-w-6 text-muted-foreground">
          {index + 1}.
        </span>
        {onClickVendedor ? (
          <button 
            onClick={handleClick}
            className="hover:underline hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 rounded px-1"
            aria-label={`Ver detalhes de ${vendedor.nome}`}
          >
            {vendedor.nome}
          </button>
        ) : (
          vendedor.nome
        )}
      </td>
      <td className="px-4 py-3 text-right">{vendedor.vendas}</td>
      <td className="px-4 py-3 text-right">{formatCurrency(vendedor.faturamento)}</td>
      <td className="px-4 py-3 text-right">{formatCurrency(vendedor.ticketMedio)}</td>
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
        className="flex items-center justify-center h-[300px] text-muted-foreground"
        role="status"
        aria-live="polite"
      >
        <p>Nenhum dado disponível para o período</p>
      </div>
    );
  }
  
  return (
    <div className="overflow-x-auto">
      <table 
        className="w-full text-sm text-left" 
        role="grid" 
        aria-label="Listagem de vendedores ordenados por faturamento"
      >
        <thead className="text-xs uppercase bg-muted/50">
          <tr>
            <th className="px-4 py-2 rounded-tl-lg" scope="col">Vendedor</th>
            <th className="px-4 py-2 text-right" scope="col">Vendas</th>
            <th className="px-4 py-2 text-right" scope="col">Faturamento</th>
            <th className="px-4 py-2 text-right rounded-tr-lg" scope="col">Ticket Médio</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {vendedoresOrdenados.map((vendedor, index) => (
            <VendedorRow 
              key={`${vendedor.id || index}`}
              vendedor={vendedor}
              index={index}
              onClickVendedor={onClickVendedor}
            />
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={4} className="pt-3 px-4 text-xs text-muted-foreground">
              Total: {vendedoresOrdenados.length} vendedores
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
} 