"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/_hooks/useAuth";
import { toast } from "sonner";
import { Loader2, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { AuthRedirect } from "@/app/_components/auth-redirect";

// UI Components
import { Button } from "@/app/_components/ui/button";
import { 
  Card, CardContent, CardDescription, 
  CardHeader, CardTitle 
} from "@/app/_components/ui/card";
import { Input } from "@/app/_components/ui/input";
import { Label } from "@/app/_components/ui/label";
import { Alert, AlertDescription } from "@/app/_components/ui/alert";

export default function SimpleLoginPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsLoading(true);

    try {
      const { success, error } = await signIn(loginData.email, loginData.password);

      if (!success) {
        setFormError(error || "Email ou senha incorretos");
        return;
      }

      toast.success("Login realizado com sucesso!");
      // O redirecionamento será feito pelo AuthRedirect component
      
    } catch (error) {
      console.error("Erro ao fazer login:", error);
      setFormError("Erro ao fazer login");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthRedirect>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Fazer Login
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Entre com suas credenciais para acessar o sistema
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Entrar na sua conta</CardTitle>
            <CardDescription>
              Digite seu email e senha para acessar o sistema
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
                    type={showPassword ? "text" : "password"}
                    placeholder="Sua senha"
                    value={loginData.password}
                    onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 h-4 w-4 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff /> : <Eye />}
                  </button>
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
      </div>
    </div>
    </AuthRedirect>
  );
}
