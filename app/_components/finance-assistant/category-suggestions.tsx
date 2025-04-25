"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { Button } from "@/app/_components/ui/button";
import { Badge } from "@/app/_components/ui/badge";
import { Loader2, CheckIcon, RefreshCw, AlertTriangle, AlertCircle, BotIcon } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/_components/ui/table";
import { useToast } from "@/app/_components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/_components/ui/tabs";
import { Progress } from "@/app/_components/ui/progress";
import { formatCurrency } from "@/app/_lib/utils";

interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  category?: string;
}

interface CategorySuggestion {
  id: string;
  suggestedCategory: string;
  confidence: "alta" | "média" | "baixa";
  reason: string;
}

interface CategorySuggestionsProps {
  transactions: Transaction[];
  onApplySuggestions: (categorizedTransactions: Transaction[]) => void;
  onCancel?: () => void;
}

export function CategorySuggestions({ 
  transactions, 
  onApplySuggestions,
  onCancel
}: CategorySuggestionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<CategorySuggestion[]>([]);
  const [selectedTab, setSelectedTab] = useState<string>("todas");
  const { toast } = useToast();
  
  // Solicitar sugestões de categorias ao carregar o componente
  useEffect(() => {
    if (transactions.length > 0) {
      getSuggestions();
    }
  }, [transactions]);
  
  // Função para obter sugestões de categorias da API
  const getSuggestions = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/ai/categorize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transactions }),
      });
      
      if (!response.ok) {
        throw new Error('Falha ao obter sugestões de categorias');
      }
      
      const data = await response.json();
      setSuggestions(data.suggestions || []);
      
    } catch (error) {
      console.error('Erro ao obter sugestões:', error);
      toast({
        title: "Erro ao obter sugestões",
        description: "Não foi possível obter sugestões de categorias. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Aplicar todas as sugestões com confiança alta
  const applyAllHighConfidence = () => {
    const highConfidenceSuggestions = suggestions.filter(s => s.confidence === "alta");
    
    if (highConfidenceSuggestions.length === 0) {
      toast({
        title: "Nenhuma sugestão com alta confiança",
        description: "Não há sugestões com alta confiança para aplicar automaticamente.",
      });
      return;
    }
    
    const updatedTransactions = [...transactions];
    
    highConfidenceSuggestions.forEach(suggestion => {
      const transactionIndex = updatedTransactions.findIndex(t => t.id === suggestion.id);
      if (transactionIndex !== -1) {
        updatedTransactions[transactionIndex] = {
          ...updatedTransactions[transactionIndex],
          category: suggestion.suggestedCategory
        };
      }
    });
    
    onApplySuggestions(updatedTransactions);
    
    toast({
      title: "Sugestões aplicadas",
      description: `${highConfidenceSuggestions.length} categorias de alta confiança foram aplicadas.`,
    });
  };
  
  // Aplicar uma sugestão específica
  const applySuggestion = (transactionId: string, suggestedCategory: string) => {
    const updatedTransactions = transactions.map(transaction => 
      transaction.id === transactionId 
        ? { ...transaction, category: suggestedCategory }
        : transaction
    );
    
    onApplySuggestions(updatedTransactions);
    
    toast({
      title: "Categoria aplicada",
      description: "A categoria sugerida foi aplicada à transação.",
    });
  };
  
  // Filtrar sugestões com base na aba selecionada
  const filteredSuggestions = suggestions.filter(suggestion => {
    if (selectedTab === 'todas') return true;
    return suggestion.confidence === selectedTab;
  });
  
  // Calcular estatísticas
  const statsHighConfidence = suggestions.filter(s => s.confidence === "alta").length;
  const statsMediumConfidence = suggestions.filter(s => s.confidence === "média").length;
  const statsLowConfidence = suggestions.filter(s => s.confidence === "baixa").length;
  const totalSuggestions = suggestions.length;
  const highConfidencePercentage = totalSuggestions > 0 
    ? Math.round((statsHighConfidence / totalSuggestions) * 100) 
    : 0;
  
  // Renderizar indicador de confiança
  const renderConfidenceBadge = (confidence: string) => {
    switch (confidence) {
      case 'alta':
        return <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600">Alta confiança</Badge>;
      case 'média':
        return <Badge variant="default" className="bg-amber-500 hover:bg-amber-600">Média confiança</Badge>;
      case 'baixa':
        return <Badge variant="default" className="bg-red-500 hover:bg-red-600">Baixa confiança</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card className="w-full shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BotIcon className="h-5 w-5 text-primary" />
              Sugestões de Categorização
            </CardTitle>
            <CardDescription>
              Categorize suas transações com a ajuda de inteligência artificial
            </CardDescription>
          </div>
          
          {!isLoading && (
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={getSuggestions}
                className="flex items-center gap-1"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Atualizar</span>
              </Button>
              
              <Button 
                variant="default" 
                size="sm" 
                onClick={applyAllHighConfidence}
                disabled={suggestions.filter(s => s.confidence === "alta").length === 0}
                className="flex items-center gap-1"
              >
                <CheckIcon className="h-3.5 w-3.5" />
                <span>Aplicar Alta Confiança</span>
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground text-sm">
              Analisando transações e gerando sugestões...
            </p>
          </div>
        ) : suggestions.length > 0 ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <Card className="bg-muted/40">
                <CardContent className="p-4">
                  <div className="text-xs text-muted-foreground mb-1">Confiança alta</div>
                  <div className="text-2xl font-bold">{statsHighConfidence}</div>
                  <Progress value={highConfidencePercentage} className="h-1.5 mt-2" />
                </CardContent>
              </Card>
              
              <Card className="bg-muted/40">
                <CardContent className="p-4">
                  <div className="text-xs text-muted-foreground mb-1">Confiança média</div>
                  <div className="text-2xl font-bold">{statsMediumConfidence}</div>
                </CardContent>
              </Card>
              
              <Card className="bg-muted/40">
                <CardContent className="p-4">
                  <div className="text-xs text-muted-foreground mb-1">Confiança baixa</div>
                  <div className="text-2xl font-bold">{statsLowConfidence}</div>
                </CardContent>
              </Card>
            </div>
            
            <Tabs value={selectedTab} onValueChange={setSelectedTab}>
              <TabsList className="grid grid-cols-4 mb-4">
                <TabsTrigger value="todas">Todas ({suggestions.length})</TabsTrigger>
                <TabsTrigger value="alta">Alta ({statsHighConfidence})</TabsTrigger>
                <TabsTrigger value="média">Média ({statsMediumConfidence})</TabsTrigger>
                <TabsTrigger value="baixa">Baixa ({statsLowConfidence})</TabsTrigger>
              </TabsList>
              
              <TabsContent value={selectedTab} className="mt-0">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Categoria Sugerida</TableHead>
                        <TableHead>Confiança</TableHead>
                        <TableHead className="text-right">Ação</TableHead>
                      </TableRow>
                    </TableHeader>
                    
                    <TableBody>
                      {filteredSuggestions.length > 0 ? (
                        filteredSuggestions.map(suggestion => {
                          const transaction = transactions.find(t => t.id === suggestion.id);
                          if (!transaction) return null;
                          
                          return (
                            <TableRow key={suggestion.id}>
                              <TableCell className="font-medium">{transaction.description}</TableCell>
                              <TableCell>{formatCurrency(transaction.amount)}</TableCell>
                              <TableCell>{suggestion.suggestedCategory}</TableCell>
                              <TableCell>
                                {renderConfidenceBadge(suggestion.confidence)}
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                  {suggestion.reason}
                                </p>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => applySuggestion(
                                    suggestion.id, 
                                    suggestion.suggestedCategory
                                  )}
                                >
                                  Aplicar
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="h-24 text-center">
                            <div className="flex flex-col items-center justify-center">
                              <AlertCircle className="h-8 w-8 text-muted-foreground/60 mb-2" />
                              <p className="text-muted-foreground">
                                Nenhuma sugestão encontrada com este filtro
                              </p>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="h-8 w-8 text-muted-foreground/60 mb-4" />
            <p className="text-muted-foreground text-center">
              Nenhuma sugestão de categoria disponível
            </p>
            <p className="text-sm text-muted-foreground text-center mt-1">
              Tente atualizar ou adicionar mais transações
            </p>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between border-t pt-4">
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <div className="flex-1"></div>
        <div className="text-xs text-muted-foreground mr-2 italic pt-2">
          Powered by Groq AI
        </div>
      </CardFooter>
    </Card>
  );
} 