import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Metas de Vendas | Gestor Personal Prime",
  description: "Gerenciamento de metas de vendas mensais.",
};

export default function MetasVendasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 
