import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";

import { authOptions } from "@/app/_lib/auth-options";
import { prisma } from "@/app/_lib/prisma";
import { PageHeader } from "@/app/_components/page-header";
import { EditGoalForm } from "../_components/EditGoalForm";

export const metadata: Metadata = {
  title: "Editar Meta | Conta Rápida",
  description: "Edite sua meta financeira",
};

// Tipagem para uma meta financeira
interface FinancialGoal {
  id: string;
  title: string;
  description: string | null;
  targetAmount: number;
  currentAmount: number;
  category: string;
  targetDate: Date;
  status: string;
  colorAccent: string | null;
  iconName: string | null;
}

interface EditGoalPageProps {
  params: {
    id: string;
  };
}

export default async function EditGoalPage({ params }: EditGoalPageProps) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth");
  }

  // @ts-ignore - O modelo financialGoal está definido no schema mas o TypeScript não o reconhece
  const goal = await prisma.financialGoal.findUnique({
    where: {
      id: params.id,
      userId: session.user.id,
    },
  }) as FinancialGoal | null;

  if (!goal) {
    notFound();
  }

  return (
    <div className="container py-6">
      <PageHeader
        title="Editar Meta"
        description="Edite sua meta financeira"
      />

      <EditGoalForm goal={goal} />
    </div>
  );
} 