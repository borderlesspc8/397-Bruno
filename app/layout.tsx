import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "./_lib/utils";
import { SessionProvider } from "./_components/session-provider";
import { ToastProvider } from "./_components/ui/toast";
import ClientThemeProvider from "./_components/client-theme-provider";
import SocketProvider from './_components/socket-provider';
import { NotificationProvider } from './_components/ui/notification';
import { setupAutoImport } from './_lib/auto-import-setup';
import { getServerSession } from "next-auth/next";
import { authOptions } from "./_lib/auth-options";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Conta Rápida | Gestão Financeira Inteligente",
  description: "Plataforma de gestão financeira pessoal e empresarial com inteligência artificial",
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: '#ffffff',
}

// Esta configuração força todas as páginas a usarem renderização no servidor (server-side)
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

// Iniciar configuração automática de importação (apenas no servidor)
if (typeof window === 'undefined') {
  setupAutoImport().catch(error => {
    console.error('[SERVER] Erro ao configurar importação automática:', error);
  });
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);
  
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={cn(
        "min-h-screen font-sans antialiased",
        "bg-background/50 bg-gradient-to-br from-background via-background/95 to-background/90",
        "selection:bg-primary/20",
        inter.className
      )}>
        <SessionProvider session={session}>
          <ClientThemeProvider>
            <ToastProvider>
              <NotificationProvider>
                <SocketProvider>
                  {children}
                </SocketProvider>
              </NotificationProvider>
            </ToastProvider>
          </ClientThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
