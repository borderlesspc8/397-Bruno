"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/_components/ui/card";
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
  titulo?: string;
}

export function VendedoresTable({ 
  vendedores, 
  onClickVendedor,
  titulo = "Desempenho de Vendedores" 
}: VendedoresTableProps) {
  // Adicionar log para diagnóstico
  console.log(`VendedoresTable: Recebeu ${vendedores?.length || 0} vendedores`);
  if (vendedores?.length > 0) {
    // Verificar se Diuly está na lista
    const temDiuly = vendedores.some(v => v.nome.includes('Diuly'));
    console.log(`VendedoresTable: Diuly ${temDiuly ? 'ESTÁ' : 'NÃO está'} na lista recebida`);
    
    // Log dos primeiros 5 vendedores
    console.log('VendedoresTable: Primeiros 5 vendedores recebidos:', 
      vendedores.slice(0, 5).map((v, i) => `${i+1}. ${v.nome} (${v.vendas} vendas, R$ ${v.faturamento.toFixed(2)})`).join(', ')
    );
  }

  if (!vendedores || vendedores.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{titulo}</CardTitle>
          <CardDescription>
            Detalhes de vendas e faturamento por vendedor
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[500px]">
            <p className="text-muted-foreground">Nenhum dado disponível para o período</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Ordenar por faturamento (do maior para o menor)
  const vendedoresOrdenados = [...vendedores].sort((a, b) => {
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
  
  // Verificar se Diuly está entre os vendedores ordenados
  const diulyIndex = vendedoresOrdenados.findIndex(v => v.nome.includes('Diuly'));
  if (diulyIndex >= 0) {
    console.log(`VendedoresTable: Diuly está na posição ${diulyIndex + 1} após ordenação`);
  } else {
    console.log('VendedoresTable: Diuly NÃO foi encontrada após ordenação');
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{titulo}</CardTitle>
        <CardDescription>
          {vendedoresOrdenados.length} vendedores no período selecionado
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-muted/50">
              <tr>
                <th className="px-4 py-2 rounded-tl-lg">Vendedor</th>
                <th className="px-4 py-2 text-right">Vendas</th>
                <th className="px-4 py-2 text-right">Faturamento</th>
                <th className="px-4 py-2 text-right rounded-tr-lg">Ticket Médio</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {vendedoresOrdenados.map((vendedor, index) => (
                <tr key={index} className={`hover:bg-muted/25 transition-colors ${vendedor.nome.includes('Diuly') ? 'bg-amber-50 dark:bg-amber-900/20' : ''}`}>
                  <td className="px-4 py-3 font-medium">
                    {index + 1}. {onClickVendedor ? (
                      <button 
                        onClick={() => onClickVendedor({...vendedor, posicao: index + 1})}
                        className="hover:underline hover:text-primary focus:outline-none"
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
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
} 