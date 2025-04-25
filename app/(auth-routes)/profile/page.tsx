"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/_components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/_components/ui/avatar";
import { Separator } from "@/app/_components/ui/separator";
import { Loader2, Shield, UserCog, CalendarDays, BarChart, CreditCard, Menu } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/app/_components/ui/button";
import { Sheet, SheetTrigger, SheetContent } from "@/app/_components/ui/sheet";

// Componentes de perfil
import ProfileInfo from "./_components/ProfileInfo";
import SecuritySettings from "./_components/SecuritySettings";
import ActivityHistory from "./_components/ActivityHistory";
import UsageStatistics from "./_components/UsageStatistics";
import SubscriptionDetails from "./_components/SubscriptionDetails";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState("profile");
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Verifique o tamanho da tela para ajustar a UI
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  const fetchUserProfile = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/user/profile");
      if (!response.ok) {
        throw new Error("Falha ao buscar perfil");
      }
      const data = await response.json();
      setUserProfile(data);
    } catch (error) {
      console.error("Erro ao buscar perfil:", error);
      toast.error("Não foi possível carregar seu perfil");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      fetchUserProfile();
    }
  }, [status, session]);

  // Renderize o conteúdo com base no estado de carregamento
  if (status === "loading" || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Carregando seu perfil...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Acesso não autorizado</h1>
          <p className="mt-2 text-muted-foreground">Faça login para acessar seu perfil</p>
        </div>
      </div>
    );
  }

  // Renderizar menu de navegação para dispositivos móveis
  const MobileNavigation = () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="md:hidden fixed bottom-4 right-4 z-50 shadow-lg">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[60vh]">
        <div className="pt-6">
          <TabsList className="flex flex-col w-full gap-2">
            <TabsTrigger 
              value="profile" 
              onClick={() => setActiveTab("profile")}
              className="w-full justify-start gap-2 px-3"
            >
              <UserCog className="h-4 w-4" />
              <span>Informações Pessoais</span>
            </TabsTrigger>
            
            <TabsTrigger 
              value="security" 
              onClick={() => setActiveTab("security")}
              className="w-full justify-start gap-2 px-3"
            >
              <Shield className="h-4 w-4" />
              <span>Segurança</span>
            </TabsTrigger>
            
            <TabsTrigger 
              value="activity" 
              onClick={() => setActiveTab("activity")}
              className="w-full justify-start gap-2 px-3"
            >
              <CalendarDays className="h-4 w-4" />
              <span>Histórico de Atividades</span>
            </TabsTrigger>
            
            <TabsTrigger 
              value="usage" 
              onClick={() => setActiveTab("usage")}
              className="w-full justify-start gap-2 px-3"
            >
              <BarChart className="h-4 w-4" />
              <span>Estatísticas de Uso</span>
            </TabsTrigger>
            
            <TabsTrigger 
              value="subscription" 
              onClick={() => setActiveTab("subscription")}
              className="w-full justify-start gap-2 px-3"
            >
              <CreditCard className="h-4 w-4" />
              <span>Assinatura</span>
            </TabsTrigger>
          </TabsList>
        </div>
      </SheetContent>
    </Sheet>
  );

  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <div className="flex flex-col gap-8">
        {/* Cabeçalho com informações do usuário */}
        <Card className="border-none overflow-hidden shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
              <Avatar className="h-20 w-20 border-4 border-background shadow-md">
                <AvatarImage src={session?.user?.image || ""} />
                <AvatarFallback className="text-xl font-medium">
                  {session?.user?.name?.charAt(0) || session?.user?.email?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              
              <div className="space-y-1.5">
                <h2 className="text-2xl font-bold">{session?.user?.name || "Usuário"}</h2>
                <p className="text-muted-foreground">{session?.user?.email}</p>
                <div className="flex flex-col md:flex-row gap-3 mt-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <CalendarDays className="h-4 w-4" />
                    <span>
                      Membro desde {userProfile?.createdAt 
                        ? new Date(userProfile.createdAt).toLocaleDateString('pt-BR')
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="hidden md:block">•</div>
                  <div className="flex items-center gap-1">
                    <CreditCard className="h-4 w-4" />
                    <span>Plano {userProfile?.subscription?.plan || 'Free'}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs principais para desktop */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="hidden md:block">
          <div className="border-b">
            <TabsList className="w-full justify-start h-auto p-0 bg-transparent">
              <TabsTrigger 
                value="profile" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none py-3"
              >
                <UserCog className="h-4 w-4 mr-2" />
                Informações Pessoais
              </TabsTrigger>
              
              <TabsTrigger 
                value="security" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none py-3"
              >
                <Shield className="h-4 w-4 mr-2" />
                Segurança
              </TabsTrigger>
              
              <TabsTrigger 
                value="activity" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none py-3"
              >
                <CalendarDays className="h-4 w-4 mr-2" />
                Histórico de Atividades
              </TabsTrigger>
              
              <TabsTrigger 
                value="usage" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none py-3"
              >
                <BarChart className="h-4 w-4 mr-2" />
                Estatísticas de Uso
              </TabsTrigger>
              
              <TabsTrigger 
                value="subscription" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none py-3"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Assinatura
              </TabsTrigger>
            </TabsList>
          </div>
        </Tabs>

        {/* Navegação móvel */}
        {isMobile && <MobileNavigation />}

        {/* Cabeçalho da seção ativa (apenas mobile) */}
        {isMobile && (
          <div className="md:hidden">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              {activeTab === "profile" && <><UserCog className="h-5 w-5 mr-2" /> Informações Pessoais</>}
              {activeTab === "security" && <><Shield className="h-5 w-5 mr-2" /> Segurança</>}
              {activeTab === "activity" && <><CalendarDays className="h-5 w-5 mr-2" /> Histórico de Atividades</>}
              {activeTab === "usage" && <><BarChart className="h-5 w-5 mr-2" /> Estatísticas de Uso</>}
              {activeTab === "subscription" && <><CreditCard className="h-5 w-5 mr-2" /> Assinatura</>}
            </h2>
            <Separator className="mb-6" />
          </div>
        )}

        {/* Conteúdo das abas */}
        <div className="space-y-6">
          {activeTab === "profile" && session?.user && <ProfileInfo user={session.user} userProfile={userProfile} />}
          {activeTab === "security" && session?.user && <SecuritySettings user={session.user} />}
          {activeTab === "activity" && session?.user && <ActivityHistory user={session.user} />}
          {activeTab === "usage" && session?.user && <UsageStatistics user={session.user} userProfile={userProfile} />}
          {activeTab === "subscription" && session?.user && <SubscriptionDetails user={session.user} subscription={userProfile?.subscription} />}
        </div>
      </div>
    </div>
  );
} 