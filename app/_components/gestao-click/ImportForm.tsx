"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/app/_components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { Input } from "@/app/_components/ui/input";
import { Label } from "@/app/_components/ui/label";
import { Checkbox } from "@/app/_components/ui/checkbox";
import { useToast } from "@/app/_components/ui/use-toast";
import { AlertCircle, CheckCircle, RefreshCw, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/app/_components/ui/alert";
import { formatDateForDisplay } from "@/app/_utils/date-formatter";
import { Calendar } from "@/app/_components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/app/_components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/app/_components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/_components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/app/_components/ui/radio-group";

interface ImportFormProps {
  walletId: string;
}

export function GestaoClickImportForm({ walletId }: ImportFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  
  // Estado do formulário
  const [startDate, setStartDate] = useState<Date>(new Date(new Date().setDate(1))); // Primeiro dia do mês atual
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [accessToken, setAccessToken] = useState<string>("");
  const [secretToken, setSecretToken] = useState<string>("");
  const [apiUrl, setApiUrl] = useState<string>("");
  const [includeCategories, setIncludeCategories] = useState<boolean>(true);
  
  // Estado de carregamento
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [importResult, setImportResult] = useState<any>(null);
  
  // Estado para filtros avançados
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);
  const [liquidadoFilter, setLiquidadoFilter] = useState<'ab' | 'at' | 'pg' | undefined>(undefined);
  const [contaBancariaId, setContaBancariaId] = useState<string>("");
  const [valorMinimo, setValorMinimo] = useState<string>("");
  const [valorMaximo, setValorMaximo] = useState<string>("");
  const [limitResults, setLimitResults] = useState<string>("500");
  const [maxTransactions, setMaxTransactions] = useState<string>("100000");
  
  // Estado para dados da API
  const [contas, setContas] = useState<any[]>([]);

  // Carregar configurações salvas
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true);
        setLoadingMessage("Carregando configurações salvas...");
        
        const response = await fetch(`/api/gestao-click/import?walletId=${walletId}`);
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.success && data.settings) {
            // Carregar configurações salvas
            setAccessToken(data.settings.apiKey || "");
            setSecretToken(data.settings.secretToken || "");
            setApiUrl(data.settings.apiUrl || "");
            
            // Se houver uma sincronização anterior, definir a data de início como um dia após a última sincronização
            if (data.settings.lastSync) {
              const lastSyncDate = new Date(data.settings.lastSync);
              const nextDay = new Date(lastSyncDate);
              nextDay.setDate(nextDay.getDate() + 1);
              setStartDate(nextDay);
            }
          }
        }
      } catch (error) {
        console.error("Erro ao carregar configurações:", error);
      } finally {
        setIsLoading(false);
        setLoadingMessage("");
      }
    };
    
    if (walletId) {
      loadSettings();
    }
  }, [walletId]);
  
  // Função para carregar contas bancárias
  const loadBankAccounts = async () => {
    if (!accessToken) return;
    
    try {
      setIsLoading(true);
      
      // Criar URL com os parâmetros de consulta
      const url = new URL("/api/gestao-click/test-connection", window.location.origin);
      url.searchParams.append("apiKey", accessToken);
      if (secretToken) url.searchParams.append("secretToken", secretToken);
      if (apiUrl) url.searchParams.append("apiUrl", apiUrl);
      
      // Usar o endpoint já existente para contas bancárias
      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.diagnostics?.bankAccounts?.items) {
          setContas(data.diagnostics.bankAccounts.items);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar contas bancárias:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Adicione esse useEffect após o existente
  useEffect(() => {
    if (accessToken && showAdvancedFilters) {
      loadBankAccounts();
    }
  }, [accessToken, showAdvancedFilters]);
  
  // Função para importar transações
  const handleImport = async () => {
    try {
      setIsLoading(true);
      setLoadingMessage("Conectando ao Gestão Click...");
      setError(null);
      setSuccess(false);
      setImportResult(null);
      
      // Verificar campos obrigatórios
      if (!accessToken) {
        throw new Error("O token de acesso é obrigatório");
      }
      
      if (!startDate || !endDate) {
        throw new Error("As datas de início e fim são obrigatórias");
      }
      
      // Formatar datas para ISO string
      const formattedStartDate = startDate.toISOString().split('T')[0];
      const formattedEndDate = endDate.toISOString().split('T')[0];
      
      // Preparar filtros avançados
      const apiFilters = showAdvancedFilters ? {
        liquidado: liquidadoFilter,
        conta_bancaria_id: contaBancariaId ? parseInt(contaBancariaId) : undefined,
        valor_inicio: valorMinimo ? parseFloat(valorMinimo) : undefined,
        valor_fim: valorMaximo ? parseFloat(valorMaximo) : undefined,
        limit: limitResults ? parseInt(limitResults) : 500,
        maxTransactions: maxTransactions ? parseInt(maxTransactions) : 10000
      } : undefined;
      
      // Preparar dados para envio
      const importData = {
        walletId,
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        accessToken,
        secretToken: secretToken || undefined,
        apiUrl: apiUrl || undefined,
        includeCategories,
        apiFilters
      };
      
      setLoadingMessage("Importando transações...");
      
      // Enviar solicitação para a API
      const response = await fetch("/api/gestao-click/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(importData),
      });
      
      // Verificar resposta
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro desconhecido na importação");
      }
      
      const result = await response.json();
      
      // Mostrar resultado com sucesso
      setSuccess(true);
      setImportResult(result);
      
      // Exibir toast de sucesso
      toast({
        title: "Importação concluída com sucesso",
        description: `${result.totalImported || '0'} transações importadas`,
      });
      
      // Atualizar a interface
      router.refresh();
      
    } catch (error: any) {
      console.error("Erro na importação:", error);
      setError(error.message || "Erro desconhecido durante a importação");
      
      // Exibir toast de erro
      toast({
        variant: "destructive",
        title: "Erro na importação",
        description: error.message || "Ocorreu um erro durante a importação",
      });
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
    }
  };

  // Componente DatePicker customizado
  const DatePickerWithPresets = ({ date, setDate, label, disabled }: { date: Date, setDate: (date: Date) => void, label: string, disabled?: boolean }) => {
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start text-left font-normal"
              disabled={disabled}
            >
              <span>{format(date, "P", { locale: ptBR })}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(newDate) => newDate && setDate(newDate)}
              initialFocus
              locale={ptBR}
            />
          </PopoverContent>
        </Popover>
      </div>
    );
  };
  
  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>Importar do Gestão Click</CardTitle>
        <CardDescription>
          Importe suas transações financeiras diretamente do Gestão Click para manter seus dados sincronizados.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && importResult && (
          <Alert className="mb-4 border-green-600 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">Importação concluída</AlertTitle>
            <AlertDescription className="text-green-700">
              <p>Foram importadas <strong>{importResult.totalImported}</strong> transações no total.</p>
              
              {importResult.details && (
                <>
                  <p>Período: {formatDateForDisplay(importResult.details.periodo?.inicio)} a {formatDateForDisplay(importResult.details.periodo?.fim)}</p>
                  
                  <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                    <div className="p-2 bg-green-100 rounded">
                      <p className="font-semibold">Receitas</p>
                      <p>{importResult.details.receitas || 0} transações</p>
                    </div>
                    <div className="p-2 bg-red-100 rounded">
                      <p className="font-semibold">Despesas</p>
                      <p>{importResult.details.despesas || 0} transações</p>
                    </div>
                  </div>
                  
                  {importResult.details.ignoradas > 0 && (
                    <p className="mt-2 text-amber-700 bg-amber-50 p-2 rounded">
                      {importResult.details.ignoradas} transações ignoradas (já existentes)
                    </p>
                  )}
                </>
              )}
              
              <p className="mt-2 text-xs">
                Os dados foram importados com sucesso e estão disponíveis na sua carteira.
              </p>
            </AlertDescription>
          </Alert>
        )}
        
        <div className="rounded-lg border p-6">
          <form className="space-y-6">
            <div>
              <h4 className="text-lg font-medium">Configurações do Gestão Click</h4>
              <p className="text-sm text-muted-foreground mt-1 mb-4">
                Configure os parâmetros de conexão com a API e importe suas transações
              </p>
              
              <Alert className="mb-4 bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800">Integração atualizada</AlertTitle>
                <AlertDescription className="text-green-700">
                  Esta integração agora utiliza os endpoints de pagamentos e recebimentos do Gestão Click 
                  para importar suas transações reais.
                </AlertDescription>
              </Alert>
              
              <div className="grid gap-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <DatePickerWithPresets
                    date={startDate}
                    setDate={setStartDate}
                    label="Data inicial"
                    disabled={isLoading}
                  />
                  
                  <DatePickerWithPresets
                    date={endDate}
                    setDate={setEndDate}
                    label="Data final"
                    disabled={isLoading}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="accessToken">Token de Acesso (API Key)</Label>
                  <Input
                    id="accessToken"
                    value={accessToken}
                    onChange={(e) => setAccessToken(e.target.value)}
                    placeholder="Digite seu token de acesso do Gestão Click"
                    disabled={isLoading}
                  />
                  <p className="text-sm text-muted-foreground">
                    Token fornecido pelo sistema Gestão Click (parâmetro access-token)
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="secretToken">Token Secreto (opcional)</Label>
                  <Input
                    id="secretToken"
                    value={secretToken}
                    onChange={(e) => setSecretToken(e.target.value)}
                    placeholder="Digite o token secreto, se necessário"
                    disabled={isLoading}
                  />
                  <p className="text-sm text-muted-foreground">
                    Token secreto para autenticação adicional (parâmetro secret-access-token)
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="apiUrl">URL da API (opcional)</Label>
                  <Input
                    id="apiUrl"
                    value={apiUrl}
                    onChange={(e) => setApiUrl(e.target.value)}
                    placeholder="https://api.beteltecnologia.com"
                    disabled={isLoading}
                  />
                  <p className="text-sm text-muted-foreground">
                    Deixe em branco para usar a URL padrão
                  </p>
                </div>
                
                <Accordion type="single" collapsible className="mt-6 mb-4">
                  <AccordionItem value="advanced-filters">
                    <AccordionTrigger
                      onClick={() => setShowAdvancedFilters(prev => !prev)}
                      className="text-sm font-medium"
                    >
                      Filtros Avançados
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 pt-2">
                        {/* Status de liquidação */}
                        <div className="space-y-2">
                          <Label>Status de Liquidação</Label>
                          <RadioGroup value={liquidadoFilter || ""} onValueChange={(value) => setLiquidadoFilter(value === "" ? undefined : value as 'ab' | 'at' | 'pg')}>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="" id="r-all" />
                              <Label htmlFor="r-all" className="font-normal">Todos</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="ab" id="r-ab" />
                              <Label htmlFor="r-ab" className="font-normal">Em Aberto</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="at" id="r-at" />
                              <Label htmlFor="r-at" className="font-normal">Em Atraso</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="pg" id="r-pg" />
                              <Label htmlFor="r-pg" className="font-normal">Pago/Confirmado</Label>
                            </div>
                          </RadioGroup>
                          <p className="text-xs text-muted-foreground">
                            Filtre transações por status de liquidação
                          </p>
                        </div>
                        
                        {/* Conta Bancária */}
                        {contas.length > 0 && (
                          <div className="space-y-2">
                            <Label htmlFor="contaBancaria">Conta Bancária</Label>
                            <Select
                              value={contaBancariaId}
                              onValueChange={setContaBancariaId}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione uma conta bancária" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">Todas as contas</SelectItem>
                                {contas.map((conta) => (
                                  <SelectItem key={conta.id} value={conta.id.toString()}>
                                    {conta.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                        
                        {/* Valor Mínimo e Máximo */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="valorMinimo">Valor Mínimo (R$)</Label>
                            <Input
                              id="valorMinimo"
                              type="number"
                              value={valorMinimo}
                              onChange={(e) => setValorMinimo(e.target.value)}
                              placeholder="0.00"
                              disabled={isLoading}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="valorMaximo">Valor Máximo (R$)</Label>
                            <Input
                              id="valorMaximo"
                              type="number"
                              value={valorMaximo}
                              onChange={(e) => setValorMaximo(e.target.value)}
                              placeholder="0.00"
                              disabled={isLoading}
                            />
                          </div>
                        </div>
                        
                        {/* Limite de Resultados */}
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="limitResults">Limite por Página</Label>
                              <Input
                                id="limitResults"
                                type="number"
                                min="20"
                                max="1000"
                                placeholder="100"
                                value={limitResults}
                                onChange={(e) => setLimitResults(e.target.value)}
                              />
                              <p className="text-xs text-muted-foreground mt-1">Resultados por página</p>
                            </div>
                            <div>
                              <Label htmlFor="maxTransactions">Máximo Total</Label>
                              <Input
                                id="maxTransactions"
                                type="number"
                                min="100"
                                max="50000"
                                placeholder="10000"
                                value={maxTransactions}
                                onChange={(e) => setMaxTransactions(e.target.value)}
                              />
                              <p className="text-xs text-muted-foreground mt-1">Máximo de transações</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
                
                <div className="space-y-2 pt-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeCategories"
                      checked={includeCategories}
                      onCheckedChange={(checked) => setIncludeCategories(!!checked)}
                      disabled={isLoading}
                    />
                    <Label
                      htmlFor="includeCategories"
                      className="font-normal text-sm cursor-pointer"
                    >
                      Importar categorias também
                    </Label>
                  </div>
                  <p className="text-xs text-muted-foreground ml-6">
                    Categorias serão mapeadas automaticamente
                  </p>
                </div>
              </div>
            </div>
          </form>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => router.push('/dashboard')}
          disabled={isLoading}
        >
          Cancelar
        </Button>
        
        <Button
          onClick={handleImport}
          disabled={isLoading || !accessToken.trim()}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {loadingMessage || "Importando..."}
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Importar Transações
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
} 
