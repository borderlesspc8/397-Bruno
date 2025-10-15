import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Conciliação de Transações | Gestão Click",
  description: "Concilie transações entre o Gestão Click e o Conta Rápida"
};

export default function GestaoClickConciliacaoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 
