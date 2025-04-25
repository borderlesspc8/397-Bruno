"use client";

import { useState } from "react";
import { OfxImporter } from "@/app/_components/wallets/import/OfxImporter";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/app/_components/ui/alert";
import { AlertCircle, FileUp } from "lucide-react";
import { Wallet } from "@prisma/client";

interface ImportPageClientProps {
  wallet: Wallet;
}

export function ImportPageClient({ wallet }: ImportPageClientProps) {
  const router = useRouter();
  const [isImporting, setIsImporting] = useState(false);
  const [importComplete, setImportComplete] = useState(false);
  const [updatedWallet, setUpdatedWallet] = useState<Wallet | null>(null);

  const handleImportComplete = (wallet?: Wallet) => {
    setImportComplete(true);
    
    // Se recebemos dados atualizados da carteira, guardamos eles
    if (wallet) {
      setUpdatedWallet(wallet);
    }
    
    // Atualizar a UI
    router.refresh();
    
    // Redirecionar para a página da carteira após um breve delay
    setTimeout(() => {
      router.push(`/wallets/${updatedWallet?.id || wallet?.id || ''}`);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {importComplete && (
        <Alert variant="default" className="bg-green-50 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Importação concluída</AlertTitle>
          <AlertDescription>
            As transações foram importadas com sucesso. Você será redirecionado em instantes.
            {updatedWallet && (
              <p className="mt-1 font-medium">
                Saldo atualizado: {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(updatedWallet.balance)}
              </p>
            )}
          </AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <OfxImporter 
            wallet={wallet} 
            onImportComplete={handleImportComplete} 
          />
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileUp className="h-5 w-5" />
              Como importar
            </CardTitle>
            <CardDescription>
              Siga estas etapas para importar suas transações
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-sm font-medium">1. Exporte o arquivo OFX do seu banco</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Acesse o site ou aplicativo do seu banco e exporte o extrato no formato OFX.
              </p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium">2. Arraste o arquivo ou clique para selecioná-lo</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Selecione o arquivo OFX que você deseja importar.
              </p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium">3. Verifique as transações e confirme</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Revise as transações que serão importadas e clique em "Confirmar Importação".
              </p>
            </div>
            
            <Alert variant="default" className="mt-4 border border-amber-200 bg-amber-50 text-amber-800 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Evite importações duplicadas</AlertTitle>
              <AlertDescription className="text-xs">
                O sistema tentará identificar transações já importadas anteriormente, mas é recomendável verificar para evitar duplicatas.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 