"use client";

import { ProtectedLayout } from "@/app/_components/protected-layout";
import Navbar from "@/app/_components/navbar";
import { Sidebar } from "@/app/_components/sidebar";
import { Toaster } from "sonner";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/app/_components/ui/button";
import NotificationAlert from "@/app/_components/notifications/notification-alert";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Detectar tamanho da tela e ajustar sidebar conforme necessário
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      
      // Em dispositivos móveis, a sidebar começa fechada
      if (mobile && sidebarOpen) {
        setSidebarOpen(false);
      } else if (!mobile && !sidebarOpen) {
        setSidebarOpen(true);
      }
    };
    
    // Executar uma vez na montagem do componente
    handleResize();
    
    // Adicionar listener para redimensionamento
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarOpen]);
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <ProtectedLayout>
      <div className="flex h-screen overflow-hidden bg-background">
        {/* Navbar fixo no topo */}
        <div className="fixed top-0 left-0 right-0 z-40 h-14 border-b bg-background/95 backdrop-blur">
          <Navbar />
        </div>
        
        {/* Container principal abaixo do navbar */}
        <div className="flex w-full mt-14 h-[calc(100vh-3.5rem)]">
          {/* Sidebar */}
          <div 
            className={`fixed lg:relative z-30 h-full transition-all duration-300 ease-in-out
              ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-20'}`}
          >
            <Sidebar />
          </div>
          
          {/* Overlay para dispositivos móveis */}
          {sidebarOpen && isMobile && (
            <div 
              className="fixed inset-0 z-20 bg-black/50 lg:hidden"
              onClick={toggleSidebar}
            />
          )}
          
          {/* Botão de toggle para dispositivos móveis */}
          <button
            className="fixed top-16 left-4 z-40 lg:hidden rounded-full p-2 bg-background/80 backdrop-blur-sm border shadow-sm"
            onClick={toggleSidebar}
            aria-label={sidebarOpen ? "Fechar menu" : "Abrir menu"}
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          
          {/* Conteúdo principal - reduzindo padding */}
          <main 
            className={`flex-1 overflow-y-auto p-2 transition-all duration-300`}
          >
            {children}
          </main>
        </div>
        
        {/* Componentes globais */}
        <Toaster position="top-right" richColors />
        <NotificationAlert 
          position="bottom-right"
          priorities={['HIGH', 'MEDIUM']}
          types={['TRANSACTION']}
          autoHide={false}
        />
      </div>
    </ProtectedLayout>
  );
} 