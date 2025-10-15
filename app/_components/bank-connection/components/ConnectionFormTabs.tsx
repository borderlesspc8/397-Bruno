"use client";

import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "../../ui/tabs";
import { Label } from "../../ui/label";
import { Input } from "../../ui/input";
import { ConnectionFormTabsProps } from "../types";

export const ConnectionFormTabs = ({
  credentials,
  handleInputChange,
  allCredentials1Filled,
  allCredentials2Filled,
  allAccountFieldsFilled,
  activeTab,
  setActiveTab
}: ConnectionFormTabsProps) => {
  return (
    <Tabs
      value={activeTab}
      onValueChange={setActiveTab}
      className="w-full"
    >
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="credentials1" className="text-xs">
          Identificação
          {allCredentials1Filled && <span className="ml-1 text-green-600">✓</span>}
        </TabsTrigger>
        <TabsTrigger value="credentials2" className="text-xs">
          Autenticação
          {allCredentials2Filled && <span className="ml-1 text-green-600">✓</span>}
        </TabsTrigger>
        <TabsTrigger value="account" className="text-xs">
          Dados da Conta
          {allAccountFieldsFilled && <span className="ml-1 text-green-600">✓</span>}
        </TabsTrigger>
      </TabsList>

      {/* Tab 1: Identificação */}
      <TabsContent value="credentials1" className="py-4">
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="clientId">Client ID</Label>
              <Input
                id="clientId"
                value={credentials.clientId}
                onChange={(e) => handleInputChange("clientId", e.target.value)}
                placeholder="Informe o Client ID fornecido pelo Banco do Brasil"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientSecret">Client Secret</Label>
              <Input
                id="clientSecret"
                type="password"
                value={credentials.clientSecret}
                onChange={(e) => handleInputChange("clientSecret", e.target.value)}
                placeholder="Informe o Client Secret fornecido pelo Banco do Brasil"
              />
            </div>
          </div>
        </div>
      </TabsContent>

      {/* Tab 2: Autenticação */}
      <TabsContent value="credentials2" className="py-4">
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="clientBasic">Client Basic</Label>
              <Input
                id="clientBasic"
                value={credentials.clientBasic}
                onChange={(e) => handleInputChange("clientBasic", e.target.value)}
                placeholder="Informe o Client Basic (para autenticação)"
              />
              <p className="text-xs text-muted-foreground">
                Código gerado a partir do Client ID e Client Secret (Base64)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="applicationKey">Application Key</Label>
              <Input
                id="applicationKey"
                value={credentials.applicationKey}
                onChange={(e) => handleInputChange("applicationKey", e.target.value)}
                placeholder="Informe a chave de aplicação"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="apiUrl">URL da API</Label>
              <Input
                id="apiUrl"
                value={credentials.apiUrl}
                onChange={(e) => handleInputChange("apiUrl", e.target.value)}
                placeholder="https://api.bb.com.br/pix/v1"
              />
            </div>
          </div>
        </div>
      </TabsContent>

      {/* Tab 3: Dados da Conta */}
      <TabsContent value="account" className="py-4">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="agencia">Agência</Label>
              <Input
                id="agencia"
                value={credentials.agencia}
                onChange={(e) => handleInputChange("agencia", e.target.value)}
                placeholder="Número da agência (sem dígito)"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="conta">Conta</Label>
              <Input
                id="conta"
                value={credentials.conta}
                onChange={(e) => handleInputChange("conta", e.target.value)}
                placeholder="Número da conta (sem dígito)"
              />
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}; 
