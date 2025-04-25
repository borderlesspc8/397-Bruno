"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { RefreshCw, CheckCircle, AlertTriangle, Clock } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Progress } from "./ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { useRealtimeUpdates } from "@/app/_hooks/use-realtime-updates";

// Evento personalizado para atualização de carteira
const walletUpdatedEvent = new CustomEvent('wallet-updated');

interface SyncWalletButtonProps {
  walletId: string;
  walletName?: string;
}

export default function SyncWalletButton({ walletId, walletName = "Carteira" }: SyncWalletButtonProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "success" | "error">("idle");
  const [newTransactions, setNewTransactions] = useState<number | null>(null);
  const [progressStage, setProgressStage] = useState(0);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const router = useRouter();
  
  // Usar o hook para atualizações em tempo real
  const { emitWalletUpdate, emitTransactionUpdate } = useRealtimeUpdates();

  // Fases da sincronização para feedback visual
  const syncStages = [
    "Preparando certificados...",
    "Conectando ao banco...",
    "Verificando transações...",
    "Processando dados...",
    "Finalizando sincronização..."
  ];

  async function handleSync(e: React.MouseEvent) {
    // Impedir a propagação do evento para que não abra o modal de detalhes
    e.stopPropagation();
    e.preventDefault();
    
    try {
      setIsSyncing(true);
      setSyncStatus("syncing");
      setNewTransactions(null);
      setProgressStage(0);
      
      // Feedback visual por estágios
      const stageInterval = setInterval(() => {
        setProgressStage(prev => {
          // Avança para o próximo estágio, limitado ao número de estágios
          const nextStage = prev + 1;
          return nextStage < syncStages.length ? nextStage : prev;
        });
      }, 1500); // Avanço a cada 1.5 segundos para efeito visual
      
      toast.info(`Sincronizando ${walletName}...`, {
        duration: 3000,
        id: "sync-toast"
      });
      
      const response = await fetch(`/api/wallets/${walletId}/sync`, {
        method: "POST",
      });
      
      clearInterval(stageInterval); // Limpa o intervalo quando obtemos resposta
      
      if (!response.ok) {
        const errorData = await response.json();
        setSyncStatus("error");
        
        // Mensagem de erro específica para certificados
        if (errorData.error?.includes("certificados")) {
          toast.error("Erro ao preparar certificados. Por favor, tente novamente.", {
            duration: 5000,
            id: "sync-toast"
          });
        } else {
          throw new Error(errorData.error || `Falha ao sincronizar ${walletName}`);
        }
        return;
      }
      
      const data = await response.json();
      setNewTransactions(data.data?.transactionCount || 0);
      setSyncStatus("success");
      
      // Atualizar data da última sincronização
      if (data.wallet?.metadata?.lastSync) {
        setLastSync(new Date(data.wallet.metadata.lastSync));
      }
      
      const transactionCount = data.data?.transactionCount || 0;
      let successMessage = `${walletName} sincronizada com sucesso!`;
      
      if (transactionCount > 0) {
        successMessage += ` ${transactionCount} ${transactionCount === 1 ? 'transação importada' : 'transações importadas'}.`;
      } else {
        successMessage += " Nenhuma transação nova encontrada.";
      }
      
      toast.success(successMessage, {
        duration: 5000,
        id: "sync-toast"
      });
      
      // Emitir eventos de atualização para notificar outros componentes
      if (data.wallet) {
        emitWalletUpdate({ 
          walletId,
          wallet: data.wallet,
          balance: data.wallet.balance,
          lastSync: data.wallet.metadata?.lastSync,
          transactionCount: data.data?.transactionCount
        });
      }
      
      if (transactionCount > 0) {
        emitTransactionUpdate({
          walletId,
          transactionCount,
          updatedAt: new Date()
        });
      }
      
      // Ainda chama refresh para garantir que os dados sejam atualizados no servidor
      router.refresh();
    } catch (error) {
      console.error("[SYNC_WALLET_ERROR]", error);
      const errorMessage = error instanceof Error ? error.message : `Erro ao sincronizar ${walletName}`;
      toast.error(errorMessage, {
        duration: 5000,
        id: "sync-toast"
      });
    } finally {
      setIsSyncing(false);
      
      // Reset do status após alguns segundos
      if (syncStatus === "success") {
        setTimeout(() => {
          setSyncStatus("idle");
        }, 7000);
      }
    }
  }

  // Calcular tempo desde a última sincronização 
  const getSyncTimeInfo = () => {
    if (!lastSync) return "Nunca sincronizado";
    
    const now = new Date();
    const diffMs = now.getTime() - lastSync.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "Atualizado agora";
    if (diffMins < 60) return `Há ${diffMins} ${diffMins === 1 ? 'minuto' : 'minutos'}`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Há ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `Há ${diffDays} ${diffDays === 1 ? 'dia' : 'dias'}`;
  };

  // Componente de conteúdo que varia conforme o estado
  const SyncContent = () => {
    if (syncStatus === "syncing") {
      return (
        <div className="flex flex-col w-full">
          <div className="flex items-center mb-1">
            <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
            <span className="text-sm">{syncStages[progressStage]}</span>
          </div>
          <Progress value={(progressStage + 1) * 25} className="h-1" />
        </div>
      );
    }
    
    if (syncStatus === "success") {
      return (
        <div className="flex items-center">
          <CheckCircle className="h-3 w-3 mr-1 text-green-600" />
          <span>
            {newTransactions && newTransactions > 0 
              ? `${newTransactions} ${newTransactions === 1 ? 'nova transação' : 'novas transações'}`
              : "Sincronizado"}
          </span>
        </div>
      );
    }
    
    if (syncStatus === "error") {
      return (
        <div className="flex items-center">
          <AlertTriangle className="h-3 w-3 mr-1 text-red-600" />
          <span>Tentar novamente</span>
        </div>
      );
    }
    
    // Estado idle
    return (
      <div className="flex items-center">
        <RefreshCw className="h-3 w-3 mr-1" />
        <span>Sincronizar</span>
      </div>
    );
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            variant="outline" 
            size="sm"
            className={`
              min-w-[120px] justify-center
              ${syncStatus === "idle" ? "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100" : ""} 
              ${syncStatus === "syncing" ? "bg-amber-50 border-amber-200 text-amber-700" : ""}
              ${syncStatus === "success" ? "bg-green-50 border-green-200 text-green-700" : ""}
              ${syncStatus === "error" ? "bg-red-50 border-red-200 text-red-700" : ""}
            `}
            onClick={handleSync}
            disabled={isSyncing}
          >
            <SyncContent />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {syncStatus === "syncing" ? (
            <p>Sincronizando carteira com o banco...</p>
          ) : (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <p>Última sincronização: {getSyncTimeInfo()}</p>
            </div>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
} 