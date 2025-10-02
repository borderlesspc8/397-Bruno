import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { PageHeader } from "@/app/_components/page-header";
import { NewGoalForm } from "../_components/NewGoalForm";

export const metadata: Metadata = {
  title: "Nova Meta | Conta Rápida",
  description: "Crie uma nova meta financeira",
};

export default async function NewGoalPage() {
  const user = await getCurrentUser();

  if (!user) {
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