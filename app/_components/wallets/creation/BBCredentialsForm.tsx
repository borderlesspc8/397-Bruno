"use client";

import { useState } from "react";
import { Button } from "@/app/_components/ui/button";
import { Input } from "@/app/_components/ui/input";
import { Label } from "@/app/_components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/app/_components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/_components/ui/tabs";
import { AlertCircle, Check, HelpCircle } from "lucide-react";
import { CertificateFile, CertificateUploader, allCertificatesValid } from "./CertificateUploader";

export interface BBCredentials {
  applicationKey: string;
  clientBasic: string;
  clientId: string;
  clientSecret: string;
  apiUrl: string;
  agencia: string;
  conta: string;
}

interface BBCredentialsFormProps {
  bbCredentials: BBCredentials;
  onCredentialsChange: (credentials: BBCredentials) => void;
  certificates: CertificateFile[];
  onCertificatesChange: (certificates: CertificateFile[]) => void;
  isSubmitting: boolean;
  errorMessage: string | null;
  onTestConnection: () => void;
  isTestingConnection: boolean;
  testConnectionResult: { success: boolean; message: string } | null;
  onSubmit: (e: React.FormEvent) => void;
  isEditMode?: boolean;
}

export function BBCredentialsForm({
  bbCredentials,
  onCredentialsChange,
  certificates,
  onCertificatesChange,
  isSubmitting,
  errorMessage,
  onTestConnection,
  isTestingConnection,
  testConnectionResult,
  onSubmit,
  isEditMode = false
}: BBCredentialsFormProps) {
  const [activeTab, setActiveTab] = useState("credentials1");

  // Funções auxiliares de validação
  const allCredentials1Filled = (): boolean => {
    return (
      !!bbCredentials.applicationKey &&
      !!bbCredentials.clientBasic
    );
  };

  const allCredentials2Filled = (): boolean => {
    return (
      !!bbCredentials.clientId &&
      !!bbCredentials.clientSecret
    );
  };

  const allAccountFieldsFilled = (): boolean => {
    return !!bbCredentials.agencia && !!bbCredentials.conta;
  };

  const handleCredentialChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    onCredentialsChange({
      ...bbCredentials,
      [name]: value
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Tabs defaultValue="credentials1" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="credentials1">Credenciais API 1</TabsTrigger>
          <TabsTrigger value="credentials2">Credenciais API 2</TabsTrigger>
          <TabsTrigger value="certificates">Certificados</TabsTrigger>
        </TabsList>
        
        <TabsContent value="credentials1" className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="applicationKey">Chave de Aplicação (Application Key)</Label>
            <Input
              id="applicationKey"
              name="applicationKey"
              value={bbCredentials.applicationKey}
              onChange={handleCredentialChange}
              placeholder="ex: d49e7a9f4093b2f68121a2e100000000"
              autoComplete="off"
            />
            <p className="text-xs text-muted-foreground">
              Chave de aplicação fornecida pelo Banco do Brasil
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="clientBasic">Basic Authentication (Base64)</Label>
            <Input
              id="clientBasic"
              name="clientBasic"
              value={bbCredentials.clientBasic}
              onChange={handleCredentialChange}
              placeholder="ex: ZjJkNzE5YzUtZmZmZi00NWNiLWE4MmYtMDAwMDAwMDAwMDAwOjAwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAwMA=="
              autoComplete="off"
            />
            <p className="text-xs text-muted-foreground">
              Credencial Base64 no formato "clientId:clientSecret"
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="apiUrl">URL da API (opcional)</Label>
            <Input
              id="apiUrl"
              name="apiUrl"
              value={bbCredentials.apiUrl}
              onChange={handleCredentialChange}
              placeholder="https://api.bb.com.br/pix/v1"
              autoComplete="off"
            />
            <p className="text-xs text-muted-foreground">
              URL base da API (deixe em branco para usar o padrão)
            </p>
          </div>
          
          <Button
            type="button"
            onClick={() => setActiveTab("credentials2")}
            disabled={!allCredentials1Filled()}
            className="w-full mt-4"
          >
            Próximo
          </Button>
        </TabsContent>
        
        <TabsContent value="credentials2" className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="clientId">Client ID</Label>
            <Input
              id="clientId"
              name="clientId"
              value={bbCredentials.clientId}
              onChange={handleCredentialChange}
              placeholder="ex: f2d719c5-ffff-45cb-a82f-000000000000"
              autoComplete="off"
            />
            <p className="text-xs text-muted-foreground">
              ID do cliente fornecido pelo Banco do Brasil
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="clientSecret">Client Secret</Label>
            <Input
              id="clientSecret"
              name="clientSecret"
              value={bbCredentials.clientSecret}
              onChange={handleCredentialChange}
              placeholder="ex: 00000000-0000-0000-0000-000000000000"
              autoComplete="off"
              type="password"
            />
            <p className="text-xs text-muted-foreground">
              Senha do cliente fornecida pelo Banco do Brasil
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="agencia">Agência</Label>
              <Input
                id="agencia"
                name="agencia"
                value={bbCredentials.agencia}
                onChange={handleCredentialChange}
                placeholder="ex: 1234"
                autoComplete="off"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="conta">Conta</Label>
              <Input
                id="conta"
                name="conta"
                value={bbCredentials.conta}
                onChange={handleCredentialChange}
                placeholder="ex: 12345"
                autoComplete="off"
              />
            </div>
          </div>
          
          <div className="flex space-x-2 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setActiveTab("credentials1")}
              className="flex-1"
            >
              Voltar
            </Button>
            
            <Button
              type="button"
              onClick={() => setActiveTab("certificates")}
              disabled={!allCredentials2Filled() || !allAccountFieldsFilled()}
              className="flex-1"
            >
              Próximo
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="certificates" className="space-y-4 py-4">
          <div className="text-sm text-muted-foreground mb-4">
            <p>
              Faça upload dos certificados necessários para comunicação com a API do Banco do Brasil. Estes certificados são necessários para autenticação mútua TLS.
            </p>
          </div>
          
          <CertificateUploader 
            certificates={certificates}
            onCertificatesChange={onCertificatesChange}
          />
          
          {/* Área de teste de conexão */}
          <div className="mt-6 border-t pt-4 border-gray-200">
            <div className="flex flex-col space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-sm font-medium text-gray-700">Testar Conexão</h4>
                  <p className="text-xs text-gray-500">
                    Verifique se as credenciais e certificados estão funcionando corretamente
                  </p>
                </div>
                
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onTestConnection}
                  disabled={isTestingConnection || !allCertificatesValid(certificates) || !allCredentials1Filled() || !allCredentials2Filled() || !allAccountFieldsFilled()}
                  className={`flex items-center ${isTestingConnection ? 'opacity-70' : ''}`}
                >
                  {isTestingConnection ? (
                    <>
                      <div className="h-3 w-3 rounded-full border-2 border-t-transparent border-blue-600 animate-spin mr-2" />
                      Testando...
                    </>
                  ) : (
                    <>
                      <HelpCircle className="h-4 w-4 mr-2" />
                      Testar Conexão
                    </>
                  )}
                </Button>
              </div>
              
              {testConnectionResult && (
                <Alert className={`${testConnectionResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  {testConnectionResult.success ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
                  <AlertTitle className={testConnectionResult.success ? 'text-green-800' : 'text-red-800'}>
                    {testConnectionResult.success ? 'Conexão bem-sucedida' : 'Falha na conexão'}
                  </AlertTitle>
                  <AlertDescription className={testConnectionResult.success ? 'text-green-700' : 'text-red-700'}>
                    {testConnectionResult.message}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
          
          <div className="flex space-x-2 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setActiveTab("credentials2")}
              className="flex-1"
            >
              Voltar
            </Button>
            
            <Button
              type="submit"
              className="flex-1"
              disabled={
                isSubmitting || 
                !allCredentials1Filled() || 
                !allCredentials2Filled() || 
                !allAccountFieldsFilled() || 
                !allCertificatesValid(certificates)
              }
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 rounded-full border-2 border-t-transparent border-white animate-spin mr-2" />
                  {isEditMode ? 'Atualizando...' : 'Criando...'}
                </>
              ) : (
                isEditMode ? 'Atualizar Integração' : 'Criar Integração'
              )}
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {errorMessage && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}
    </form>
  );
} 