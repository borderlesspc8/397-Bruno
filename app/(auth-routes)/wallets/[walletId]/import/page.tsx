import { getServerSession } from "next-auth";
import { authOptions } from "@/app/_lib/auth-options";
import { prisma } from "@/app/_lib/prisma";
import { redirect } from "next/navigation";
import { Button } from "@/app/_components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Metadata } from "next";
import { ImportPageClient } from "./_components/import-page-client";

interface ImportPageProps {
  params: {
    walletId: string;
  };
}

export const metadata: Metadata = {
  title: "Importar Transações",
  description: "Importe transações de arquivos OFX para sua carteira",
};

export default async function ImportPage({ params }: ImportPageProps) {
  const session = await getServerSession(authOptions);
  const user = session?.user;

  if (!user?.email) {
    redirect("/auth/login");
  }

  // Buscar dados da carteira 
  const wallet = await prisma.wallet.findFirst({
    where: {
      id: params.walletId,
      user: {
        email: user.email,
      },
    },
  });

  if (!wallet) {
    redirect("/wallets");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">Importar Transações</h2>
          <p className="text-muted-foreground">
            Importe transações de arquivos OFX para sua carteira
          </p>
        </div>
        
        <Button asChild variant="outline" size="sm">
          <Link href={`/wallets/${wallet.id}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para a carteira
          </Link>
        </Button>
      </div>

      <ImportPageClient wallet={wallet} />
    </div>
  );
} 