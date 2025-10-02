import { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/app/_lib/prisma";
import { PageHeader } from "@/app/_components/page-header";
import { ContributeForm } from "../_components/ContributeForm";

export const metadata: Metadata = {
  title: "Contribuir para Meta | Conta Rápida",
  description: "Adicione uma contribuição à sua meta financeira",
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

interface ContributePageProps {
  params: {
    id: string;
  };
}

export default async function ContributePage({ params }: ContributePageProps) {
  const session = await getServerSession(authOptions);

  if (!user) {
      redirect("/auth");
  }

  // @ts-ignore - O modelo financialGoal está definido no schema mas o TypeScript não o reconhece
  const goal = await prisma.financialGoal.findUnique({
    where: {
      id: params.id,
      userId: user.id,
    },
  }) as FinancialGoal | null;

  if (!goal) {
    notFound();
  }

  return (
    <div className="container py-6">
      <PageHeader
        title={`Contribuir para ${goal.title}`}
        description="Adicione uma contribuição à sua meta financeira"
      />

      <ContributeForm goal={goal} />
    </div>
  );
} 