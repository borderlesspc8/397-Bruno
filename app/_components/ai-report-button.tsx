"use client";

import { Button } from "./ui/button";
import { Sparkles } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";

interface AiReportButtonProps {
  startDate: string;
  endDate: string;
}

export default function AiReportButton({ startDate, endDate }: AiReportButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const generateReport = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulação de chamada de API - será substituída pela chamada real
      // const response = await fetch('/api/ai-report', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ startDate, endDate })
      // });
      
      // Simulando um tempo de processamento
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // if (!response.ok) throw new Error('Falha ao gerar relatório');
      // const data = await response.json();
      
      // Dados de exemplo para simular a resposta da API
      const data = {
        report: `
          # Análise Financeira (${startDate} a ${endDate})
          
          ## Resumo
          Seus gastos totais foram de R$ 3.450,00 no período analisado, com receitas de R$ 5.200,00, resultando em um saldo positivo de R$ 1.750,00.
          
          ## Padrões Identificados
          - 🔍 Seus maiores gastos foram em Alimentação (32%) e Transporte (18%)
          - 📈 Suas despesas com Assinaturas aumentaram 15% em relação ao mês anterior
          - 💰 Você economizou 33% da sua renda no período
          
          ## Recomendações
          1. Considere revisar seus gastos com delivery, que representam 45% das despesas com alimentação
          2. Você tem 3 assinaturas que não utilizou nos últimos 2 meses
          3. Seu padrão de gastos durante os finais de semana é 2.3x maior que nos dias úteis
          
          ## Oportunidades
          Com base na sua economia mensal atual, você poderia investir R$ 1.200,00 mensalmente em renda fixa, o que resultaria em aproximadamente R$ 14.400,00 + juros ao final de 12 meses.
        `
      };
      
      setReport(data.report);
    } catch (err) {
      console.error("Erro ao gerar relatório:", err);
      setError("Não foi possível gerar o relatório. Tente novamente mais tarde.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          variant="default"
          size="sm" 
          className="gap-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600"
        >
          <Sparkles className="h-4 w-4" />
          <span>Análise IA</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Análise Financeira com IA</DialogTitle>
          <DialogDescription>
            Obtenha insights personalizados sobre suas finanças com base em seus dados.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {!report && !isLoading && !error && (
            <div className="space-y-4">
              <p>
                Nossa inteligência artificial analisará suas transações no período 
                de <span className="font-medium">{startDate}</span> a <span className="font-medium">{endDate}</span> 
                e gerará um relatório personalizado.
              </p>
              <p>Este relatório incluirá:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Resumo de receitas e despesas</li>
                <li>Padrões identificados no seu comportamento financeiro</li>
                <li>Recomendações personalizadas</li>
                <li>Oportunidades de economia e investimento</li>
              </ul>
              <Button onClick={generateReport} className="w-full gap-2">
                <Sparkles className="h-4 w-4" />
                Gerar Relatório
              </Button>
            </div>
          )}
          
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
              <p className="mt-4 text-sm text-muted-foreground">Gerando análise financeira...</p>
            </div>
          )}
          
          {error && (
            <div className="rounded-lg bg-destructive/10 p-4 text-destructive">
              <p>{error}</p>
              <Button variant="outline" onClick={generateReport} className="mt-4 w-full">
                Tentar Novamente
              </Button>
            </div>
          )}
          
          {report && !isLoading && (
            <div className="rounded-lg bg-muted p-4">
              <pre className="whitespace-pre-wrap text-sm">{report}</pre>
              <div className="mt-4 flex justify-end">
                <Button variant="outline" size="sm" onClick={() => setReport(null)}>
                  Voltar
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 