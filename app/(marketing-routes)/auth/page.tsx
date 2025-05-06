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
import { isDemoMode, demoConfig } from '@/app/_lib/config';

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
    email: isDemoMode ? "demo@acceleracrm.com.br" : "",
    password: isDemoMode ? "123456" : "",
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

  // Fazer login automático no modo demo
  useEffect(() => {
    if (isDemoMode && searchParams?.get("autologin") === "true") {
      handleLoginSubmit(new Event('submit') as any);
    }
  }, []);

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
        setFormError("Email ou senha incorretos");
        return;
      }

      toast.success("Login realizado");
      router.push("/dashboard/vendas");
    } catch (error) {
      setFormError("Erro ao fazer login");
    } finally {
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
      
      setFormSuccess("Link enviado");
      toast.success("Link enviado");
      setMagicLinkData({ email: "" });
    } catch (error) {
      setFormError("Erro ao enviar link");
      toast.error("Erro ao enviar link");
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
      setFormError("Senhas não conferem");
      setIsLoading(false);
      return;
    }

    if (passwordStrength < 3) {
      setFormError("Senha fraca");
      setIsLoading(false);
      return;
    }

    if (!registerData.agreeTerms) {
      setFormError("Aceite os termos");
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

      setFormSuccess("Cadastro realizado");
      setTimeout(() => {
        setMode("login");
        setLoginData({
          ...loginData,
          email: registerData.email,
        });
      }, 1500);
    } catch (error: any) {
      setFormError(error.message || "Erro ao criar conta");
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
        throw new Error(data.error || "Erro ao solicitar recuperação");
      }

      setFormSuccess("Email enviado");
      toast.success("Email enviado");
      setForgotPasswordData({ email: "" });
      
      // Após 1.5 segundos, retorna para a tela de login
      setTimeout(() => {
        setMode("login");
      }, 1500);
    } catch (error: any) {
      setFormError(error.message || "Erro ao enviar email");
      toast.error("Erro ao enviar email");
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
            {strengthLabels[passwordStrength - 1]}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      {/* Imagem de fundo com overlay escuro */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0" 
        style={{ 
          backgroundImage: "url('/images/background_promo.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Overlay mais escuro conforme a referência visual */}
        <div className="absolute inset-0 "></div>
            </div>
            
      {/* Conteúdo principal centralizado */}
      <main className="container mx-auto flex flex-1 items-center justify-center relative z-10">
        {/* Card com estilo escuro e bordas suaves */}
        <div className="w-full max-w-md rounded-2xl bg-slate-900/90 border border-slate-800/50 backdrop-blur-sm shadow-2xl p-6">
          {/* Seção de título do componente */}
          <div className="mb-8">
            <h1 className="text-2xl font-medium text-white">
              {mode === "login" && "Acessar"}
              {mode === "register" && "Cadastrar"}
              {mode === "forgot-password" && "Recuperar"}
              {mode === "magic-link" && "Magic Link"}
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Entre com sua conta para acessar
            </p>
          </div>

          {/* Tabs de navegação (Login/Cadastro) */}
          <div className="flex mb-8 bg-slate-800/50 p-1 rounded-full">
            <button
                      onClick={() => setMode("login")}
              className={`flex-1 py-2 px-4 rounded-full transition-all ${
                mode === "login" 
                  ? "bg-blue-600 text-white" 
                  : "text-slate-400 hover:text-white"
              }`}
                      disabled={isLoading}
                    >
                      Login
            </button>
            <button
                      onClick={() => setMode("register")}
              className={`flex-1 py-2 px-4 rounded-full transition-all ${
                mode === "register" 
                  ? "bg-slate-900 text-white" 
                  : "text-slate-400 hover:text-white"
              }`}
                      disabled={isLoading}
                    >
                      Cadastro
            </button>
                </div>

          {/* Alertas de erro e sucesso */}
                {formError && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-200 text-sm">
              {formError}
            </div>
                )}

                {formSuccess && (
            <div className="mb-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg text-green-200 text-sm">
              {formSuccess}
            </div>
          )}

          {/* Formulário de login */}
                {mode === "login" && (
            <form onSubmit={handleLoginSubmit} className="space-y-5">
              {/* Campo de e-mail */}
                    <div className="space-y-2">
                <label htmlFor="email" className="flex items-center text-slate-400 text-sm">
                  <Mail className="h-4 w-4 mr-2" />
                        E-mail
                </label>
                <input 
                        id="email" 
                        type="email" 
                        placeholder="seu@email.com"
                        required 
                        value={loginData.email}
                        onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                        disabled={isLoading}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600/50 focus:border-transparent transition-all"
                      />
                    </div>
                    
              {/* Campo de senha */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                  <label htmlFor="password" className="flex items-center text-slate-400 text-sm">
                    <Lock className="h-4 w-4 mr-2" />
                          Senha
                  </label>
                  <button 
                          type="button" 
                    className="text-blue-400 hover:text-blue-300 text-xs"
                          onClick={() => setMode("forgot-password")}
                          disabled={isLoading}
                        >
                    Esqueceu?
                  </button>
                      </div>
                      
                      <div className="relative">
                  <input 
                          id="password" 
                          type={showPassword ? "text" : "password"} 
                          placeholder="••••••••"
                          required 
                          value={loginData.password}
                          onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                          disabled={isLoading}
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600/50 focus:border-transparent transition-all pr-10"
                        />
                  <button
                          type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={isLoading}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                  </button>
                      </div>
                    </div>

              {/* Checkbox para lembrar senha */}
              <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="remember"
                  className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500"
                        checked={loginData.rememberMe}
                        onChange={(e) => setLoginData({ ...loginData, rememberMe: e.target.checked })}
                        disabled={isLoading}
                      />
                <label htmlFor="remember" className="ml-2 text-sm text-slate-400">
                  Lembrar-me
                </label>
                    </div>

              {/* Botão Magic Link */}
              <button
                        type="button"
                        onClick={() => setMode("magic-link")}
                        disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3 border border-slate-700 rounded-lg text-slate-300 hover:bg-slate-800 transition-all"
                      >
                        <AtSign className="h-4 w-4" />
                <span>Magic Link</span>
              </button>

              {/* Botão de login */}
              <button 
                      type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-3 transition-all flex items-center justify-center"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Entrando...
                        </>
                      ) : (
                        <>
                          Entrar
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
              </button>
              
              {/* Opção de criar conta */}
              {mode === "login" && (
                <div className="text-center mt-4">
                  <button
                    type="button"
                    onClick={() => setMode("register")}
                    className="text-blue-400 hover:text-blue-300 text-sm"
                    disabled={isLoading}
                  >
                    Criar conta
                  </button>
                      </div>
              )}
                  </form>
                )}

          {/* Magic Link Form - simplificado */}
                {mode === "magic-link" && (
            <form onSubmit={handleMagicLinkSubmit} className="space-y-5">
                    <div className="space-y-2">
                <label htmlFor="magic-email" className="flex items-center text-slate-400 text-sm">
                  <Mail className="h-4 w-4 mr-2" />
                        E-mail
                </label>
                <input 
                        id="magic-email" 
                        type="email" 
                        placeholder="seu@email.com"
                        required 
                        value={magicLinkData.email}
                        onChange={(e) => setMagicLinkData({ ...magicLinkData, email: e.target.value })}
                        disabled={isLoading}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600/50 focus:border-transparent transition-all"
                      />
                    </div>
                    
              <button 
                      type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-3 transition-all flex items-center justify-center"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                    Enviar link
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
              </button>
                    
              <button
                      type="button"
                className="w-full text-center text-blue-400 hover:text-blue-300 text-sm"
                      onClick={() => setMode("login")}
                      disabled={isLoading}
                    >
                Voltar
              </button>
                  </form>
                )}

          {/* Formulário de cadastro - simplificado mas mantendo todos os campos */}
                {mode === "register" && (
            <form onSubmit={handleRegisterSubmit} className="space-y-5">
              {/* Campos de nome e email */}
                    <div className="space-y-2">
                <label htmlFor="name" className="flex items-center text-slate-400 text-sm">
                  <UserCheck className="h-4 w-4 mr-2" />
                  Nome
                </label>
                <input 
                        id="name" 
                        type="text" 
                        placeholder="Seu nome completo"
                        required 
                        value={registerData.name}
                        onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                        disabled={isLoading}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600/50 focus:border-transparent transition-all"
                      />
                    </div>
                    
                    <div className="space-y-2">
                <label htmlFor="register-email" className="flex items-center text-slate-400 text-sm">
                  <Mail className="h-4 w-4 mr-2" />
                        E-mail
                </label>
                <input 
                        id="register-email" 
                        type="email" 
                        placeholder="seu@email.com"
                        required 
                        value={registerData.email}
                        onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                        disabled={isLoading}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600/50 focus:border-transparent transition-all"
                      />
                    </div>
                    
              {/* Campos de senha e confirmação */}
                    <div className="space-y-2">
                <label htmlFor="register-password" className="flex items-center text-slate-400 text-sm">
                  <KeyRound className="h-4 w-4 mr-2" />
                        Senha
                </label>
                      <div className="relative">
                  <input 
                          id="register-password" 
                          type={showPassword ? "text" : "password"} 
                          placeholder="Mínimo 8 caracteres"
                          required 
                          value={registerData.password}
                          onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                          disabled={isLoading}
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600/50 focus:border-transparent transition-all pr-10"
                        />
                  <button
                          type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={isLoading}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                  </button>
                      </div>
                      {renderPasswordStrength()}
                    </div>
                    
                    <div className="space-y-2">
                <label htmlFor="confirm-password" className="flex items-center text-slate-400 text-sm">
                  <Lock className="h-4 w-4 mr-2" />
                  Confirmar
                </label>
                <input 
                        id="confirm-password" 
                        type={showPassword ? "text" : "password"} 
                        placeholder="Confirme sua senha"
                        required 
                        value={registerData.confirmPassword}
                        onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                        disabled={isLoading}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600/50 focus:border-transparent transition-all"
                      />
                    </div>

              {/* Termos de serviço */}
              <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="terms"
                  className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500"
                        checked={registerData.agreeTerms}
                        onChange={(e) => setRegisterData({ ...registerData, agreeTerms: e.target.checked })}
                        disabled={isLoading}
                      />
                <label htmlFor="terms" className="ml-2 text-sm text-slate-400">
                  Aceito os{" "}
                  <Link href="/terms" className="text-blue-400 hover:text-blue-300">
                    Termos
                        </Link>
                </label>
                    </div>

              {/* Botão de cadastro */}
              <button 
                      type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-3 transition-all flex items-center justify-center"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Cadastrando...
                        </>
                      ) : (
                        <>
                    Cadastrar
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
              </button>
              
              {/* Link para voltar ao login */}
              <button
                type="button"
                className="w-full text-center text-blue-400 hover:text-blue-300 text-sm"
                onClick={() => setMode("login")}
                disabled={isLoading}
              >
                Já tenho conta
              </button>
                  </form>
                )}

          {/* Formulário de recuperação de senha - simplificado */}
                {mode === "forgot-password" && (
            <form onSubmit={handleForgotPasswordSubmit} className="space-y-5">
                    <div className="space-y-2">
                <label htmlFor="reset-email" className="flex items-center text-slate-400 text-sm">
                  <Mail className="h-4 w-4 mr-2" />
                        E-mail
                </label>
                <input 
                        id="reset-email" 
                        type="email" 
                        placeholder="Digite o email da sua conta"
                        required 
                        value={forgotPasswordData.email}
                        onChange={(e) => setForgotPasswordData({ ...forgotPasswordData, email: e.target.value })}
                        disabled={isLoading}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600/50 focus:border-transparent transition-all"
                      />
                    </div>
                    
              <button 
                      type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-3 transition-all flex items-center justify-center"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                    Recuperar
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
              </button>
                    
              <button
                      type="button"
                className="w-full text-center text-blue-400 hover:text-blue-300 text-sm"
                      onClick={() => setMode("login")}
                      disabled={isLoading}
                    >
                Voltar
              </button>
                  </form>
                )}
          
          {/* Rodapé com Copyright */}
          <div className="mt-8 text-center">
            <p className="text-slate-500 text-xs">© {new Date().getFullYear()} Personal Prime</p>
          </div>
        </div>
      </main>
    </div>
  );
} 