import { ShoppingCart, DollarSign, TrendingUp, Percent } from "lucide-react";
import { Vendedor } from "../types";
import { VendasList } from "./VendasList";

interface ResumoTabProps {
  vendedor: Vendedor;
  totalFaturamento: number;
  vendas: any[];
  loadingVendas: boolean;
  erro: string | null;
  onVendaClick: (venda: any) => void;
}

export function ResumoTab({
  vendedor,
  totalFaturamento,
  vendas,
  loadingVendas,
  erro,
  onVendaClick
}: ResumoTabProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="ios26-metric-card space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[hsl(var(--orange-primary))] to-[hsl(var(--orange-dark))] flex items-center justify-center shadow-md">
              <ShoppingCart className="h-5 w-5 text-white" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">Total de Vendas</p>
          </div>
          <p className="text-3xl font-bold text-[hsl(var(--orange-primary))] ios26-currency">{vendedor.vendas}</p>
        </div>
        
        <div className="ios26-metric-card space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[hsl(var(--yellow-primary))] to-[hsl(var(--yellow-dark))] flex items-center justify-center shadow-md">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">Faturamento</p>
          </div>
          <p className="text-3xl font-bold ios26-currency-large text-[hsl(var(--orange-primary))]">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(vendedor.faturamento)}
          </p>
        </div>
        
        <div className="ios26-metric-card space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[hsl(var(--orange-primary))] to-[hsl(var(--yellow-primary))] flex items-center justify-center shadow-md">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">Ticket Médio</p>
          </div>
          <p className="text-3xl font-bold ios26-currency-medium text-[hsl(var(--orange-primary))]">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(vendedor.ticketMedio)}
          </p>
        </div>
        
        <div className="ios26-metric-card space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[hsl(var(--success))] to-[hsl(var(--success))] flex items-center justify-center shadow-md">
              <Percent className="h-5 w-5 text-white" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">% do Faturamento</p>
          </div>
          <p className="text-3xl font-bold ios26-currency text-[hsl(var(--success))]">
            {((vendedor.faturamento / totalFaturamento) * 100).toFixed(2)}%
          </p>
        </div>
      </div>
      
      <div className="ios26-card p-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-foreground">Performance</span>
            <span className="text-lg font-bold text-[hsl(var(--orange-primary))]">
              {vendedor.percentual ? vendedor.percentual.toFixed(2) : ((vendedor.faturamento / totalFaturamento) * 100).toFixed(2)}%
            </span>
          </div>
          <div className="ios26-progress h-3">
            <div 
              className="ios26-progress-bar" 
              style={{ 
                width: `${Math.min(vendedor.percentual || ((vendedor.faturamento / totalFaturamento) * 100), 100)}%` 
              }}
            />
          </div>
        </div>
      </div>
      
      <VendasList 
        vendas={vendas}
        loading={loadingVendas}
        erro={erro}
        onVendaClick={onVendaClick}
      />
    </div>
  );
}

