"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { Button } from "@/app/_components/ui/button";
import { Vendedor } from "@/app/_services/betelTecnologia";
import { formatCurrency } from "@/app/_utils/format";
import { User, Upload } from "lucide-react";
import { VendedorImagensService } from "@/app/_services/vendedorImagens";
import DefaultAvatar from "@/app/components/DefaultAvatar";
import { useVendedoresImagens } from "@/app/_components/dashboard-shared/hooks";

interface ListaVendedoresProps {
  vendedores: Vendedor[];
  onUploadFoto: (vendedor: Vendedor) => void;
}

export function ListaVendedores({ vendedores, onUploadFoto }: ListaVendedoresProps) {
  // Usar o hook otimizado para carregar imagens seguindo o padrão da página de vendas
  const { imagensVendedores } = useVendedoresImagens(vendedores);
  
  // Ordenar vendedores por faturamento
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
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Equipe de Vendedores</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {vendedoresOrdenados.map((vendedor, index) => (
            <div 
              key={vendedor.id}
              className="flex flex-col items-center bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="relative mb-4">
                <DefaultAvatar 
                  src={imagensVendedores[vendedor.id]}
                  alt={`Foto de ${vendedor.nome}`}
                  size={100}
                  className="border-2 border-[#faba33]"
                />
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute -bottom-2 -right-2 rounded-full shadow-md bg-[#faba33] hover:bg-[#e9a92a] text-white"
                  onClick={() => onUploadFoto(vendedor)}
                >
                  <Upload className="h-4 w-4" />
                </Button>
              </div>
              
              <h3 className="font-semibold text-lg mb-1 text-center">{vendedor.nome}</h3>
              <div className="w-full mt-2 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Posição:</span>
                  <span className="font-medium">{index + 1}º</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Vendas:</span>
                  <span className="font-medium">{vendedor.vendas}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Faturamento:</span>
                  <span className="font-medium">{formatCurrency(vendedor.faturamento)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ticket Médio:</span>
                  <span className="font-medium">{formatCurrency(vendedor.ticketMedio)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 
