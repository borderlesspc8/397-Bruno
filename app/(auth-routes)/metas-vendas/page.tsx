"use client";

import Link from "next/link";
import { Button } from "@/app/_components/ui/button";
import { TabelaMetas } from "./components/tabela-metas";
import { useEffect } from "react";

export default function MetasVendasPage() {
  // Definir o título da página dinamicamente no cliente
  useEffect(() => {
    document.title = "Metas de Vendas | Gestor Personal Prime";
  }, []);

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Metas de Vendas</h1>
          <p className="text-muted-foreground">
            Gerencie suas metas de vendas mensais e acompanhe seu progresso.
          </p>
        </div>
        
        <Link href="/metas-vendas/nova">
          <Button>Nova Meta</Button>
        </Link>
      </div>
      
      <TabelaMetas />
    </div>
  );
} 
