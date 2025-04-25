import { prisma } from "@/app/_lib/prisma";
import { getAuthSession } from "@/app/_lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { Button } from "@/app/_components/ui/button";
import { ArrowLeft, Building } from "lucide-react";
import Link from "next/link";
import { Metadata } from "next";
import { ExtractForm } from "./_components/extract-form";

interface ExtractPageProps {
  params: {
    walletId: string;
  };
}

export const metadata: Metadata = {
  title: "Extrato Bancário",
  description: "Consulte seu extrato bancário integrado",
};

export default async function ExtractPage({ params }: ExtractPageProps) {
  const session = await getAuthSession();
  
  if (!session?.user) {
    redirect("/login");
  }

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
    redirect("/wallets");
  }

  // Verificar se a carteira é de integração bancária
  if (wallet.type !== "BANK_INTEGRATION") {
    redirect(`/wallets/${params.walletId}`);
  }

  // Tratar o metadata como Record para garantir acesso seguro às propriedades
  const metadata = wallet.metadata as Record<string, any> || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">Extrato Bancário</h2>
          <p className="text-muted-foreground">
            Consulte seu extrato bancário e gerencie suas transações
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href={`/wallets/${params.walletId}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para carteira
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-4">
            {wallet.bank?.logo ? (
              <img 
                src={wallet.bank.logo} 
                alt={wallet.bank.name} 
                className="h-8 w-8 object-contain" 
              />
            ) : (
              <Building className="h-8 w-8 text-muted-foreground" />
            )}
            <div>
              <CardTitle>{wallet.name}</CardTitle>
              <CardDescription>
                {wallet.bank?.name || "Banco não especificado"}
                {metadata.agencia && metadata.conta && (
                  <span> • Ag. {metadata.agencia} • Conta: {metadata.conta}</span>
                )}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ExtractForm wallet={wallet} />
        </CardContent>
      </Card>
    </div>
  );
} 