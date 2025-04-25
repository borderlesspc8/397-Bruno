import { Metadata } from "next";
import { GestaoClickImportForm } from "@/app/_components/gestao-click/ImportForm";
import { prisma } from "@/app/_lib/prisma";
import { getAuthSession } from "@/app/_lib/auth";
import { redirect } from "next/navigation";
import { ArrowLeft, Database } from "lucide-react";
import Link from "next/link";
import { Wallet } from "@prisma/client";
import { Prisma } from "@prisma/client";

export const metadata: Metadata = {
  title: "Importar do Gestão Click | Conta Rápida",
  description: "Importe suas transações financeiras do Gestão Click para o Conta Rápida.",
};

// Interface para o tipo do metadata
interface GestaoClickData {
  lastSync: string;
  [key: string]: any;
}

// Função para verificar se o metadata tem a estrutura esperada
function hasGestaoClick(metadata: any): metadata is { gestaoClick: GestaoClickData } {
  return (
    metadata !== null &&
    typeof metadata === 'object' &&
    'gestaoClick' in metadata &&
    metadata.gestaoClick !== null &&
    typeof metadata.gestaoClick === 'object' &&
    'lastSync' in metadata.gestaoClick
  );
}

interface GestaoClickImportPageProps {
  params: {
    walletId: string;
  };
}

export default async function GestaoClickImportPage({ params }: GestaoClickImportPageProps) {
  const session = await getAuthSession();
  
  if (!session?.user) {
    return redirect("/login");
  }
  
  // Verificar se a carteira existe e pertence ao usuário
  const wallet = await prisma.wallet.findFirst({
    where: {
      id: params.walletId,
      userId: session.user.id,
    },
    include: {
      bank: true,
    },
  });
  
  if (!wallet) {
    return redirect("/wallets");
  }

  return (
    <div className="flex flex-col h-full max-w-6xl mx-auto">
      <div className="container">
        <div className="flex items-center mb-8 mt-4">
          <Link
            href={`/wallets/${wallet.id}`}
            className="flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voltar para carteira
          </Link>
        </div>
        
        <div className="flex items-center gap-4 mb-8">
          <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <Database className="size-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Importar do Gestão Click
            </h1>
            <p className="text-muted-foreground">
              Carteira: {wallet.name}
            </p>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row gap-8 mb-12">
          <div className="flex-1">
            <GestaoClickImportForm walletId={wallet.id} />
          </div>
          
          <div className="w-full md:w-80 space-y-4">
            <div className="rounded-lg border bg-card p-4">
              <h3 className="font-medium mb-2">Sobre o Gestão Click</h3>
              <p className="text-sm text-muted-foreground mb-4">
                O Gestão Click é um sistema de gestão financeira e controle empresarial.
                A integração permite importar automaticamente suas transações financeiras.
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Carteira</span>
                  <span className="font-medium">{wallet.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ID</span>
                  <span className="font-medium truncate max-w-[120px]">{wallet.id}</span>
                </div>
                {wallet.metadata && hasGestaoClick(wallet.metadata) && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Última sincronização</span>
                    <span className="font-medium">
                      {new Date(wallet.metadata.gestaoClick.lastSync).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="rounded-lg border bg-card p-4">
              <h3 className="font-medium mb-2">Dicas</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Você precisa de um token de acesso da API do Gestão Click.</li>
                <li>• Você pode obter este token no painel administrativo do Gestão Click.</li>
                <li>• Importe períodos menores para evitar timeouts.</li>
                <li>• A importação mantém um registro para evitar duplicatas.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 