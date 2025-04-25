import { getAuthSession } from "@/app/_lib/auth";
import { db } from "@/app/_lib/prisma";
import { redirect } from "next/navigation";
import { Button } from "@/app/_components/ui/button";
import { Card } from "@/app/_components/ui/card";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CreateWalletForm } from "./_components/create-wallet-form";

export default async function NewWalletPage() {
  const session = await getAuthSession();

  if (!session?.user) {
    redirect("/auth");
  }

  const banks = await db.bank.findMany({
    orderBy: {
      name: "asc",
    },
  });

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Link href="/wallets">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h2 className="text-3xl font-bold tracking-tight">Nova Carteira</h2>
          </div>
          <p className="text-muted-foreground">
            Adicione uma nova carteira ou conecte uma conta bancária
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        <Card className="p-6">
          <CreateWalletForm banks={banks} />
        </Card>
      </div>
    </div>
  );
} 