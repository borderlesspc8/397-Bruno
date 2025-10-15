"use client";

import { Button } from "@/app/_components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { Alert, AlertDescription } from "@/app/_components/ui/alert";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, CheckCircle, Loader2, XCircle } from "lucide-react";
import Link from "next/link";
import React from "react";

type VerificationStatus = "loading" | "success" | "error";

export default function VerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<VerificationStatus>("loading");
  const [message, setMessage] = useState<string>("Verificando seu link de acesso...");
  
  // Detecta tanto parâmetros tradicionais (token) quanto parâmetros do NextAuth (callbackUrl, error)
  const token = searchParams?.get("token");
  const callbackUrl = searchParams?.get("callbackUrl");
  const error = searchParams?.get("error");

  // Também verifica se estamos sendo redirecionados após um magic link
  const isFromEmail = searchParams?.has("email") || window.location.pathname.includes("/verify");

  useEffect(() => {
    // Verifica se temos um erro de verificação
    if (error) {
      setStatus("error");
      
      if (error === "Verification") {
        setMessage("O link de verificação é inválido ou expirou. Por favor, solicite um novo.");
      } else {
        setMessage("Ocorreu um erro durante a verificação. Por favor, tente novamente.");
      }
      return;
    }

    // Se não houver token nem indícios de redirecionamento do magic link, considere erro
    if (!token && !isFromEmail && !callbackUrl) {
      setStatus("error");
      setMessage("Link de acesso inválido. Por favor, solicite um novo link.");
      return;
    }

    // Adiciona um pequeno delay para melhorar a experiência do usuário
    const timer = setTimeout(() => {
      // Verificação concluída com sucesso
      setStatus("success");
      setMessage("Link verificado com sucesso! Você será redirecionado em instantes...");
      
      // Redireciona após 1.5 segundos para dar tempo do NextAuth processar
      setTimeout(() => {
        router.push("/dashboard/vendas");
      }, 1500);
    }, 2000);

    return () => clearTimeout(timer);
  }, [token, isFromEmail, callbackUrl, error, router]);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="container mx-auto flex items-center justify-between py-8">
        <div className="flex items-center gap-2">
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
          </ul>
        </nav>
      </header>
      
      <main className="flex-1 bg-gradient-to-b from-blue-100 to-white dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Verificação de Acesso</CardTitle>
            <CardDescription>
              Estamos verificando seu link de acesso
            </CardDescription>
          </CardHeader>
          
          <CardContent className="flex flex-col items-center justify-center p-6">
            {status === "loading" && (
              <div className="flex flex-col items-center space-y-4">
                <div className="flex items-center justify-center h-16 w-16">
                  <Loader2 className="h-10 w-10 animate-spin text-blue-600 dark:text-blue-400" />
                </div>
                <p className="text-center text-sm text-muted-foreground mt-4">
                  {message}
                </p>
              </div>
            )}
            
            {status === "success" && (
              <div className="flex flex-col items-center space-y-4">
                <div className="relative h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/20">
                  <CheckCircle className="absolute inset-0 m-auto h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <Alert className="bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900">
                  <AlertDescription>{message}</AlertDescription>
                </Alert>
                <Button 
                  onClick={() => router.push("/dashboard/vendas")}
                  className="bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
                >
                  Ir para o dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
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
          <p>© {new Date().getFullYear()} Conta Rápida - Todos os direitos reservados</p>
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
