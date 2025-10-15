import { VendedoresChartImproved } from "./VendedoresChartImproved";
import { VendedoresTable } from "./VendedoresTable";
import { Vendedor } from "@/app/_services/betelTecnologia";

interface VendedoresPanelProps {
  vendedores: Vendedor[];
}

export function VendedoresPanel({ vendedores }: VendedoresPanelProps) {
  if (!vendedores) return null;
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <VendedoresChartImproved vendedores={vendedores} />
      <VendedoresTable vendedores={vendedores} />
    </div>
  );
} 
