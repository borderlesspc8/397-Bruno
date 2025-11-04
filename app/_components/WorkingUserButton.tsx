"use client";

import { useState } from "react";
import { useAuth } from "@/app/_hooks/useAuth";
import { Button } from "@/app/_components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/_components/ui/avatar";
import { LogOut, User, Settings } from "lucide-react";

export function WorkingUserButton() {
  const { user, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  
  if (!user) {
    return null;
  }
  
  const { name, email, image } = user;
  const initials = name ? name.charAt(0).toUpperCase() : email?.charAt(0).toUpperCase() || "U";
  
  const handleLogout = async () => {
    try {
      const result = await signOut();
      if (result?.success !== false) {
        // Redirecionar para a tela de login após logout bem-sucedido
        // Usar window.location.href para forçar reload completo e limpar todo o estado
        window.location.href = '/auth';
      }
    } catch (error) {
      console.error('Erro no logout:', error);
    }
  };
  
  
  return (
    <div className="relative z-10">
      <Button 
        variant="ghost" 
        size="icon" 
        className="relative rounded-full h-8 w-8 overflow-hidden"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Avatar className="h-8 w-8">
          <AvatarImage src={image || ""} alt={name || "Avatar"} />
          <AvatarFallback className="bg-primary/10 text-primary">{initials}</AvatarFallback>
        </Avatar>
      </Button>
      
      {isOpen && (
        <div className="absolute top-full right-0 z-[99999] bg-popover border border-border rounded-lg p-2 min-w-[200px] shadow-lg mt-1">
          <div className="p-2">
            <div className="flex items-center gap-2 mb-2">
              <Avatar className="h-10 w-10">
                <AvatarImage src={image || ""} alt={name || "Avatar"} />
                <AvatarFallback className="bg-primary/10 text-primary">{initials}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium text-foreground">{name}</p>
                <p className="text-xs text-muted-foreground">{email}</p>
              </div>
            </div>
          </div>
          
          <div className="border-t border-border my-2"></div>
          
          <div 
            className="flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors"
            onClick={() => setIsOpen(false)}
          >
            <User size={16} />
            <span className="text-sm">Meu Perfil</span>
          </div>
          
          <div 
            className="flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors"
            onClick={() => setIsOpen(false)}
          >
            <Settings size={16} />
            <span className="text-sm">Configurações</span>
          </div>
          
          <div className="border-t border-border my-2"></div>
          
          <div 
            className="flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors text-destructive"
            onClick={() => {
              handleLogout();
              setIsOpen(false);
            }}
          >
            <LogOut size={16} />
            <span className="text-sm">Sair</span>
          </div>
        </div>
      )}
    </div>
  );
}
