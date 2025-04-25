import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/app/_lib/auth-options";
import { PageHeader } from "@/app/_components/page-header";
import { NewGoalForm } from "../_components/NewGoalForm";

export const metadata: Metadata = {
  title: "Nova Meta | Conta Rápida",
  description: "Crie uma nova meta financeira",
};

export default async function NewGoalPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth");
  }

  return (
    <div className="container py-6">
      <PageHeader
        title="Nova Meta"
        description="Crie uma nova meta financeira"
      />

      <NewGoalForm />
    </div>
  );
} 