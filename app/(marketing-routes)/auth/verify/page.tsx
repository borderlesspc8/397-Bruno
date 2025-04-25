"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, CheckCircle, XCircle, ArrowRight } from "lucide-react";
import { Button } from "@/app/_components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { Alert, AlertDescription } from "@/app/_components/ui/alert";

export default function VerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState<string>("");
  
  // Obter token da URL
  const token = searchParams?.get("token");
  
  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Token de verificação inválido ou expirado.");
      return;
    }
    
    // Simula verificação do token
    const verifyToken = async () => {
      try {
        // Em um ambiente real, você faria uma chamada API para verificar o token
        // await fetch('/api/auth/verify?token=' + token);
        
        // Simula o processamento
        setTimeout(() => {
          setStatus("success");
          setMessage("Verificação concluída com sucesso! Você será redirecionado em instantes.");
          
          // Redireciona após sucesso
          setTimeout(() => {
            router.push("/dashboard");
          }, 3000);
        }, 2000);
      } catch (error) {
        setStatus("error");
        setMessage("Não foi possível verificar sua identidade. Por favor, tente novamente.");
      }
    };
    
    verifyToken();
  }, [token, router]);
  
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
                href="/auth" 
                className="text-sm text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400"
              >
                Login
              </Link>
            </li>
          </ul>
        </nav>
      </header>
      
      <main className="container mx-auto flex flex-1 items-center justify-center px-4 py-10">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Verificação de Acesso</CardTitle>
            <CardDescription>
              Estamos verificando sua identidade
            </CardDescription>
          </CardHeader>
          
          <CardContent className="flex flex-col items-center justify-center space-y-6 py-8">
            {status === "loading" && (
              <div className="flex flex-col items-center space-y-4">
                <div className="relative h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900/20">
                  <Loader2 className="absolute inset-0 m-auto h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
                </div>
                <p className="text-center text-sm text-muted-foreground">
                  Verificando sua identidade. Aguarde um momento...
                </p>
              </div>
            )}
            
            {status === "success" && (
              <div className="flex flex-col items-center space-y-4">
                <div className="relative h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/20">
                  <CheckCircle className="absolute inset-0 m-auto h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <Alert variant="default" className="border-green-500 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400">
                  <AlertDescription>{message}</AlertDescription>
                </Alert>
              </div>
            )}
            
            {status === "error" && (
              <div className="flex flex-col items-center space-y-4">
                <div className="relative h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/20">
                  <XCircle className="absolute inset-0 m-auto h-8 w-8 text-red-600 dark:text-red-400" />
                </div>
                <Alert variant="destructive">
                  <AlertDescription>{message}</AlertDescription>
                </Alert>
                <Button 
                  onClick={() => router.push("/auth?mode=magic-link")}
                  className="bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
                >
                  Tentar novamente
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
          
          <CardFooter className="flex justify-center border-t p-6">
            <p className="text-center text-xs text-muted-foreground">
              Por motivos de segurança, este link é válido por apenas 10 minutos.
            </p>
          </CardFooter>
        </Card>
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