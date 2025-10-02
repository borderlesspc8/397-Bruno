"use client";

import { useState } from "react";
import { Button } from "@/app/_components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/app/_components/ui/dialog";
interface AiReportButtonProps {
  month?: string;
  year?: string;
}

export default function AiReportButton({ month, year }: AiReportButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState("");
  const [error, setError] = useState("");
  
  const isPremium = true; // Todos os usuários têm acesso
  
  const generateReport = async () => {
    setError("");
    setReport("");
    setLoading(true);
    
    try {
      const response = await fetch(`/api/ai/financial-report?month=${month || new Date().getMonth() + 1}&year=${year || new Date().getFullYear()}`);
      
      if (!response.ok) {
        throw new Error("Não foi possível gerar o relatório");
      }
      
      const data = await response.json();
      setReport(data.report);
    } catch (err: any) {
      console.error("Erro ao gerar relatório:", err);
      setError(err.message || "Ocorreu um erro ao gerar o relatório. Tente novamente mais tarde.");
    } finally {
      setLoading(false);
    }
  };
  
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    
    if (newOpen && isPremium && !report && !loading) {
      // Gerar automaticamente quando abrir o modal (apenas para usuários premium)
      generateReport();
    }
  };
  
  return (
    <>
      <Button 
        variant="outline" 
        size="sm"
        className="border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:hover:bg-amber-950/60 dark:text-amber-400"
        onClick={() => handleOpenChange(true)}
      >
        <Sparkles className="h-3.5 w-3.5 mr-2" />
        Relatório IA
      </Button>
      
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Sparkles className="h-5 w-5 mr-2 text-amber-500" />
              Relatório Financeiro Inteligente
            </DialogTitle>
            <DialogDescription>
              Análise automatizada dos seus dados financeiros para o período selecionado.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            {!isPremium ? (
              <div className="p-4 rounded-lg border bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-300">
                <h3 className="text-sm font-medium">Recurso Premium</h3>
                <p className="text-sm mt-1">
                  Este recurso está disponível apenas para assinantes Premium. 
                  Faça upgrade da sua conta para acessar relatórios de IA e mais recursos avançados.
                </p>
                <Button className="mt-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700">
                  Fazer Upgrade
                </Button>
              </div>
            ) : loading ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-amber-500 mb-2" />
                <p className="text-sm text-muted-foreground">Gerando relatório inteligente...</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Isso pode levar alguns segundos enquanto analisamos seus dados.
                </p>
              </div>
            ) : error ? (
              <div className="p-4 rounded-lg border bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300">
                <h3 className="text-sm font-medium">Erro ao gerar relatório</h3>
                <p className="text-sm mt-1">{error}</p>
                <Button 
                  variant="outline" 
                  onClick={generateReport} 
                  className="mt-3 border-red-300 dark:border-red-700"
                >
                  Tentar novamente
                </Button>
              </div>
            ) : report ? (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <div dangerouslySetInnerHTML={{ __html: report.replace(/\n/g, '<br />') }} />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8">
                <Button onClick={generateReport}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Gerar Relatório
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
} 