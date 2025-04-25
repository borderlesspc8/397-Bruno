"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/app/_components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { Input } from "@/app/_components/ui/input";
import { Label } from "@/app/_components/ui/label";
import { Switch } from "@/app/_components/ui/switch";
import { useToast } from "@/app/_components/ui/use-toast";
import { AlertTriangle, Check, Loader2, RefreshCw } from "lucide-react";
import { Separator } from "@/app/_components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/app/_components/ui/alert";

interface ChatStatus {
  chatDisabled: boolean;
  lastUpdated?: string;
}

export default function ChatAdminPage() {
  const [chatStatus, setChatStatus] = useState<ChatStatus>({ chatDisabled: false });
  const [isLoading, setIsLoading] = useState(false);
  const [adminKey, setAdminKey] = useState("");
  const [disableDuration, setDisableDuration] = useState(60); // minutos
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const { toast } = useToast();

  // Carregar o status atual do chat
  const fetchChatStatus = async () => {
    setIsCheckingStatus(true);
    try {
      const response = await fetch('/api/chat-status?check_db=true');
      if (response.ok) {
        const data = await response.json();
        setChatStatus({
          chatDisabled: data.chatDisabled,
          lastUpdated: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error("Erro ao verificar status do chat:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível verificar o status do chat"
      });
    } finally {
      setIsCheckingStatus(false);
    }
  };

  // Carregar status ao inicializar
  useEffect(() => {
    fetchChatStatus();
  }, []);

  // Alternar o status do chat (habilitar/desabilitar)
  const toggleChatStatus = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/chat-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey || undefined
        },
        body: JSON.stringify({
          disabled: !chatStatus.chatDisabled,
          temporaryMinutes: !chatStatus.chatDisabled ? disableDuration : undefined
        })
      });

      if (response.ok) {
        const data = await response.json();
        setChatStatus({
          chatDisabled: data.chatDisabled,
          lastUpdated: new Date().toISOString()
        });
        
        toast({
          title: "Sucesso",
          description: data.message,
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao alterar status do chat");
      }
    } catch (error) {
      console.error("Erro ao alterar status do chat:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao alterar status do chat"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return "Desconhecido";
    
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Administração do Chat</h1>
      
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Status do Chat</CardTitle>
            <CardDescription>
              Controle se o chat do assistente financeiro está habilitado ou desabilitado
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {isCheckingStatus ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mr-2" />
                <span>Verificando status...</span>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="chat-status" className="text-base">
                      Status do Chat
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {chatStatus.chatDisabled 
                        ? "O chat está desabilitado no momento" 
                        : "O chat está habilitado no momento"}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="chat-toggle" className={chatStatus.chatDisabled ? "text-destructive" : "text-primary"}>
                      {chatStatus.chatDisabled ? "Desabilitado" : "Habilitado"}
                    </Label>
                    <Switch
                      id="chat-toggle"
                      checked={!chatStatus.chatDisabled}
                      disabled={isLoading}
                    />
                  </div>
                </div>
                
                {chatStatus.lastUpdated && (
                  <p className="text-xs text-muted-foreground">
                    Última atualização: {formatDateTime(chatStatus.lastUpdated)}
                  </p>
                )}
                
                <Separator className="my-4" />
                
                {!chatStatus.chatDisabled && (
                  <div className="space-y-3">
                    <Label htmlFor="disable-duration">
                      Tempo de desativação (minutos)
                    </Label>
                    <Input
                      id="disable-duration"
                      type="number"
                      min={1}
                      max={1440}
                      value={disableDuration}
                      onChange={(e) => setDisableDuration(parseInt(e.target.value) || 60)}
                      disabled={isLoading || chatStatus.chatDisabled}
                    />
                    <p className="text-xs text-muted-foreground">
                      O chat será desabilitado por {disableDuration} minutos.
                    </p>
                  </div>
                )}
                
                <Separator className="my-4" />
                
                <div className="space-y-3">
                  <Label htmlFor="admin-key">
                    Chave de Administrador
                  </Label>
                  <Input
                    id="admin-key"
                    type="password"
                    placeholder="Digite a chave de administrador (opcional)"
                    value={adminKey}
                    onChange={(e) => setAdminKey(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Necessária apenas se você não estiver logado como administrador.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={fetchChatStatus}
              disabled={isLoading || isCheckingStatus}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar Status
            </Button>
            
            <Button 
              onClick={toggleChatStatus}
              disabled={isLoading || isCheckingStatus}
              variant={chatStatus.chatDisabled ? "default" : "destructive"}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {chatStatus.chatDisabled ? "Habilitando..." : "Desabilitando..."}
                </>
              ) : (
                <>
                  {chatStatus.chatDisabled ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Habilitar Chat
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Desabilitar Chat
                    </>
                  )}
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
        
        <Alert variant="warning">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Atenção</AlertTitle>
          <AlertDescription>
            Desabilitar o chat afetará todos os usuários do sistema. Use esta funcionalidade 
            com responsabilidade, geralmente apenas para manutenção ou em situações de emergência.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
} 