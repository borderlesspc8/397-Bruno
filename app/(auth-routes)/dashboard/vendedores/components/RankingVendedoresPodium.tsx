"use client";

import { useState, useEffect } from "react";
import { Vendedor } from "@/app/_services/betelTecnologia";
import { formatCurrency } from "@/app/_utils/format";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/app/_components/ui/card";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/app/_components/ui/dropdown-menu";
import { Button } from "@/app/_components/ui/button";
import { Filter, CreditCard, BadgePercent, BarChart } from "lucide-react";
import PodiumRanking from "../../vendas/components/PodiumRanking";

interface RankingVendedoresPodiumProps {
  vendedores: Vendedor[];
  onUploadFoto?: (vendedor: Vendedor) => void;
}

export default function RankingVendedoresPodium({ 
  vendedores,
  onUploadFoto
}: RankingVendedoresPodiumProps) {
  const [ordenacao, setOrdenacao] = useState<"faturamento" | "vendas" | "ticket">("faturamento");

  // Calcular título com base na ordenação
  const getTitulo = () => {
    switch (ordenacao) {
      case "faturamento":
        return "Top Vendedores por Faturamento";
      case "vendas":
        return "Top Vendedores por Quantidade";
      case "ticket":
        return "Top Vendedores por Ticket Médio";
      default:
        return "Top Vendedores";
    }
  };

  const handleClickVendedor = (vendedor: Vendedor) => {
    if (onUploadFoto) {
      onUploadFoto(vendedor);
    }
  };
  
  // Considerações sobre o número mínimo de vendedores necessários para exibir o pódio
  if (vendedores.length < 3) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{getTitulo()}</CardTitle>
          <CardDescription>
            São necessários pelo menos 3 vendedores para exibir o pódio
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-8">
          <p className="text-muted-foreground">
            Selecione um período com mais vendedores para visualizar o pódio
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl font-bold">{getTitulo()}</CardTitle>
            <CardDescription className="mt-1">
              Ordenado por {ordenacao === "faturamento" ? "valor total" : ordenacao === "vendas" ? "quantidade de vendas" : "ticket médio"}
            </CardDescription>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1">
                <Filter className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Ordenar</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[180px]">
              <DropdownMenuLabel>Ordenar por</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem 
                  onClick={() => setOrdenacao("faturamento")}
                  className={ordenacao === "faturamento" ? "bg-muted" : ""}
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  <span>Faturamento</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setOrdenacao("vendas")}
                  className={ordenacao === "vendas" ? "bg-muted" : ""}
                >
                  <BarChart className="mr-2 h-4 w-4" />
                  <span>Quantidade</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setOrdenacao("ticket")}
                  className={ordenacao === "ticket" ? "bg-muted" : ""}
                >
                  <BadgePercent className="mr-2 h-4 w-4" />
                  <span>Ticket Médio</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="py-4">
          <PodiumRanking 
            vendedores={vendedores}
            ordenacao={ordenacao}
            onVendedorClick={handleClickVendedor}
          />
        </div>
        
        <div className="flex justify-between text-sm text-muted-foreground mt-4 border-t pt-3">
          <div>Total: {vendedores.length} vendedores</div>
          <div>
            {ordenacao === "faturamento" 
              ? formatCurrency(vendedores.reduce((acc, v) => acc + v.faturamento, 0))
              : ordenacao === "vendas"
                ? `${vendedores.reduce((acc, v) => acc + v.vendas, 0)} vendas`
                : formatCurrency(vendedores.reduce((acc, v) => acc + v.ticketMedio, 0) / vendedores.length)
            }
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 