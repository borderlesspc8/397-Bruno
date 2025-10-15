"use client";

import { Button } from "@/app/_components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/app/_components/ui/card";
import { Alert, AlertDescription } from "@/app/_components/ui/alert";
import { useRouter } from "next/navigation";
import { Mail, ArrowRight, CheckCircle } from "lucide-react";
import Link from "next/link";
import React from "react";

export default function VerifyRequestPage() {
  const router = useRouter();

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
            <CardTitle className="text-2xl">Verifique seu Email</CardTitle>
            <CardDescription>
              Um link de acesso foi enviado para seu email
            </CardDescription>
          </CardHeader>
          
          <CardContent className="flex flex-col items-center justify-center p-6">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900/20">
                <Mail className="absolute inset-0 m-auto h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              
              <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900">
                <CheckCircle className="h-4 w-4 mr-2 text-blue-600" />
                <AlertDescription>
                  Enviamos um link de acesso para seu email. Verifique sua caixa de entrada e sua pasta de spam.
                </AlertDescription>
              </Alert>
              
              <p className="text-center text-sm text-muted-foreground mt-2">
                Clique no link recebido por email para acessar sua conta. Este link é válido por 10 minutos.
              </p>
              
              <Button 
                onClick={() => router.push("/auth")}
                className="bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 mt-4"
              >
                Voltar para a página de login
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-center border-t p-6">
            <p className="text-center text-xs text-muted-foreground">
              Se você não receber o email em alguns minutos, verifique sua pasta de spam ou tente novamente.
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
