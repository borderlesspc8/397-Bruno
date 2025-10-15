import { LayoutWithNavbar } from "@/app/_components/layout-with-navbar";
import { AuthGuard } from "@/app/_components/AuthGuard";

// Layout simplificado - o AuthProvider global já cuida da verificação de autenticação
export default function AuthRoutesLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <LayoutWithNavbar>{children}</LayoutWithNavbar>
    </AuthGuard>
  );
} 
