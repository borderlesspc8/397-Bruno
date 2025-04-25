"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { Button } from "@/app/_components/ui/button";
import { Badge } from "@/app/_components/ui/badge";
import { AlertCircle, BrainCircuit, CreditCard, LineChart, DollarSign, ReceiptText, ArrowDown, ArrowUp, Clock, AlertTriangle, BarChart4 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/_components/ui/tabs";
import { useToast } from "@/app/_components/ui/use-toast";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/app/_components/ui/accordion";
import { Separator } from "@/app/_components/ui/separator";
import { formatCurrency } from "@/app/_lib/utils";
import { ScrollArea } from "@/app/_components/ui/scroll-area";

interface PatternInsightsProps {
  month: string;
  timeframe?: string;
}

interface RecurringExpense {
  description: string;
  frequency: string;
  averageAmount: number;
  confidence: string;
}

interface UnusualTransaction {
  id: string;
  reason: string;
  suggestion?: string;
}

interface CategoryTrend {
  category: string;
  trend: "aumento" | "diminuição" | "estável";
  changePercentage: number;
  insight: string;
}

interface PossibleDuplicate {
  id1: string;
  id2: string;
  confidence: string;
  reason: string;
}

interface SavingsOpportunity {
  category: string;
  suggestion: string;
  estimatedSavings: number;
}

interface Patterns {
  recurringExpenses?: RecurringExpense[];
  unusualTransactions?: UnusualTransaction[];
  categoryTrends?: CategoryTrend[];
  possibleDuplicates?: PossibleDuplicate[];
  savingsOpportunities?: SavingsOpportunity[];
}

export function PatternInsights({ month, timeframe }: PatternInsightsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [patterns, setPatterns] = useState<Patterns>({});
  const { toast } = useToast();
  
  useEffect(() => {
    if (month) {
      fetchPatterns();
    }
  }, [month]);
  
  const fetchPatterns = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/ai/patterns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          month, 
          timeframe 
        }),
      });
      
      if (!response.ok) {
        throw new Error('Falha ao detectar padrões');
      }
      
      const data = await response.json();
      setPatterns(data.patterns || {});
      
    } catch (error) {
      console.error('Erro ao detectar padrões:', error);
      toast({
        title: "Erro ao detectar padrões",
        description: "Não foi possível analisar seus dados financeiros. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Verificar se há algum padrão detectado
  const hasPatterns = 
    (patterns.recurringExpenses && patterns.recurringExpenses.length > 0) ||
    (patterns.unusualTransactions && patterns.unusualTransactions.length > 0) ||
    (patterns.categoryTrends && patterns.categoryTrends.length > 0) ||
    (patterns.possibleDuplicates && patterns.possibleDuplicates.length > 0) ||
    (patterns.savingsOpportunities && patterns.savingsOpportunities.length > 0);
  
  // Renderizar badge para confiança
  const renderConfidenceBadge = (confidence: string) => {
    switch (confidence.toLowerCase()) {
      case 'alta':
        return <Badge variant="default" className="bg-emerald-500">Alta</Badge>;
      case 'média':
        return <Badge variant="default" className="bg-amber-500">Média</Badge>;
      case 'baixa':
        return <Badge variant="default" className="bg-red-500">Baixa</Badge>;
      default:
        return null;
    }
  };
  
  // Renderizar ícone para tendência
  const renderTrendIcon = (trend: string) => {
    switch (trend.toLowerCase()) {
      case 'aumento':
        return <ArrowUp className="h-4 w-4 text-red-500" />;
      case 'diminuição':
        return <ArrowDown className="h-4 w-4 text-emerald-500" />;
      default:
        return null;
    }
  };
  
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BrainCircuit className="h-5 w-5 text-primary" />
          Padrões e Insights
        </CardTitle>
        <CardDescription>
          Análise inteligente dos seus padrões financeiros
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
              <div className="h-4 bg-muted rounded w-5/6"></div>
              <div className="h-4 bg-muted rounded w-2/3"></div>
            </div>
          </div>
        ) : hasPatterns ? (
          <Tabs defaultValue="recurring">
            <TabsList className="grid grid-cols-3 md:grid-cols-5 mb-4">
              <TabsTrigger value="recurring">Recorrentes</TabsTrigger>
              <TabsTrigger value="unusual">Incomuns</TabsTrigger>
              <TabsTrigger value="trends">Tendências</TabsTrigger>
              <TabsTrigger value="duplicates">Duplicatas</TabsTrigger>
              <TabsTrigger value="savings">Economia</TabsTrigger>
            </TabsList>
            
            <TabsContent value="recurring">
              <ScrollArea className="h-[400px] pr-4">
                {patterns.recurringExpenses && patterns.recurringExpenses.length > 0 ? (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Detectamos os seguintes gastos recorrentes em suas finanças:
                    </p>
                    
                    <Accordion type="single" collapsible className="w-full">
                      {patterns.recurringExpenses.map((expense, index) => (
                        <AccordionItem key={index} value={`expense-${index}`}>
                          <AccordionTrigger className="text-left">
                            <div className="flex items-center justify-between w-full pr-4">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span>{expense.description}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">{expense.frequency}</Badge>
                                <span className="font-bold">{formatCurrency(expense.averageAmount)}</span>
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="pl-6 border-l text-sm space-y-2">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Frequência:</span>
                                <span>{expense.frequency}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Valor médio:</span>
                                <span>{formatCurrency(expense.averageAmount)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Confiança:</span>
                                <span>{renderConfidenceBadge(expense.confidence)}</span>
                              </div>
                              <Separator className="my-2" />
                              <p className="text-muted-foreground text-xs">
                                Este parece ser um compromisso {expense.frequency.toLowerCase()}. 
                                Considere incluí-lo em seu orçamento regular.
                              </p>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8">
                    <AlertCircle className="h-8 w-8 text-muted-foreground/60 mb-2" />
                    <p className="text-muted-foreground text-center">
                      Nenhum gasto recorrente identificado
                    </p>
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="unusual">
              <ScrollArea className="h-[400px] pr-4">
                {patterns.unusualTransactions && patterns.unusualTransactions.length > 0 ? (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Identificamos transações incomuns que podem merecer sua atenção:
                    </p>
                    
                    <div className="space-y-3">
                      {patterns.unusualTransactions.map((transaction, index) => (
                        <Card key={index} className="bg-muted/40">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
                              <div className="space-y-2 flex-1">
                                <div className="font-medium">{transaction.reason}</div>
                                {transaction.suggestion && (
                                  <p className="text-sm text-muted-foreground">
                                    {transaction.suggestion}
                                  </p>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8">
                    <AlertCircle className="h-8 w-8 text-muted-foreground/60 mb-2" />
                    <p className="text-muted-foreground text-center">
                      Nenhuma transação incomum identificada
                    </p>
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="trends">
              <ScrollArea className="h-[400px] pr-4">
                {patterns.categoryTrends && patterns.categoryTrends.length > 0 ? (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Tendências identificadas em suas categorias de gastos:
                    </p>
                    
                    <div className="space-y-3">
                      {patterns.categoryTrends.map((trend, index) => (
                        <Card key={index} className="overflow-hidden">
                          <CardContent className="p-0">
                            <div className="flex items-stretch">
                              <div className={`w-2 ${
                                trend.trend === 'aumento' 
                                  ? 'bg-red-500' 
                                  : trend.trend === 'diminuição' 
                                  ? 'bg-emerald-500' 
                                  : 'bg-blue-500'
                              }`}></div>
                              <div className="p-4 flex-1">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="font-medium">{trend.category}</h4>
                                  <div className="flex items-center gap-2">
                                    {renderTrendIcon(trend.trend)}
                                    <span className={`text-sm font-medium ${
                                      trend.trend === 'aumento' 
                                        ? 'text-red-500' 
                                        : trend.trend === 'diminuição' 
                                        ? 'text-emerald-500' 
                                        : ''
                                    }`}>
                                      {trend.changePercentage}%
                                    </span>
                                  </div>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {trend.insight}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8">
                    <BarChart4 className="h-8 w-8 text-muted-foreground/60 mb-2" />
                    <p className="text-muted-foreground text-center">
                      Sem dados suficientes para identificar tendências
                    </p>
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="duplicates">
              <ScrollArea className="h-[400px] pr-4">
                {patterns.possibleDuplicates && patterns.possibleDuplicates.length > 0 ? (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Possíveis transações duplicadas encontradas:
                    </p>
                    
                    <div className="space-y-3">
                      {patterns.possibleDuplicates.map((duplicate, index) => (
                        <Card key={index} className="bg-muted/40">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-2">
                              <ReceiptText className="h-5 w-5 text-amber-500 mt-0.5" />
                              <div className="flex-1">
                                <div className="flex justify-between items-center mb-1">
                                  <span className="font-medium">Possível duplicata</span>
                                  {renderConfidenceBadge(duplicate.confidence)}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {duplicate.reason}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8">
                    <ReceiptText className="h-8 w-8 text-muted-foreground/60 mb-2" />
                    <p className="text-muted-foreground text-center">
                      Nenhuma transação duplicada detectada
                    </p>
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="savings">
              <ScrollArea className="h-[400px] pr-4">
                {patterns.savingsOpportunities && patterns.savingsOpportunities.length > 0 ? (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Oportunidades para economizar identificadas:
                    </p>
                    
                    <div className="space-y-3">
                      {patterns.savingsOpportunities.map((opportunity, index) => (
                        <Card key={index} className="bg-muted/40">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-2">
                              <DollarSign className="h-5 w-5 text-emerald-500 mt-0.5" />
                              <div className="flex-1">
                                <div className="flex justify-between items-center mb-1">
                                  <span className="font-medium">{opportunity.category}</span>
                                  <span className="text-emerald-600 font-semibold">
                                    Economia estimada: {formatCurrency(opportunity.estimatedSavings)}
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {opportunity.suggestion}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8">
                    <DollarSign className="h-8 w-8 text-muted-foreground/60 mb-2" />
                    <p className="text-muted-foreground text-center">
                      Nenhuma oportunidade de economia identificada
                    </p>
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <LineChart className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground text-center">
              Sem dados suficientes para análise de padrões
            </p>
            <p className="text-sm text-muted-foreground text-center mt-1">
              Adicione mais transações para obter insights valiosos
            </p>
            <Button variant="outline" className="mt-4" onClick={fetchPatterns}>
              Tentar analisar novamente
            </Button>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between pt-2 text-xs text-muted-foreground">
        <span>Dados do período: {timeframe || `Mês ${month}/2023`}</span>
        <span className="italic">Powered by Groq AI</span>
      </CardFooter>
    </Card>
  );
} 