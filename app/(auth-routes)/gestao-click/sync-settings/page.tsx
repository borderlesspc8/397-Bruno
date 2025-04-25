import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/_lib/auth-options";
import Link from "next/link";
import dynamic from "next/dynamic";

// Importar o formulário de configurações de sincronização
const SyncSettingsForm = dynamic(() => import("@/app/_components/gestao-click/SyncSettingsForm"), {
  ssr: false,
  loading: () => <div className="h-[500px] w-full flex items-center justify-center">Carregando...</div>
});

export const metadata: Metadata = {
  title: "Configurações de Sincronização - Gestão Click",
  description: "Configure a sincronização automática entre sua conta do Gestão Click e a Conta Rápida",
};

export default async function GestaoClickSyncSettingsPage() {
  // Verificar autenticação
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect("/auth/signin?callbackUrl=/gestao-click/sync-settings");
  }
  
  return (
    <div className="min-h-screen bg-background">
      <main className="p-4 md:p-6 lg:p-8 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <Link 
            href="/gestao-click" 
            className="text-sm inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            ← Voltar para Gestão Click
          </Link>
        </div>
        
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Configurações de Sincronização</h1>
          <p className="text-muted-foreground mt-1">
            Configure a sincronização automática entre sua conta do Gestão Click e a Conta Rápida
          </p>
        </div>
        
        <div className="grid gap-6">
          <div className="border rounded-lg overflow-hidden shadow-sm mb-6">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">Como funciona a sincronização automática</h2>
              <p className="text-muted-foreground text-sm mt-1">
                Entenda como configurar a sincronização automática com o Gestão Click
              </p>
            </div>
            
            <div className="p-6 space-y-4">
              <p>
                A sincronização automática permite que suas carteiras e transações do Gestão Click 
                sejam atualizadas periodicamente em sua conta da Conta Rápida sem intervenção manual.
              </p>
              
              <h3 className="text-lg font-medium mt-4">Benefícios</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Mantenha seus dados sempre atualizados</li>
                <li>Economize tempo com a importação manual</li>
                <li>Tenha uma visão unificada de todas as suas finanças</li>
                <li>Controle a frequência de atualização de acordo com sua necessidade</li>
              </ul>
              
              <h3 className="text-lg font-medium mt-4">Requisitos</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Conta ativa no Gestão Click</li>
                <li>Credenciais de API válidas (API Key e Secret Token)</li>
                <li>As credenciais podem ser configuradas no arquivo .env da aplicação ou diretamente nesta página</li>
              </ul>
              
              <div className="bg-muted p-4 rounded-lg mt-4">
                <h4 className="font-medium mb-2">Dica de segurança</h4>
                <p className="text-sm">
                  Para maior segurança, recomendamos configurar suas credenciais no arquivo .env 
                  do servidor e usar a opção &quot;Usar credenciais do ambiente&quot;. 
                  Isso evita que suas chaves de API sejam armazenadas no banco de dados.
                </p>
              </div>
            </div>
          </div>
          
          <SyncSettingsForm />
        </div>
      </main>
    </div>
  );
} 