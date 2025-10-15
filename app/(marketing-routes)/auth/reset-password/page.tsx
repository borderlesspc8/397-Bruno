"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { ArrowRight, Loader2, Lock, Eye, EyeOff, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function ResetPassword() {
  const searchParams = useSearchParams();
  const token = searchParams?.get("token");
  const router = useRouter();

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  
  // Verificar validade do token ao carregar a página
  useEffect(() => {
    if (!token) {
      setTokenValid(false);
      return;
    }
    
    // Verificação simulada da validade do token
    setTokenValid(true);
  }, [token]);

  // Validar força da senha
  useEffect(() => {
    if (!formData.password) {
      setPasswordStrength(0);
      return;
    }

    let strength = 0;
    // Pelo menos 8 caracteres
    if (formData.password.length >= 8) strength++;
    // Contém letras minúsculas
    if (/[a-z]/.test(formData.password)) strength++;
    // Contém letras maiúsculas
    if (/[A-Z]/.test(formData.password)) strength++;
    // Contém números
    if (/[0-9]/.test(formData.password)) strength++;
    // Contém caracteres especiais
    if (/[^a-zA-Z0-9]/.test(formData.password)) strength++;

    setPasswordStrength(strength);
  }, [formData.password]);

  // Se não tiver token, redireciona para a página de autenticação
  if (tokenValid === false) {
    toast.error("Link de redefinição inválido ou expirado");
    router.push("/auth?mode=forgot-password");
    return null;
  }

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
                level <= passwordStrength ? strengthColors[passwordStrength - 1] : "bg-slate-700"
              }`}
            />
          ))}
        </div>
        {passwordStrength > 0 && (
          <p className="text-xs text-slate-400">
            Força: {strengthLabels[passwordStrength - 1]}
          </p>
        )}
      </div>
    );
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }
    
    if (passwordStrength < 3) {
      toast.warning("Por favor, escolha uma senha mais forte");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          password: formData.password,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erro ao redefinir senha");
      }

      toast.success("Senha redefinida com sucesso!");
      
      // Redireciona após 1.5 segundos para a tela de login
      setTimeout(() => {
        router.push("/auth");
      }, 1500);
    } catch (error: any) {
      toast.error(error.message || "Erro ao redefinir senha. Tente novamente ou solicite um novo link.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      {/* Imagem de fundo com overlay escuro */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0" 
        style={{ 
          backgroundImage: "url('/images/fitness-background.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Overlay mais escuro conforme a referência visual */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/95 via-slate-900/98 to-slate-900/95"></div>
      </div>

      {/* Conteúdo principal centralizado */}
      <main className="container mx-auto flex flex-1 items-center justify-center relative z-10">
        {/* Card com estilo escuro e bordas suaves */}
        <div className="w-full max-w-md rounded-2xl bg-slate-900/90 border border-slate-800/50 backdrop-blur-sm shadow-2xl p-6">
          {/* Seção de título do componente */}
          <div className="mb-8">
            <h1 className="text-2xl font-medium text-white">Redefinir Senha</h1>
            <p className="text-slate-400 text-sm mt-1">
              Crie uma nova senha segura para sua conta
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="password" className="flex items-center text-slate-400 text-sm">
                <Lock className="h-4 w-4 mr-2" />
                Nova Senha
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Digite sua nova senha"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  disabled={isLoading}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600/50 focus:border-transparent transition-all pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {renderPasswordStrength()}
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="flex items-center text-slate-400 text-sm">
                <Lock className="h-4 w-4 mr-2" />
                Confirme a Nova Senha
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showPassword ? "text" : "password"}
                required
                placeholder="Digite novamente sua nova senha"
                value={formData.confirmPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                disabled={isLoading}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600/50 focus:border-transparent transition-all"
              />
            </div>
            
            {passwordStrength > 0 && passwordStrength < 3 && (
              <div className="p-3 bg-orange-500/20 border border-orange-500/30 rounded-lg text-orange-200 text-sm flex items-start">
                <AlertTriangle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                <span>
                  Sua senha é muito fraca. Para maior segurança, use letras maiúsculas, minúsculas, números e símbolos.
                </span>
              </div>
            )}

            <button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-3 transition-all flex items-center justify-center"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Redefinindo...
                </>
              ) : (
                <>
                  Redefinir Senha
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </button>
            
            <button 
              type="button"
              className="w-full border border-slate-700 text-slate-300 hover:bg-slate-800 rounded-lg py-3 transition-all mt-2"
              onClick={() => router.push("/auth")}
              disabled={isLoading}
            >
              Voltar para o login
            </button>
          </form>
          
          {/* Informação de segurança */}
          <div className="mt-6 flex items-center justify-center text-xs text-slate-500">
            <Lock className="mr-1 h-3 w-3" />
            Conexão segura com criptografia SSL
          </div>
          
          {/* Rodapé com Copyright */}
          <div className="mt-8 text-center">
            <p className="text-slate-500 text-xs">© {new Date().getFullYear()} Conta Rápida</p>
          </div>
        </div>
      </main>
    </div>
  );
} 
