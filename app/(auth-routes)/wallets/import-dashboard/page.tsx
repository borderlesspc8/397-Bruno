import { Metadata } from "next";
import ImportDashboard from "@/app/_components/import-dashboard/ImportDashboard";

export const metadata: Metadata = {
  title: "Dashboard de Importações | Conta Rápida",
  description: "Visualize e gerencie suas importações de dados financeiros.",
};

export default function ImportDashboardPage() {
  return (
    <div className="container py-6">
      <ImportDashboard />
    </div>
  );
} 