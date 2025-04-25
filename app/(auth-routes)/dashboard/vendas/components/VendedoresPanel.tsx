import { VendedoresChart } from "./VendedoresChart";
import { VendedoresTable } from "./VendedoresTable";

interface VendedorData {
  nome: string;
  faturamento: number;
  vendas: number;
  ticketMedio: number;
}

interface VendedoresPanelProps {
  vendedores: VendedorData[];
}

export function VendedoresPanel({ vendedores }: VendedoresPanelProps) {
  if (!vendedores) return null;
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <VendedoresChart vendedores={vendedores} />
      <VendedoresTable vendedores={vendedores} />
    </div>
  );
} 