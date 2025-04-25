"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/app/_components/ui/button";
import { Loader2, ArrowLeft } from "lucide-react";
import VendaDetailModal from "@/app/_components/gestao-click/VendaDetailModal";
import { Alert, AlertTitle, AlertDescription } from "@/app/_components/ui/alert";

interface PageProps {
  params: {
    id: string;
  };
}

export default function VendaDetailPage({ params }: PageProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Verificar se o ID é válido
    if (!params.id) {
      setError("ID da venda não fornecido");
      setIsLoading(false);
    }
  }, [params.id]);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    // Redirecionar para a página de listagem de vendas
    router.push("/gestao-click/vendas");
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center gap-2 mb-6">
        <Button 
          variant="outline" 
          onClick={() => router.push("/gestao-click/vendas")}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para Vendas
        </Button>
      </div>
      
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <span>Carregando detalhes da venda...</span>
        </div>
      ) : (
        <div className="bg-muted p-4 rounded-md text-center">
          <p>Carregando detalhes da venda...</p>
        </div>
      )}
      
      <VendaDetailModal 
        vendaId={params.id}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
} 