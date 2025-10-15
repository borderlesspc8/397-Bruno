import { redirect } from 'next/navigation';
import { auth } from "@/app/_lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Verificar autenticação
  const session = await auth();
  
  // Redirecionar para login se não estiver autenticado
  if (!session || !session.user) {
    redirect('/login?callback=/admin/chat-admin');
  }
  
  // Verificar se o usuário é administrador
  const isAdmin = session.user.role === 'ADMIN';
  
  // Redirecionar para dashboard se não for administrador
  if (!isAdmin) {
    redirect('/dashboard?error=unauthorized');
  }
  
  return (
    <div>
      {children}
    </div>
  );
} 
