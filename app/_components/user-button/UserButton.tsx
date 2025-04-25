"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Settings, 
  LogOut, 
  User, 
  CreditCard, 
  HelpCircle, 
  Star, 
  Shield, 
  History, 
  Pencil,
  Sun,
  Moon,
  Monitor
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";

// Hooks e Utilitários
import { useUserData } from "./hooks/useUserData";
import { useAvatarCustomization } from "./hooks/useAvatarCustomization";
import { formatPlanName, getPlanBadgeVariant, generateInitials } from "./utils/formatters";
import { useTheme } from "../theme-provider";

// Componentes
import { AccountStatus } from "./components/AccountStatus";
import { ResourceUsageDisplay } from "./components/ResourceUsage"; 
import { AvatarCustomizer } from "./components/AvatarCustomizer";

export function UserButton() {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const { userData, isLoading, updateAvatar } = useUserData();
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState<string | null>(null);
  
  const { 
    isCustomizing, 
    selectedColor, 
    selectedAvatar,
    isUploading,
    colorOptions,
    getAvatarOptions,
    openCustomization,
    closeCustomization,
    selectColor,
    uploadAvatarFile,
    saveAvatarChanges
  } = useAvatarCustomization(userData?.image, updateAvatar);
  
  if (!session?.user) {
    return null;
  }
  
  const { name, email, image } = session.user;
  const initials = generateInitials(name, email);
  const userPlan = userData?.subscriptionPlan || session.user.subscriptionPlan;
  
  const handleLogout = async () => {
    await signOut({ callbackUrl: "/auth/login" });
  };
  
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative rounded-full h-8 w-8 overflow-hidden">
            <Avatar className="h-8 w-8">
              <AvatarImage src={image || ""} alt={name || "Avatar do usuário"} />
              <AvatarFallback className="bg-primary/10 text-primary">{initials}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <div className="flex flex-col p-2 gap-2">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={image || ""} alt={name || "Avatar do usuário"} />
                  <AvatarFallback className="bg-primary/10 text-primary">{initials}</AvatarFallback>
                </Avatar>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={openCustomization} 
                  className="absolute -bottom-1.5 -right-1.5 rounded-full h-5 w-5 bg-muted shadow-sm"
                >
                  <Pencil className="h-3 w-3" />
                  <span className="sr-only">Editar avatar</span>
                </Button>
              </div>
              <div className="flex flex-col">
                <p className="text-sm font-medium leading-none">{name}</p>
                <p className="text-xs leading-none text-muted-foreground mt-1 truncate max-w-[180px]">{email}</p>
              </div>
            </div>
            
            {/* Status da conta */}
            <AccountStatus userData={userData} isLoading={isLoading} />
            
            <Badge variant={getPlanBadgeVariant(userPlan) as "outline" | "secondary" | "default" | "destructive"} className="w-fit mt-1">
              Plano {formatPlanName(userPlan)}
            </Badge>
            
            {/* Uso de recursos */}
            <ResourceUsageDisplay resourceUsage={userData?.resourceUsage} isLoading={isLoading} />
          </div>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem asChild>
            <Link href="/profile" className="flex items-center cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              <span>Meu Perfil</span>
            </Link>
          </DropdownMenuItem>
          
          <DropdownMenuItem asChild>
            <Link href="/subscription" className="flex items-center cursor-pointer">
              <Star className="mr-2 h-4 w-4" />
              <span>Meu Plano</span>
            </Link>
          </DropdownMenuItem>
          
          <DropdownMenuItem asChild>
            <Link href="/history" className="flex items-center cursor-pointer">
              <History className="mr-2 h-4 w-4" />
              <span>Histórico de Atividades</span>
            </Link>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          {/* Opções de Tema */}
          <DropdownMenuLabel className="px-2 pt-0">Aparência</DropdownMenuLabel>
          <div className="px-2 py-1.5 flex gap-2">
            <Button 
              variant={theme === "light" ? "default" : "outline"} 
              size="sm" 
              className="flex-1 flex items-center justify-center gap-1.5"
              onClick={() => setTheme("light")}
            >
              <Sun className="h-3.5 w-3.5" />
              <span className="text-xs">Claro</span>
            </Button>
            <Button 
              variant={theme === "dark" ? "default" : "outline"} 
              size="sm" 
              className="flex-1 flex items-center justify-center gap-1.5"
              onClick={() => setTheme("dark")}
            >
              <Moon className="h-3.5 w-3.5" />
              <span className="text-xs">Escuro</span>
            </Button>
            <Button 
              variant={theme === "system" ? "default" : "outline"} 
              size="sm" 
              className="flex-1 flex items-center justify-center gap-1.5"
              onClick={() => setTheme("system")}
            >
              <Monitor className="h-3.5 w-3.5" />
              <span className="text-xs">Sistema</span>
            </Button>
          </div>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem asChild>
            <Link href="/settings" className="flex items-center cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              <span>Configurações</span>
            </Link>
          </DropdownMenuItem>
          
          <DropdownMenuItem asChild>
            <Link href="/security" className="flex items-center cursor-pointer">
              <Shield className="mr-2 h-4 w-4" />
              <span>Segurança</span>
            </Link>
          </DropdownMenuItem>
          
          <DropdownMenuItem asChild>
            <Link href="/help" className="flex items-center cursor-pointer">
              <HelpCircle className="mr-2 h-4 w-4" />
              <span>Ajuda e Suporte</span>
            </Link>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sair</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* Modal de personalização de avatar */}
      <AvatarCustomizer
        isOpen={isCustomizing}
        onClose={closeCustomization}
        onSave={saveAvatarChanges}
        name={name}
        email={email}
        currentAvatar={image || null}
        selectedAvatar={selectedAvatar}
        selectedColor={selectedColor}
        isUploading={isUploading}
        uploadAvatarFile={uploadAvatarFile}
        selectColor={selectColor}
        colorOptions={colorOptions}
        avatarOptions={getAvatarOptions()}
        setSelectedAvatar={setSelectedAvatarUrl}
      />
    </>
  );
} 