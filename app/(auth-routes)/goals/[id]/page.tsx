import { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/app/_lib/prisma";
import { PageHeader } from "@/app/_components/page-header";
import { Button } from "@/app/_components/ui/button";
import { GoalDetails } from "./_components/GoalDetails";
import { GoalContributions } from "./_components/GoalContributions";

export const metadata: Metadata = {
  title: "Detalhes da Meta | Conta Rápida",
  description: "Detalhes da meta financeira",
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

interface GoalPageProps {
  params: {
    id: string;
  };
}

export default async function GoalPage({ params }: GoalPageProps) {
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
    <div className="container py-6 space-y-8">
      <PageHeader
        title={goal.title}
        description="Detalhes da meta financeira"
        action={
          <Button variant="outline" asChild>
            <Link href="/goals">Voltar</Link>
          </Button>
        }
      />

      <GoalDetails goal={goal} />
      
      <GoalContributions goalId={goal.id} />
    </div>
  );
} 