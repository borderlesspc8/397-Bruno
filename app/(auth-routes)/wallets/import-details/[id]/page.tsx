import { Metadata } from "next";
import ImportDetails from "@/app/_components/import-dashboard/ImportDetails";

export const metadata: Metadata = {
  title: "Detalhes da Importação | Conta Rápida",
  description: "Visualize detalhes de uma importação específica e suas transações."
};

export default function ImportDetailsPage({ params }: { params: { id: string } }) {
  return (
    <div className="container py-6">
      <ImportDetails id={params.id} />
    </div>
  );
} 