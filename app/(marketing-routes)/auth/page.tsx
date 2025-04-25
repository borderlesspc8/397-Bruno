"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { 
  ArrowRight, Loader2, Lock, Mail, UserCheck, KeyRound, 
  Eye, EyeOff, AlertCircle, CheckCircle, AtSign 
} from "lucide-react";

// UI Components
import { Button } from "@/app/_components/ui/button";
import { 
  Card, CardContent, CardDescription, 
  CardFooter, CardHeader, CardTitle 
} from "@/app/_components/ui/card";
import { Input } from "@/app/_components/ui/input";
import { Label } from "@/app/_components/ui/label";
import { Separator } from "@/app/_components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/_components/ui/tabs";
import { Alert, AlertDescription } from "@/app/_components/ui/alert";

type AuthMode = "login" | "register" | "forgot-password" | "magic-link";

// Componente para botão de login com Google
function GoogleLoginButton({ onClick, isLoading }: { onClick: () => void, isLoading: boolean }) {
  return (
    <Button 
      variant="outline" 
      type="button" 
      disabled={isLoading}
      onClick={onClick} 
      className="w-full flex items-center justify-center gap-2"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <svg viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg">
          <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
            <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z" />
            <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z" />
            <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z" />
            <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z" />
          </g>
        </svg>
      )}
      <span>Continuar com Google</span>
    </Button>
  );
}

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  
  // Determinar modo inicial baseado em parâmetros de URL
  const defaultMode = searchParams?.get("mode") as AuthMode || "login";
  const [mode, setMode] = useState<AuthMode>(defaultMode);

  // Estados para formulários
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
    rememberMe: false
  });

  const [registerData, setRegisterData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false
  });

  const [forgotPasswordData, setForgotPasswordData] = useState({
    email: ""
  });

  const [magicLinkData, setMagicLinkData] = useState({
    email: ""
  });

  // Atualizar modo quando os parâmetros de URL mudarem
  useEffect(() => {
    const mode = searchParams?.get("mode") as AuthMode;
    if (mode) {
      setMode(mode);
    }
  }, [searchParams]);

  // Validar força da senha
  useEffect(() => {
    if (!registerData.password) {
      setPasswordStrength(0);
      return;
    }

    let strength = 0;
    // Pelo menos 8 caracteres
    if (registerData.password.length >= 8) strength++;
    // Contém letras minúsculas
    if (/[a-z]/.test(registerData.password)) strength++;
    // Contém letras maiúsculas
    if (/[A-Z]/.test(registerData.password)) strength++;
    // Contém números
    if (/[0-9]/.test(registerData.password)) strength++;
    // Contém caracteres especiais
    if (/[^a-zA-Z0-9]/.test(registerData.password)) strength++;

    setPasswordStrength(strength);
  }, [registerData.password]);

  // Handler para login com credenciais
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email: loginData.email,
        password: loginData.password,
        redirect: false
      });

      if (result?.error) {
        setFormError("Email ou senha incorretos. Tente novamente.");
        return;
      }

      toast.success("Login realizado com sucesso!");
      router.push("/dashboard");
    } catch (error) {
      setFormError("Ocorreu um erro ao fazer login. Tente novamente mais tarde.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handler para login social
  const handleSocialLogin = async (provider: string) => {
    setIsLoading(true);
    try {
      await signIn(provider, { callbackUrl: "/dashboard" });
    } catch (error) {
      toast.error(`Erro ao fazer login com ${provider}`);
      setIsLoading(false);
    }
  };

  // Handler para magic link
  const handleMagicLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    setIsLoading(true);

    try {
      await signIn("email", {
        email: magicLinkData.email,
        redirect: false,
      });
      
      setFormSuccess("Link de acesso enviado para seu email. Verifique sua caixa de entrada.");
    } catch (error) {
      setFormError("Ocorreu um erro ao enviar o link. Tente novamente mais tarde.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handler para registro
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    setIsLoading(true);

    // Validações
    if (registerData.password !== registerData.confirmPassword) {
      setFormError("As senhas não correspondem.");
      setIsLoading(false);
      return;
    }

    if (passwordStrength < 3) {
      setFormError("Por favor, use uma senha mais forte.");
      setIsLoading(false);
      return;
    }

    if (!registerData.agreeTerms) {
      setFormError("Você precisa concordar com os Termos de Uso.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: registerData.name,
          email: registerData.email,
          password: registerData.password
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erro ao registrar");
      }

      setFormSuccess("Cadastro realizado com sucesso! Você já pode fazer login.");
      setTimeout(() => {
        setMode("login");
        setLoginData({
          ...loginData,
          email: registerData.email,
        });
      }, 2000);
    } catch (error: any) {
      setFormError(error.message || "Erro ao criar conta. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handler para recuperação de senha
  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email: forgotPasswordData.email })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erro ao solicitar recuperação de senha");
      }

      setFormSuccess("Email enviado! Verifique sua caixa de entrada para redefinir sua senha.");
    } catch (error: any) {
      setFormError(error.message || "Erro ao enviar email de recuperação.");
    } finally {
      setIsLoading(false);
    }
  };

  // UI para indicador de força de senha
  const renderPasswordStrength = () => {
    const strengthLabels = ["Muito fraca", "Fraca", "Média", "Forte", "Muito forte"];
    const strengthColors = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-green-400", "bg-green-600"];
    
    return (
      <div className="mt-1 space-y-1">
        <div className="flex h-2 gap-1">
          {[1, 2, 3, 4, 5].map((level) => (
            <div 
              key={level}
              className={`h-full flex-1 rounded-sm transition-all ${
                level <= passwordStrength ? strengthColors[passwordStrength - 1] : "bg-gray-200 dark:bg-gray-700"
              }`}
            />
          ))}
        </div>
        {passwordStrength > 0 && (
          <p className="text-xs text-muted-foreground">
            Força: {strengthLabels[passwordStrength - 1]}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header com Logo */}
      <header className="container mx-auto flex items-center justify-between py-8">
        <div className="flex items-center gap-2">
          <div className="relative h-10 w-10">
            <Image
              src="/logo.svg"
              alt="Conta Rápida"
              fill
              className="object-contain"
              priority
            />
          </div>
          <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
            Conta Rápida
          </span>
        </div>
        <nav>
          <ul className="flex items-center gap-4">
            <li>
              <Link 
                href="/" 
                className="text-sm text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400"
              >
                Início
              </Link>
            </li>
            <li>
              <Link 
                href="/features" 
                className="text-sm text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400"
              >
                Funcionalidades
              </Link>
            </li>
            <li>
              <Link 
                href="/pricing" 
                className="text-sm text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400"
              >
                Planos
              </Link>
            </li>
          </ul>
        </nav>
      </header>

      <main className="container mx-auto flex flex-1 items-center justify-center px-4 py-10">
        <div className="grid w-full max-w-5xl gap-8 lg:grid-cols-2">
          {/* Coluna informativa */}
          <div className="hidden flex-col justify-center space-y-6 lg:flex">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold tracking-tight text-blue-700 dark:text-blue-400">
                Gerencie suas finanças com facilidade
              </h1>
              <p className="text-lg text-muted-foreground">
                Com o Conta Rápida você tem o controle total das suas finanças pessoais e empresariais em um só lugar.
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50">
                  <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-medium">Sincronização bancária</h3>
                  <p className="text-sm text-muted-foreground">
                    Integre suas contas bancárias para acompanhar automaticamente todas as transações.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50">
                  <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-medium">Dashboards inteligentes</h3>
                  <p className="text-sm text-muted-foreground">
                    Visualize seus gastos, receitas e investimentos através de relatórios intuitivos.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50">
                  <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-medium">Categorização automática</h3>
                  <p className="text-sm text-muted-foreground">
                    Suas transações são automaticamente organizadas em categorias para melhor análise.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Forms de autenticação */}
          <div className="flex justify-center">
            <Card className="w-full max-w-md">
              <CardHeader className="space-y-1">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl">
                    {mode === "login" && "Acessar conta"}
                    {mode === "register" && "Criar conta"}
                    {mode === "forgot-password" && "Recuperar senha"}
                    {mode === "magic-link" && "Login sem senha"}
                  </CardTitle>
                  <div className="flex h-9 items-center rounded-md border p-1">
                    <Button 
                      variant="ghost"
                      size="sm"
                      className={`${mode === "login" ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400" : ""}`}
                      onClick={() => setMode("login")}
                      disabled={isLoading}
                    >
                      Login
                    </Button>
                    <Button 
                      variant="ghost"
                      size="sm"
                      className={`${mode === "register" ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400" : ""}`}
                      onClick={() => setMode("register")}
                      disabled={isLoading}
                    >
                      Cadastro
                    </Button>
                  </div>
                </div>
                <CardDescription>
                  {mode === "login" && "Entre com sua conta para acessar o dashboard"}
                  {mode === "register" && "Crie sua conta gratuitamente e comece a usar"}
                  {mode === "forgot-password" && "Receba um link para redefinir sua senha"}
                  {mode === "magic-link" && "Receba um link de acesso direto no seu email"}
                </CardDescription>
              </CardHeader>

              <CardContent>
                {formError && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{formError}</AlertDescription>
                  </Alert>
                )}

                {formSuccess && (
                  <Alert variant="default" className="mb-4 border-green-500 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400">
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>{formSuccess}</AlertDescription>
                  </Alert>
                )}

                {/* Login Form */}
                {mode === "login" && (
                  <form onSubmit={handleLoginSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="flex items-center gap-1.5">
                        <Mail className="h-4 w-4" />
                        E-mail
                      </Label>
                      <Input 
                        id="email" 
                        type="email" 
                        placeholder="seu@email.com"
                        required 
                        value={loginData.email}
                        onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                        disabled={isLoading}
                        className="transition-all focus-visible:ring-blue-500"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password" className="flex items-center gap-1.5">
                          <Lock className="h-4 w-4" />
                          Senha
                        </Label>
                        <Button 
                          type="button" 
                          variant="link" 
                          className="h-auto p-0 text-xs"
                          onClick={() => setMode("forgot-password")}
                          disabled={isLoading}
                        >
                          Esqueceu a senha?
                        </Button>
                      </div>
                      
                      <div className="relative">
                        <Input 
                          id="password" 
                          type={showPassword ? "text" : "password"} 
                          placeholder="••••••••"
                          required 
                          value={loginData.password}
                          onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                          disabled={isLoading}
                          className="pr-10 transition-all focus-visible:ring-blue-500"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full rounded-l-none px-3 text-muted-foreground"
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={isLoading}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="remember"
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={loginData.rememberMe}
                        onChange={(e) => setLoginData({ ...loginData, rememberMe: e.target.checked })}
                        disabled={isLoading}
                      />
                      <Label htmlFor="remember" className="text-sm font-normal">
                        Lembrar de mim neste dispositivo
                      </Label>
                    </div>

                    <div className="space-y-3 mt-6">
                      <GoogleLoginButton 
                        onClick={() => handleSocialLogin("google")} 
                        isLoading={isLoading} 
                      />
                      <Button
                        variant="outline"
                        type="button"
                        onClick={() => setMode("magic-link")}
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-2"
                      >
                        <AtSign className="h-4 w-4" />
                        <span>Entrar com Magic Link</span>
                      </Button>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Autenticando...
                        </>
                      ) : (
                        <>
                          Entrar
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>

                    <div className="relative my-2">
                      <div className="absolute inset-0 flex items-center">
                        <Separator className="w-full" />
                      </div>
                      <div className="relative flex justify-center">
                        <span className="bg-white px-2 text-xs text-muted-foreground dark:bg-card">
                          Ou escolha outra opção
                        </span>
                      </div>
                    </div>
                  </form>
                )}

                {/* Magic Link Form */}
                {mode === "magic-link" && (
                  <form onSubmit={handleMagicLinkSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="magic-email" className="flex items-center gap-1.5">
                        <Mail className="h-4 w-4" />
                        E-mail
                      </Label>
                      <Input 
                        id="magic-email" 
                        type="email" 
                        placeholder="seu@email.com"
                        required 
                        value={magicLinkData.email}
                        onChange={(e) => setMagicLinkData({ ...magicLinkData, email: e.target.value })}
                        disabled={isLoading}
                        className="transition-all focus-visible:ring-blue-500"
                      />
                    </div>
                    
                    <p className="text-sm text-muted-foreground">
                      Enviaremos um link para acesso direto ao seu email. Basta clicar no link para entrar na sua conta sem precisar de senha.
                    </p>

                    <Button 
                      type="submit" 
                      className="w-full bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          Enviar link de acesso
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                    
                    <Button
                      type="button"
                      variant="link"
                      className="mx-auto block"
                      onClick={() => setMode("login")}
                      disabled={isLoading}
                    >
                      Voltar para o login
                    </Button>
                  </form>
                )}

                {/* Register Form */}
                {mode === "register" && (
                  <form onSubmit={handleRegisterSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="flex items-center gap-1.5">
                        <UserCheck className="h-4 w-4" />
                        Nome completo
                      </Label>
                      <Input 
                        id="name" 
                        type="text" 
                        placeholder="Seu nome completo"
                        required 
                        value={registerData.name}
                        onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                        disabled={isLoading}
                        className="transition-all focus-visible:ring-blue-500"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="register-email" className="flex items-center gap-1.5">
                        <Mail className="h-4 w-4" />
                        E-mail
                      </Label>
                      <Input 
                        id="register-email" 
                        type="email" 
                        placeholder="seu@email.com"
                        required 
                        value={registerData.email}
                        onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                        disabled={isLoading}
                        className="transition-all focus-visible:ring-blue-500"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="register-password" className="flex items-center gap-1.5">
                        <KeyRound className="h-4 w-4" />
                        Senha
                      </Label>
                      <div className="relative">
                        <Input 
                          id="register-password" 
                          type={showPassword ? "text" : "password"} 
                          placeholder="Mínimo 8 caracteres"
                          required 
                          value={registerData.password}
                          onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                          disabled={isLoading}
                          className="pr-10 transition-all focus-visible:ring-blue-500"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full rounded-l-none px-3 text-muted-foreground"
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={isLoading}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      {renderPasswordStrength()}
                      
                      <p className="text-xs text-muted-foreground">
                        Use pelo menos 8 caracteres com letras maiúsculas, minúsculas, números e símbolos.
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password" className="flex items-center gap-1.5">
                        <Lock className="h-4 w-4" />
                        Confirmar senha
                      </Label>
                      <Input 
                        id="confirm-password" 
                        type={showPassword ? "text" : "password"} 
                        placeholder="Confirme sua senha"
                        required 
                        value={registerData.confirmPassword}
                        onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                        disabled={isLoading}
                        className="transition-all focus-visible:ring-blue-500"
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="terms"
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={registerData.agreeTerms}
                        onChange={(e) => setRegisterData({ ...registerData, agreeTerms: e.target.checked })}
                        disabled={isLoading}
                      />
                      <Label htmlFor="terms" className="text-sm font-normal">
                        Concordo com os{" "}
                        <Link href="/terms" className="text-blue-600 hover:underline dark:text-blue-400">
                          Termos de Uso
                        </Link>{" "}
                        e{" "}
                        <Link href="/privacy" className="text-blue-600 hover:underline dark:text-blue-400">
                          Política de Privacidade
                        </Link>
                      </Label>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Criando conta...
                        </>
                      ) : (
                        <>
                          Criar conta
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </form>
                )}

                {/* Forgot Password Form */}
                {mode === "forgot-password" && (
                  <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="reset-email" className="flex items-center gap-1.5">
                        <Mail className="h-4 w-4" />
                        E-mail
                      </Label>
                      <Input 
                        id="reset-email" 
                        type="email" 
                        placeholder="Digite o email da sua conta"
                        required 
                        value={forgotPasswordData.email}
                        onChange={(e) => setForgotPasswordData({ ...forgotPasswordData, email: e.target.value })}
                        disabled={isLoading}
                        className="transition-all focus-visible:ring-blue-500"
                      />
                    </div>
                    
                    <p className="text-sm text-muted-foreground">
                      Enviaremos um link para recuperação de senha no email informado, caso esteja cadastrado no sistema.
                    </p>

                    <Button 
                      type="submit" 
                      className="w-full bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          Enviar link de recuperação
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                    
                    <Button
                      type="button"
                      variant="link"
                      className="mx-auto block"
                      onClick={() => setMode("login")}
                      disabled={isLoading}
                    >
                      Voltar para o login
                    </Button>
                  </form>
                )}
              </CardContent>

              <CardFooter className="flex flex-col space-y-4 border-t p-6 text-center">
                <div className="text-xs text-muted-foreground">
                  {mode === "login" && (
                    <>
                      Ainda não tem uma conta?{" "}
                      <button
                        onClick={() => setMode("register")}
                        className="text-blue-600 hover:underline dark:text-blue-400"
                        disabled={isLoading}
                      >
                        Cadastre-se agora
                      </button>
                    </>
                  )}
                  {mode === "register" && (
                    <>
                      Já possui uma conta?{" "}
                      <button
                        onClick={() => setMode("login")}
                        className="text-blue-600 hover:underline dark:text-blue-400"
                        disabled={isLoading}
                      >
                        Faça login
                      </button>
                    </>
                  )}
                  {mode === "magic-link" && (
                    <>
                      Prefere usar senha?{" "}
                      <button
                        onClick={() => setMode("login")}
                        className="text-blue-600 hover:underline dark:text-blue-400"
                        disabled={isLoading}
                      >
                        Voltar para login com senha
                      </button>
                    </>
                  )}
                </div>
                
                <div className="flex items-center justify-center text-xs text-muted-foreground">
                  <Lock className="mr-1 h-3 w-3" />
                  Conexão segura com criptografia SSL
                </div>
              </CardFooter>
            </Card>
          </div>
        </div>
      </main>

      <footer className="border-t bg-white py-6 text-center text-sm text-muted-foreground dark:bg-black/10">
        <div className="container mx-auto">
          <p>© 2023 Conta Rápida - Todos os direitos reservados</p>
          <div className="mt-2 flex justify-center gap-4">
            <Link href="/terms" className="hover:text-blue-600 dark:hover:text-blue-400">
              Termos de Uso
            </Link>
            <Link href="/privacy" className="hover:text-blue-600 dark:hover:text-blue-400">
              Privacidade
            </Link>
            <Link href="/support" className="hover:text-blue-600 dark:hover:text-blue-400">
              Suporte
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
} 