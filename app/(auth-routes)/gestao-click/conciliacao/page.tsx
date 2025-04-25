"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { Button } from "@/app/_components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/_components/ui/tabs";
import { Badge } from "@/app/_components/ui/badge";
import { ArrowLeftRight, Check, AlertCircle, Clock, Search } from "lucide-react";
import { Input } from "@/app/_components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/_components/ui/select";

export default function GestaoClickConciliacaoPage() {
  const [activeTab, setActiveTab] = useState("pendentes");
  const [searchTerm, setSearchTerm] = useState("");
  const [walletFilter, setWalletFilter] = useState("all");
  
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Conciliação de Transações</h1>
        <p className="text-muted-foreground">
          Associe transações do Gestão Click às carteiras do Conta Rápida
        </p>
      </div>
      
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center">
            <ArrowLeftRight className="h-5 w-5 mr-2 text-primary" />
            Transações para Conciliação
          </CardTitle>
          <CardDescription>
            Visualize e gerencie a correspondência entre vendas do Gestão Click e transações no sistema
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="pendentes" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="pendentes" className="flex gap-2">
                <AlertCircle className="h-4 w-4" />
                Pendentes
                <Badge variant="secondary" className="ml-2">23</Badge>
              </TabsTrigger>
              <TabsTrigger value="processando" className="flex gap-2">
                <Clock className="h-4 w-4" />
                Em Processamento
                <Badge variant="secondary" className="ml-2">5</Badge>
              </TabsTrigger>
              <TabsTrigger value="conciliadas" className="flex gap-2">
                <Check className="h-4 w-4" />
                Conciliadas
                <Badge variant="secondary" className="ml-2">47</Badge>
              </TabsTrigger>
            </TabsList>
            
            <div className="flex flex-wrap gap-4 mb-4">
              <div className="flex-1 min-w-[200px]">
                <Input
                  placeholder="Buscar por código, cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              
              <div className="w-[200px]">
                <Select value={walletFilter} onValueChange={setWalletFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as carteiras" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as carteiras</SelectItem>
                    <SelectItem value="1">Caixa</SelectItem>
                    <SelectItem value="2">Banco do Brasil</SelectItem>
                    <SelectItem value="3">Cartão de Crédito</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button variant="outline" className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Buscar
              </Button>
            </div>
            
            <TabsContent value="pendentes">
              <div className="border rounded-md p-8 text-center">
                <p className="text-muted-foreground">
                  Este módulo está em desenvolvimento. Em breve você poderá conciliar as vendas do Gestão Click
                  com as transações do sistema.
                </p>
                <div className="mt-4">
                  <Button variant="outline" onClick={() => window.history.back()}>
                    Voltar
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="processando">
              <div className="border rounded-md p-8 text-center">
                <p className="text-muted-foreground">
                  Este módulo está em desenvolvimento. Em breve você poderá conciliar as vendas do Gestão Click
                  com as transações do sistema.
                </p>
                <div className="mt-4">
                  <Button variant="outline" onClick={() => window.history.back()}>
                    Voltar
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="conciliadas">
              <div className="border rounded-md p-8 text-center">
                <p className="text-muted-foreground">
                  Este módulo está em desenvolvimento. Em breve você poderá conciliar as vendas do Gestão Click
                  com as transações do sistema.
                </p>
                <div className="mt-4">
                  <Button variant="outline" onClick={() => window.history.back()}>
                    Voltar
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Como funciona a conciliação</CardTitle>
          <CardDescription>
            Entenda como as transações são conciliadas entre os sistemas
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="border rounded-lg p-4">
              <h3 className="font-medium text-lg mb-2">1. Importação</h3>
              <p className="text-sm text-muted-foreground">
                As vendas e pagamentos são importados do Gestão Click e ficam
                pendentes de conciliação com as transações do sistema.
              </p>
            </div>
            
            <div className="border rounded-lg p-4">
              <h3 className="font-medium text-lg mb-2">2. Associação</h3>
              <p className="text-sm text-muted-foreground">
                Você associa cada transação a uma carteira específica (conta bancária,
                cartão, dinheiro) ou cria uma nova transação a partir da venda.
              </p>
            </div>
            
            <div className="border rounded-lg p-4">
              <h3 className="font-medium text-lg mb-2">3. Sincronização</h3>
              <p className="text-sm text-muted-foreground">
                Após a conciliação, as transações ficam sincronizadas entre
                os sistemas. Alterações em um refletem automaticamente no outro.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 