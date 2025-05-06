import React, { Suspense } from 'react';
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { getServerSession } from "next-auth/next";
import "./globals.css";
import { cn } from "./_lib/utils";
import { SessionProvider } from "./_components/session-provider";
import { ToastProvider } from "./_components/ui/toast";
import ClientThemeProvider from "./_components/client-theme-provider";
import SocketProvider from './_components/socket-provider';
import { NotificationProvider } from './_components/ui/notification';
import { authOptions } from "./_lib/auth-options";
import { DemoBanner } from "./components/DemoBanner";
import { setupAutoImport } from './_lib/auto-import-setup';

const inter = Inter({ subsets: ["latin"] });

// Componente para páginas em carregamento
const LoadingFallback = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-background z-50">
    <div className="flex flex-col items-center space-y-4">
      <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent"></div>
      <p className="text-muted-foreground">Carregando...</p>
    </div>
  </div>
);

export const metadata: Metadata = {
  title: "Painel de Indicadores | Personal Prime",
  description: "Plataforma de gestão financeira pessoal e empresarial com inteligência artificial",
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { url: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
  authors: [
    {
      name: 'Conta Rápida',
      url: 'https://acceleracrm.com.br',
    },
  ],
  openGraph: {
    title: 'Conta Rápida - Gestão financeira simplificada',
    description: 'Sistema de gestão financeira simplificada para negócios de todos os tamanhos.',
    url: 'https://acceleracrm.com.br',
    siteName: 'Conta Rápida',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Conta Rápida',
      },
    ],
    locale: 'pt_BR',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "#171717" },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
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
      <head>
        {/* Favicons diretos para garantir prioridade */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon-32x32.png" sizes="32x32" type="image/png" />
        <link rel="icon" href="/favicon-16x16.png" sizes="16x16" type="image/png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        
        <script 
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('tema') || 'system';
                  const root = document.documentElement;
                  
                  // Limpar classes de tema existentes
                  root.classList.remove('light', 'dark');
                  
                  if (theme === 'system') {
                    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                    root.classList.add(systemTheme);
                  } else {
                    root.classList.add(theme);
                  }
                } catch (e) {
                  // Fallback para light theme em caso de erro
                  document.documentElement.classList.add('light');
                }
              })();
            `,
          }}
        />
      </head>
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
                  <DemoBanner />
                  <Suspense fallback={<LoadingFallback />}>
                  {children}
                  </Suspense>
                </SocketProvider>
              </NotificationProvider>
            </ToastProvider>
          </ClientThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
