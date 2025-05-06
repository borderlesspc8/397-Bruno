import { redirect } from "next/navigation";
import { getAuthSession } from "@/app/_lib/auth";
import { LayoutWithNavbar } from "@/app/_components/layout-with-navbar";

// Componente do lado do servidor para verificação de autenticação
export default async function AuthRoutesLayout({ children }: { children: React.ReactNode }) {
  const { user } = await getAuthSession();

  if (!user) {
    redirect("/auth");
  }

  // Agora utilizamos o LayoutWithNavbar em vez do layout com sidebar
  return <LayoutWithNavbar>{children}</LayoutWithNavbar>;
} 