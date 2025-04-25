"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useToast } from "@/app/_components/ui/use-toast";
import { Button } from "@/app/_components/ui/button";
import { Input } from "@/app/_components/ui/input";
import { Label } from "@/app/_components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/_components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/app/_components/ui/popover";
import { Calendar } from "@/app/_components/ui/calendar";
import { format } from "date-fns";
import { CalendarIcon, Sparkles } from "lucide-react";
import { cn } from "@/app/_lib/utils";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { Badge } from "@/app/_components/ui/badge";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/app/_components/ui/alert";

export default function NewBudgetPage() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const suggested = searchParams?.get("suggested") === "true";
  const suggestedCategory = searchParams?.get("category") || "";
  const suggestedAmount = searchParams?.get("amount") || "0";
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: suggestedCategory,
    description: suggestedCategory ? `Orçamento para ${suggestedCategory}` : "",
    amount: suggestedAmount ? parseFloat(suggestedAmount) : 0,
    period: "MONTHLY",
    startDate: new Date(),
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
    colorAccent: getColorForCategory(suggestedCategory),
    iconName: "PiggyBank",
    // Os campos abaixo serão preenchidos no back-end:
    // categoryId: null,
    // walletId: null
  });

  const handleChange = (field: string, value: any) => {
    setFormData({
      ...formData,
      [field]: value
    });
    
    // Se o campo for category/title, atualizar a cor
    if (field === "title") {
      setFormData(prev => ({
        ...prev,
        colorAccent: getColorForCategory(value)
      }));
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Enviar para o endpoint de criar orçamento a partir de sugestão
      const endpoint = suggested 
        ? "/api/budgets/new" 
        : "/api/budgets";
        
      const requestBody = suggested
        ? {
            category: formData.title,
            amount: formData.amount,
            description: formData.description,
            period: formData.period,
            colorAccent: formData.colorAccent,
            iconName: formData.iconName
          }
        : formData;
        
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Falha ao criar orçamento");
      }
      
      toast({
        title: "Orçamento criado",
        description: "Novo orçamento criado com sucesso",
      });
      
      // Redirecionar para página de orçamentos
      router.push("/budgets");
      
    } catch (error) {
      console.error("Erro ao criar orçamento:", error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o orçamento",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Novo Orçamento</h1>
        <Link href="/budgets">
          <Button variant="outline">Voltar</Button>
        </Link>
      </div>
      
      {suggested && (
        <Alert>
          <Sparkles className="h-4 w-4" />
          <AlertTitle>Orçamento sugerido com base em seus gastos</AlertTitle>
          <AlertDescription>
            Esta sugestão foi gerada analisando seus padrões de gastos. Você pode ajustar os valores antes de criar o orçamento.
          </AlertDescription>
        </Alert>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>Detalhes do Orçamento</CardTitle>
          <CardDescription>
            Defina os detalhes do seu novo orçamento
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Categoria</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleChange("title", e.target.value)}
                required
                placeholder="Ex.: Alimentação, Moradia, Transporte..."
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Descrição (opcional)</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Descreva o propósito deste orçamento"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="amount">Valor Limite</Label>
              <Input
                id="amount"
                type="number"
                min="0"
                step="0.01"
                value={formData.amount}
                onChange={(e) => handleChange("amount", parseFloat(e.target.value))}
                required
              />
              {suggested && (
                <p className="text-xs text-muted-foreground mt-1">
                  Valor sugerido com base em seus gastos anteriores.
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="period">Período</Label>
              <Select
                value={formData.period}
                onValueChange={(value) => handleChange("period", value)}
              >
                <SelectTrigger id="period">
                  <SelectValue placeholder="Selecione um período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DAILY">Diário</SelectItem>
                  <SelectItem value="WEEKLY">Semanal</SelectItem>
                  <SelectItem value="MONTHLY">Mensal</SelectItem>
                  <SelectItem value="YEARLY">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data de início</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.startDate ? (
                        format(formData.startDate, "dd/MM/yyyy")
                      ) : (
                        <span>Selecione uma data</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.startDate || undefined}
                      onSelect={(date) => handleChange("startDate", date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <Label>Data de término</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.endDate ? (
                        format(formData.endDate, "dd/MM/yyyy")
                      ) : (
                        <span>Opcional</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.endDate || undefined}
                      onSelect={(date) => handleChange("endDate", date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <Link href="/budgets">
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </Link>
            <Button type="submit" disabled={loading}>
              {loading ? "Criando..." : "Criar Orçamento"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

// Função para obter cor baseada na categoria
function getColorForCategory(category: string): string {
  const colorMap: Record<string, string> = {
    "Alimentação": "#ef4444",
    "Moradia": "#f97316",
    "Transporte": "#eab308",
    "Lazer": "#84cc16",
    "Saúde": "#10b981",
    "Educação": "#06b6d4",
    "Serviços": "#3b82f6",
    "Compras": "#8b5cf6",
    "Outros": "#94a3b8",
    "Investimentos": "#6366f1",
  };
  
  return colorMap[category] || "#94a3b8";
} 