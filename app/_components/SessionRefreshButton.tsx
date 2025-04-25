"use client";

import { Button } from "./ui/button";
import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { useSessionRefresh } from "../_hooks/useSessionRefresh";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

export function SessionRefreshButton() {
  const { refreshSession, isRefreshing } = useSessionRefresh();
  const [refreshSuccess, setRefreshSuccess] = useState(false);

  const handleRefresh = async () => {
    const success = await refreshSession();
    if (success) {
      setRefreshSuccess(true);
      // Resetar o estado após 3 segundos
      setTimeout(() => {
        setRefreshSuccess(false);
      }, 3000);
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            className={refreshSuccess ? "text-green-500" : ""}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            <span className="sr-only">Atualizar sessão</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Atualizar sessão para aplicar mudanças de plano</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
} 