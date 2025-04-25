"use client";

import { useRouter } from "next/navigation";
import { PlusCircle } from "lucide-react";
import { Button } from "../ui/button";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "../ui/tooltip";

export const NewTransactionButton = () => {
  const router = useRouter();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            size="sm" 
            variant="outline" 
            className="gap-1"
            onClick={() => router.push("/transactions/new")}
          >
            <PlusCircle className="h-4 w-4" />
            <span className="hidden lg:inline-block">Nova Transação</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Adicionar nova transação</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}; 