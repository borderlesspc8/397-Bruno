"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/app/_components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/_components/ui/tabs";
import { Button } from "@/app/_components/ui/button";
import { CheckCircle, Info } from "lucide-react";
import { useAuth } from "@/app/_hooks/useAuth";
import { useState } from "react";

export default function TestePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("info");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Teste de Proteção de Rota</h1>
        <p className="text-muted-foreground">
          Esta página verifica se o layout protegido está funcionando corretamente.
        </p>
      </div>

      <Tabs defaultValue="info" onValueChange={setActiveTab} value={activeTab}>
        <TabsList>
          <TabsTrigger value="info">Informações</TabsTrigger>
          <TabsTrigger value="session">Dados da Sessão</TabsTrigger>
        </TabsList>
        <TabsContent value="info" className="space-y-4 mt-4">
          <Alert className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <AlertTitle className="text-green-700 dark:text-green-400 ml-2">Funcionando corretamente!</AlertTitle>
            <AlertDescription className="text-green-700/90 dark:text-green-400/90 ml-2">
              Se você está vendo esta página, significa que o ProtectedLayout está funcionando corretamente e redirecionando usuários não autenticados para a página de login.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle>Implementação de Proteção de Rotas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-3">
                A proteção de rotas é implementada através dos seguintes componentes:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Hook <code className="bg-muted px-1 py-0.5 rounded">useUserProfile</code> para carregar o perfil do usuário</li>
                <li>Componente <code className="bg-muted px-1 py-0.5 rounded">ProtectedLayout</code> que envolve as rotas autenticadas</li>
                <li>Layout <code className="bg-muted px-1 py-0.5 rounded">app/(auth-routes)/layout.tsx</code> atualizado</li>
                <li>Redirecionamento e lógica de logout para usuários não encontrados (404)</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="session" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Dados da Sessão</CardTitle>
            </CardHeader>
            <CardContent>
              {user ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">Usuário</h3>
                    <pre className="bg-muted p-4 rounded-md overflow-auto text-xs">
                      {JSON.stringify(user, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <h3 className="font-medium mb-2">Sessão Completa</h3>
                    <pre className="bg-muted p-4 rounded-md overflow-auto text-xs">
                      {JSON.stringify(user, null, 2)}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center p-6 text-muted-foreground">
                  <Info className="mr-2 h-5 w-5" />
                  <span>Nenhuma sessão encontrada</span>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 