"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/app/_components/ui/dialog";
import { Button } from "@/app/_components/ui/button";
import { AlertCircle, Check, Pencil, RefreshCw } from "lucide-react";
import { Label } from "@/app/_components/ui/label";
import { Input } from "@/app/_components/ui/input";
import { toast } from "sonner";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/app/_components/ui/tabs";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/app/_components/ui/alert";

interface EditConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  connectionId: string;
  walletId?: string;
  initialData?: {
    applicationKey: string;
    clientBasic?: string;
    clientId: string;
    clientSecret: string;
    apiUrl: string;
    agencia: string;
    conta: string;
  };
}

export default function EditConnectionModal({ 
  isOpen, 
  onClose, 
  connectionId,
  walletId,
  initialData 
}: EditConnectionModalProps) {
  console.log("EditConnectionModal renderizado com isOpen:", isOpen);
  console.log("connectionId:", connectionId);
  console.log("initialData:", initialData);

  const [activeTab, setActiveTab] = useState("credentials1");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  
  const [credentials, setCredentials] = useState({
    applicationKey: "",
    clientBasic: "",
    clientId: "",
    clientSecret: "",
    apiUrl: "",
    agencia: "",
    conta: "",
  });

  // Sincronizar o estado interno com a prop isOpen
  useEffect(() => {
    console.log("Prop isOpen mudou para:", isOpen);
    setShowModal(isOpen);
  }, [isOpen]);

  // Debug para verificar quando o modal abre/fecha
  useEffect(() => {
    console.log("EditConnectionModal - isOpen:", isOpen);
    console.log("EditConnectionModal - showModal:", showModal);
    console.log("EditConnectionModal - connectionId:", connectionId);
    console.log("EditConnectionModal - initialData:", {
      ...initialData,
      clientBasic: initialData?.clientBasic 
        ? `${initialData.clientBasic.substring(0, 10)}...` 
        : "ausente",
      clientSecret: initialData?.clientSecret 
        ? "******" 
        : "ausente"
    });
  }, [isOpen, showModal, connectionId, initialData]);

  // Carregar dados iniciais quando o componente montar ou props mudarem
  useEffect(() => {
    if (initialData) {
      console.log("Carregando dados iniciais para o formulário:", initialData);
      setCredentials({
        ...credentials,
        applicationKey: initialData.applicationKey || "",
        clientBasic: initialData.clientBasic || "",
        clientId: initialData.clientId || "",
        clientSecret: initialData.clientSecret || "",
        apiUrl: initialData.apiUrl || "https://api.bb.com.br/pix/v1",
        agencia: initialData.agencia || "",
        conta: initialData.conta || "",
      });
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // Verificar se todos os campos obrigatórios foram preenchidos
      if (!allFieldsFilled()) {
        throw new Error("Por favor, preencha todos os campos obrigatórios");
      }

      // Verificar se temos um ID de carteira para a atualização
      if (!walletId) {
        throw new Error("ID da carteira não encontrado. Não é possível atualizar as credenciais.");
      }

      // Enviar requisição para atualizar a carteira e a conexão de forma unificada
      const response = await fetch(`/api/wallets/${walletId}/update-credentials`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          applicationKey: credentials.applicationKey,
          clientBasic: credentials.clientBasic,
          clientId: credentials.clientId,
          clientSecret: credentials.clientSecret,
          apiUrl: credentials.apiUrl || "https://api.bb.com.br/pix/v1",
          agencia: credentials.agencia,
          conta: credentials.conta
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || "Falha ao atualizar as credenciais");
      }

      toast.success("Credenciais atualizadas com sucesso!");
      onClose();
      
      // Recarregar a página para atualizar os dados
      window.location.reload();
    } catch (error) {
      console.error("[EDIT_CONNECTION_ERROR]", error);
      const errorMsg = error instanceof Error ? error.message : "Falha ao atualizar conexão bancária";
      setErrorMessage(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const testConnection = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // Verificar se todos os campos obrigatórios foram preenchidos
      if (!allFieldsFilled()) {
        throw new Error("Por favor, preencha todos os campos obrigatórios");
      }

      // Fazer requisição para testar a conexão usando walletId se disponível, ou connectionId como fallback
      const response = await fetch(`/api/wallets/${walletId || connectionId}/test-connection`, {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(data.message || "Conexão testada com sucesso!");
      } else {
        throw new Error(data.error || "Falha ao testar conexão");
      }
    } catch (error) {
      console.error("[TEST_CONNECTION_ERROR]", error);
      const errorMsg = error instanceof Error ? error.message : "Falha ao testar conexão";
      setErrorMessage(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const allCredentials1Filled = () => {
    return credentials.clientId !== "" && credentials.clientSecret !== "";
  };

  const allCredentials2Filled = () => {
    return credentials.applicationKey !== "" && credentials.clientBasic !== "";
  };

  const allAccountFieldsFilled = () => {
    return credentials.agencia !== "" && credentials.conta !== "";
  };

  const allFieldsFilled = () => {
    return allCredentials1Filled() && allCredentials2Filled() && allAccountFieldsFilled();
  };

  return (
    <Dialog open={showModal} onOpenChange={(open) => {
      console.log("Dialog onOpenChange:", open);
      if (!open) {
        console.log("Fechando o modal via Dialog");
        setShowModal(false);
        onClose();
      }
    }}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Conexão Bancária</DialogTitle>
          <DialogDescription>
            Atualize suas credenciais do Banco do Brasil
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          {errorMessage && (
            <Alert className="mb-4 bg-red-50 border-red-200">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertTitle className="text-red-800">Erro na Atualização</AlertTitle>
              <AlertDescription className="text-red-700">
                {errorMessage}
              </AlertDescription>
            </Alert>
          )}
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="credentials1" className="flex items-center justify-center">
                <span className="mr-2">1. Identificação</span>
                {allCredentials1Filled() && <Check className="h-4 w-4 text-green-600" />}
              </TabsTrigger>
              <TabsTrigger value="credentials2" className="flex items-center justify-center">
                <span className="mr-2">2. Autenticação</span>
                {allCredentials2Filled() && <Check className="h-4 w-4 text-green-600" />}
              </TabsTrigger>
              <TabsTrigger value="account" className="flex items-center justify-center">
                <span className="mr-2">3. Agência/Conta</span>
                {allAccountFieldsFilled() && <Check className="h-4 w-4 text-green-600" />}
              </TabsTrigger>
            </TabsList>
            
            {/* Tab 1: Client ID e Client Secret */}
            <TabsContent value="credentials1" className="mt-4">
              <Alert className="bg-blue-50 border-blue-200">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertTitle className="text-blue-800">Credenciais de Identificação</AlertTitle>
                <AlertDescription className="text-blue-700">
                  Informe o Client ID e Client Secret fornecidos pelo Banco do Brasil.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="clientId">Client ID</Label>
                  <Input 
                    id="clientId" 
                    placeholder="BB_CLIENT_ID"
                    value={credentials.clientId}
                    onChange={(e) => {
                      setCredentials({...credentials, clientId: e.target.value});
                      setErrorMessage(null);
                    }}
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="clientSecret">Client Secret</Label>
                  <Input 
                    id="clientSecret" 
                    type="password"
                    placeholder="BB_CLIENT_SECRET"
                    value={credentials.clientSecret}
                    onChange={(e) => {
                      setCredentials({...credentials, clientSecret: e.target.value});
                      setErrorMessage(null);
                    }}
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button
                    onClick={() => setActiveTab("credentials2")}
                    disabled={!allCredentials1Filled() || isSubmitting}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Próximo
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            {/* Tab 2: Application Key e Client Basic */}
            <TabsContent value="credentials2" className="mt-4">
              <Alert className="bg-blue-50 border-blue-200">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertTitle className="text-blue-800">Credenciais Adicionais</AlertTitle>
                <AlertDescription className="text-blue-700">
                  Informe a Application Key e Client Basic fornecidas pelo Banco do Brasil.
                </AlertDescription>
              </Alert>
              
              <form className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="applicationKey">Application Key</Label>
                  <Input 
                    id="applicationKey" 
                    placeholder="Application Key"
                    value={credentials.applicationKey}
                    onChange={(e) => {
                      setCredentials({...credentials, applicationKey: e.target.value});
                      setErrorMessage(null);
                    }}
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="clientBasic">Client Basic</Label>
                  <Input 
                    id="clientBasic" 
                    placeholder="Client Basic"
                    value={credentials.clientBasic}
                    onChange={(e) => {
                      setCredentials({...credentials, clientBasic: e.target.value});
                      setErrorMessage(null);
                    }}
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="apiUrl">URL da API</Label>
                  <Input 
                    id="apiUrl" 
                    placeholder="https://api.bb.com.br/pix/v1"
                    value={credentials.apiUrl}
                    onChange={(e) => {
                      setCredentials({...credentials, apiUrl: e.target.value});
                      setErrorMessage(null);
                    }}
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                
                <div className="flex justify-between space-x-2">
                  <Button
                    onClick={() => setActiveTab("credentials1")}
                    variant="outline"
                    disabled={isSubmitting}
                  >
                    Voltar
                  </Button>
                  <Button
                    onClick={() => setActiveTab("account")}
                    disabled={!allCredentials2Filled() || isSubmitting}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Próximo
                  </Button>
                </div>
              </form>
            </TabsContent>
            
            {/* Tab 3: Agência e Conta */}
            <TabsContent value="account" className="mt-4">
              <Alert className="bg-blue-50 border-blue-200">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertTitle className="text-blue-800">Dados da Conta</AlertTitle>
                <AlertDescription className="text-blue-700">
                  Informe a agência e o número da conta.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="agencia">Agência</Label>
                    <Input 
                      id="agencia" 
                      placeholder="Ex: 1234"
                      value={credentials.agencia}
                      onChange={(e) => {
                        setCredentials({...credentials, agencia: e.target.value});
                        setErrorMessage(null);
                      }}
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="conta">Número da Conta</Label>
                    <Input 
                      id="conta" 
                      placeholder="Ex: 12345-6"
                      value={credentials.conta}
                      onChange={(e) => {
                        setCredentials({...credentials, conta: e.target.value});
                        setErrorMessage(null);
                      }}
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
                
                <div className="flex justify-between space-x-2 mt-6">
                  <Button
                    onClick={() => setActiveTab("credentials2")}
                    variant="outline"
                    disabled={isSubmitting}
                  >
                    Voltar
                  </Button>
                  
                  <div className="flex space-x-2">
                    <Button
                      onClick={testConnection}
                      variant="outline"
                      disabled={!allFieldsFilled() || isSubmitting}
                      className="bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Testar Conexão
                    </Button>
                    
                    <Button
                      onClick={handleSubmit}
                      disabled={!allFieldsFilled() || isSubmitting}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {isSubmitting ? "Salvando..." : "Salvar Alterações"}
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
} 