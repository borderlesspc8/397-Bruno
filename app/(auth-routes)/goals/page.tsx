import { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/app/_lib/prisma";
import { PageHeader } from "@/app/_components/page-header";
import { Button } from "@/app/_components/ui/button";
import { Card, CardContent } from "@/app/_components/ui/card";
import { GoalCard } from "./_components/GoalCard";
import { FinancialGoal } from "./types";

export const metadata: Metadata = {
  title: "Metas Financeiras | Conta Rápida",
  description: "Gerencie suas metas financeiras",
};

export default async function GoalsPage() {
  const user = await getCurrentUser();

  if (!user) {
      redirect("/auth");
  }

  // @ts-ignore - O modelo financialGoal está definido no schema mas o TypeScript não o reconhece
  const goals = await prisma.financialGoal.findMany({
    where: {
      userId: user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
  }) as FinancialGoal[];

  return (
    <div className="container py-6">
      <PageHeader
        title="Metas Financeiras"
        description="Gerencie suas metas financeiras"
        action={
          <Button variant="default" asChild>
            <Link href="/goals/new">Nova Meta</Link>
          </Button>
        }
      />

      {goals.length === 0 ? (
        <Card>
          <CardContent className="flex min-h-[400px] flex-col items-center justify-center gap-4 text-center">
            <div className="max-w-[420px] space-y-2">
              <h2 className="text-xl font-semibold">Nenhuma meta encontrada</h2>
              <p className="text-sm text-muted-foreground">
                Você ainda não criou nenhuma meta financeira. Clique no botão acima
                para criar sua primeira meta.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} />
          ))}
        </div>
      )}
    </div>
  );
} 
