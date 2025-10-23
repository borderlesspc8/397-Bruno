"use client";

import { useAuth } from "@/app/_hooks/useAuth";
import { Button } from "@/app/_components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/_components/ui/avatar";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/_components/ui/dropdown-menu";
import { LogOut, User, Settings } from "lucide-react";
import Link from "next/link";

export function SimpleUserButton() {
  const { user, signOut } = useAuth();
  
  if (!user) {
    return null;
  }
  
  const { name, email, image } = user;
  const initials = name ? name.charAt(0).toUpperCase() : email?.charAt(0).toUpperCase() || "U";
  
  const handleLogout = async () => {
    try {
      console.log('Logout iniciado');
      await signOut();
      console.log('Logout concluído');
    } catch (error) {
      console.error('Erro no logout:', error);
    }
  };
  
  console.log('SimpleUserButton renderizado:', { name, email });
  
  return (
    <DropdownMenu onOpenChange={(open) => console.log('Dropdown menu principal aberto:', open)}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative rounded-full h-8 w-8 overflow-hidden"
          onClick={() => console.log('Botão clicado')}
          style={{ zIndex: 1 }}
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={image || ""} alt={name || "Avatar"} />
            <AvatarFallback className="bg-primary/10 text-primary">{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-64"
        onOpenChange={(open) => console.log('Dropdown aberto:', open)}
        style={{ 
          zIndex: 99999,
          position: 'fixed',
          backgroundColor: 'white',
          border: '2px solid red',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          borderRadius: '8px',
          padding: '8px',
          minWidth: '200px'
        }}
      >
        <div className="p-2">
          <div className="flex items-center gap-2">
            <Avatar className="h-10 w-10">
              <AvatarImage src={image || ""} alt={name || "Avatar"} />
              <AvatarFallback className="bg-primary/10 text-primary">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <p className="text-sm font-medium">{name}</p>
              <p className="text-xs text-muted-foreground">{email}</p>
            </div>
          </div>
        </div>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem asChild>
          <Link href="/profile" className="flex items-center cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            <span>Meu Perfil</span>
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuItem asChild>
          <Link href="/settings" className="flex items-center cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            <span>Configurações</span>
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={handleLogout} 
          className="cursor-pointer"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sair</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
