import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/_lib/auth-options";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { Button } from "@/app/_components/ui/button";
import { ExternalLink, Users, FileText, Settings } from "lucide-react";

// Definir metadados da página
export const metadata: Metadata = {
  title: "Gestão Click | Conta Rápida",
  description: "Integração com o sistema Gestão Click para importação de dados"
};

export default async function GestaoClickPage() {
  // Verificar autenticação
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect("/login");
  }
  
  return (
    <div className="container py-6">
      <h1 className="text-3xl font-bold mb-2">Integração com Gestão Click</h1>
      <p className="text-muted-foreground mb-8">
        Gerencie dados e sincronize informações entre o Gestão Click e a Conta Rápida
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-md transition-all">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5 text-primary" />
              Clientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Visualize e importe clientes do sistema Gestão Click.
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/gestao-click/clientes">
                Gerenciar Clientes
                <ExternalLink className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-all">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5 text-primary" />
              Vendas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Importe e gerencie vendas do Gestão Click.
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/gestao-click/vendas">
                Gerenciar Vendas
                <ExternalLink className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-all">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="mr-2 h-5 w-5 text-primary" />
              Configurações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Configure a sincronização e credenciais do Gestão Click.
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/gestao-click/sync-settings">
                Configurar Sincronização
                <ExternalLink className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}