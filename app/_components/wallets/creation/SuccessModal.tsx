"use client";

import { Button } from "@/app/_components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/app/_components/ui/dialog";
import { Check, ArrowRight, RefreshCw } from "lucide-react";

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  walletId: string;
  metadata: any;
  onSyncNow: () => void;
  isSyncing: boolean;
}

export function SuccessModal({
  isOpen,
  onClose,
  walletId,
  metadata,
  onSyncNow,
  isSyncing
}: SuccessModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
            <Check className="h-6 w-6 text-green-600" />
          </div>
          <DialogTitle className="text-center">Carteira Criada com Sucesso!</DialogTitle>
          <DialogDescription className="text-center">
            Sua carteira do Banco do Brasil foi criada e as credenciais foram salvas com segurança.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3 py-4">
          <div className="text-sm">
            <p className="font-medium">Detalhes da Conta:</p>
            <div className="mt-2 bg-gray-50 p-3 rounded-md border border-gray-200 text-xs">
              <div className="grid grid-cols-2 gap-y-2">
                <span className="text-gray-600">ID da Carteira:</span>
                <span className="font-medium">{walletId?.substring(0, 12)}...</span>
                
                <span className="text-gray-600">Agência:</span>
                <span className="font-medium">{metadata?.agencia || "-"}</span>
                
                <span className="text-gray-600">Conta:</span>
                <span className="font-medium">{metadata?.conta || "-"}</span>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 p-3 rounded-md border border-blue-200 text-sm text-blue-800">
            <p>
              Agora você pode sincronizar sua conta para importar transações e saldo atual.
            </p>
          </div>
        </div>
        
        <div className="flex space-x-3">
          <Button 
            variant="outline" 
            onClick={onClose} 
            className="flex-1"
          >
            Fechar
          </Button>
          
          <Button 
            className="flex-1" 
            onClick={onSyncNow}
            disabled={isSyncing}
          >
            {isSyncing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Sincronizando...
              </>
            ) : (
              <>
                Sincronizar Agora
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 