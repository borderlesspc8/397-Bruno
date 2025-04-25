import { Wallet } from "@prisma/client";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { UpdateIcon, PlusIcon } from "lucide-react";
import { Link } from "react-router-dom";

const handleRefreshBalance = async () => {
  try {
    setIsLoading(true);
    
    const response = await fetch('/api/wallets/fix-balances', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Falha ao corrigir saldos');
    }
    
    const data = await response.json();
    
    if (data.updatedCount > 0) {
      toast.success(`Saldos corrigidos: ${data.updatedCount} carteiras atualizadas`);
      // Recarregar a página para exibir os saldos atualizados
      window.location.reload();
    } else {
      toast.info('Todos os saldos já estão corretos!');
    }
    
  } catch (error) {
    console.error('Erro ao corrigir saldos:', error);
    toast.error('Falha ao corrigir saldos. Tente novamente.');
  } finally {
    setIsLoading(false);
  }
};

<div className="flex items-center gap-2">
  <Button 
    variant="outline" 
    size="sm" 
    onClick={handleRefreshBalance}
    disabled={isLoading}
  >
    {isLoading ? 'Corrigindo...' : 'Corrigir Saldos'}
  </Button>
  <Button
    onClick={handleRefresh}
    variant="outline"
    size="sm"
    disabled={isLoading}
  >
    <UpdateIcon className="mr-2 h-4 w-4" />
    Atualizar
  </Button>
  <Link href="/wallets/new">
    <Button>
      <PlusIcon className="mr-2 h-4 w-4" />
      Nova Carteira
    </Button>
  </Link>
</div> 