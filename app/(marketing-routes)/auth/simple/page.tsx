"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/app/_lib/supabase";
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

export default function SimpleAuthPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsLoading(true);

    try {
      const supabase = createClient();
      
      // Login via Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password,
      });

      if (error) {
        setFormError(error.message);
        return;
      }

      if (data.user) {
        toast.success("Login realizado com sucesso!");
        router.push("/dashboard/vendas");
      }
    } catch (error) {
      console.error("Erro ao fazer login:", error);
      setFormError("Erro ao fazer login");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Conta Rápida</h1>
          <p className="mt-2 text-sm text-gray-600">
            Acesse sua conta
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Login</CardTitle>
            <CardDescription>
              Entre com suas credenciais para acessar o sistema
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
                <Label htmlFor="email">E-mail</Label>
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
                    Entrando...
                  </>
                ) : (
                  "Entrar"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Teste com: <strong>admin@example.com</strong> / <strong>password123</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
