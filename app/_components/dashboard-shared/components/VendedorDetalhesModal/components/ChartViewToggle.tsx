import { Button } from "@/app/_components/ui/button";
import { PieChart, Table } from "lucide-react";

interface ChartViewToggleProps {
  view: 'pizza' | 'tabela';
  onViewChange: (view: 'pizza' | 'tabela') => void;
}

export function ChartViewToggle({ view, onViewChange }: ChartViewToggleProps) {
  return (
    <div className="flex gap-2">
      <Button
        variant={view === 'pizza' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onViewChange('pizza')}
        className={`text-xs sm:text-sm rounded-xl transition-all duration-300 ${
          view === 'pizza' 
            ? 'bg-gradient-to-r from-[hsl(var(--orange-primary))] to-[hsl(var(--yellow-primary))] text-white shadow-lg' 
            : 'hover:bg-[hsl(var(--orange-light))] hover:border-[hsl(var(--orange-primary))]'
        }`}
      >
        <PieChart className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
        <span className="hidden sm:inline">Gráfico</span>
        <span className="sm:hidden">Gráf.</span>
      </Button>
      <Button
        variant={view === 'tabela' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onViewChange('tabela')}
        className={`text-xs sm:text-sm rounded-xl transition-all duration-300 ${
          view === 'tabela' 
            ? 'bg-gradient-to-r from-[hsl(var(--orange-primary))] to-[hsl(var(--yellow-primary))] text-white shadow-lg' 
            : 'hover:bg-[hsl(var(--orange-light))] hover:border-[hsl(var(--orange-primary))]'
        }`}
      >
        <Table className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
        <span className="hidden sm:inline">Tabela</span>
        <span className="sm:hidden">Tab.</span>
      </Button>
    </div>
  );
}

