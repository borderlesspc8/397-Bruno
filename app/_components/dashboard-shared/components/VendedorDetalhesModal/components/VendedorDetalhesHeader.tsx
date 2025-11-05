import { Calendar } from "lucide-react";
import { Badge } from '@/app/_components/ui/badge';
import { Trophy } from "lucide-react";
import { Vendedor } from "../types";

interface VendedorDetalhesHeaderProps {
  vendedor: Vendedor;
  dataInicio: Date;
  dataFim: Date;
}

export function VendedorDetalhesHeader({ vendedor, dataInicio, dataFim }: VendedorDetalhesHeaderProps) {
  return (
    <>
      <div className="flex justify-between items-center pb-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[hsl(var(--orange-primary))] to-[hsl(var(--orange-dark))] flex items-center justify-center text-white font-bold text-lg shadow-lg">
            {vendedor.nome.charAt(0).toUpperCase()}
          </div>
          <h3 className="text-xl font-bold text-foreground">{vendedor.nome}</h3>
        </div>
        <Badge className="ios26-badge text-sm px-4 py-2 rounded-full shadow-md">
          <Trophy className="h-4 w-4 mr-1" />
          {vendedor.posicao || 1}º Lugar
        </Badge>
      </div>
      
      {/* Exibir período de datas */}
      <div className="ios26-card p-4 bg-gradient-to-r from-[hsl(var(--orange-light))] to-[hsl(var(--yellow-light))] border border-[hsl(var(--orange-primary))]/20">
        <div className="flex items-center gap-3 text-[hsl(var(--orange-primary))]">
          <Calendar className="h-5 w-5" />
          <span className="font-medium text-sm">
            Período: {dataInicio.toLocaleDateString('pt-BR', { 
              day: '2-digit', 
              month: '2-digit', 
              year: 'numeric',
              timeZone: 'America/Sao_Paulo'
            })} até {dataFim.toLocaleDateString('pt-BR', { 
              day: '2-digit', 
              month: '2-digit', 
              year: 'numeric',
              timeZone: 'America/Sao_Paulo'
            })}
          </span>
        </div>
      </div>
    </>
  );
}

