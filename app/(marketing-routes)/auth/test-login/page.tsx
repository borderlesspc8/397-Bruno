"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/_hooks/useAuth";
import { toast } from "sonner";
import { Loader2, Mail, Lock } from "lucide-react";

// UI Components
import { Button } from "@/app/_components/ui/button";
import { 
  Card, CardContent, CardDescription, 
  CardHeader, CardTitle 
} from "@/app/_components/ui/card";
import { Input } from "@/app/_components/ui/input";
import { Label } from "@/app/_components/ui/label";
import { Alert, AlertDescription } from "@/app/_components/ui/alert";

export default function TestLoginPage() {
  const router = useRouter();
  const { signIn, user, loading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  
  const [loginData, setLoginData] = useState({
    email: "mvcas95@gmail.com",
    password: "marcos1234",
  });

  // Debug: mostrar estado atual
  console.log("TestLogin - user:", user, "loading:", loading);

  // O AuthProvider global já cuida do redirecionamento de usuários logados

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsLoading(true);

    try {
      console.log("Iniciando login...");
      const { success, error } = await signIn(loginData.email, loginData.password);

      if (!success) {
        setFormError(error || "Email ou senha incorretos");
        return;
      }

      console.log("Login bem-sucedido!");
      toast.success("Login realizado com sucesso!");
      
    } catch (error) {
      console.error("Erro ao fazer login:", error);
      setFormError("Erro ao fazer login");
    } finally {
      setIsLoading(false);
    }
  };

  // O AuthProvider global já cuida do loading e redirecionamento

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Teste de Login
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Debug do sistema de autenticação
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Teste de Login</CardTitle>
            <CardDescription>
              Estado atual: {loading ? "Carregando..." : user ? "Logado" : "Não logado"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {formError && (
                <Alert variant="destructive">
                  <AlertDescription>{formError}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={loginData.email}
                    onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Sua senha"
                    value={loginData.password}
                    onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testando...
                  </>
                ) : (
                  "Testar Login"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
