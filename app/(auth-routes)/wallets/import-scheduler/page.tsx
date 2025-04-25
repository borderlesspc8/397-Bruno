import { Metadata } from "next";
import ImportScheduler from "@/app/_components/import-dashboard/ImportScheduler";

export const metadata: Metadata = {
  title: "Agendamento de Importações | Conta Rápida",
  description: "Agende importações automáticas de dados do Gestão Click."
};

export default function ImportSchedulerPage() {
  return (
    <div className="container py-6">
      <ImportScheduler />
    </div>
  );
} 