"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription
} from "../ui/dialog";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "../ui/alert";

import { ConnectionFormTabs } from "./components/ConnectionFormTabs";
import { ActionButtons } from "./components/ActionButtons";
import { EditConnectionProps, BankCredentials } from "./types";

export const EditConnectionDialog = ({ 
  connectionId, 
  initialData,
  onSuccess,
  onClose
}: EditConnectionProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("credentials1");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const [credentials, setCredentials] = useState<BankCredentials>({
    applicationKey: "",
    clientBasic: "",
    clientId: "",
    clientSecret: "",
    apiUrl: "https://api.bb.com.br/pix/v1",
    agencia: "",
    conta: "",
  });

  // Carregar dados iniciais
  useEffect(() => {
    if (initialData) {
      setCredentials(prev => ({
        ...prev,
        ...initialData
      }));
    }
  }, [initialData]);

  const handleInputChange = (field: string, value: string) => {
    setCredentials((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // Verificar se todos os campos obrigatórios foram preenchidos
      if (!allFieldsFilled()) {
        throw new Error("Por favor, preencha todos os campos obrigatórios");
      }

      // Enviar requisição para atualizar a conexão
      const response = await fetch("/api/banks/connect/bb/edit", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          connectionId,
          ...credentials
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Falha ao atualizar credenciais");
      }

      toast.success("Credenciais atualizadas com sucesso!");
      if (onSuccess) onSuccess();
      handleClose();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Falha ao atualizar credenciais";
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
      toast.info("Testando conexão...", { id: "test-connection" });

      const response = await fetch(`/api/banks/test-connection`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Falha ao testar conexão");
      }

      const data = await response.json();
      
      toast.success(`Conexão testada com sucesso!`, {
        id: "test-connection",
      });
    } catch (error) {
      console.error("[TEST_CONNECTION_ERROR]", error);
      const errorMsg = error instanceof Error ? error.message : "Falha ao testar conexão";
      setErrorMessage(errorMsg);
      toast.error(errorMsg, { id: "test-connection" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpen = () => setIsOpen(true);
  
  const handleClose = () => {
    setIsOpen(false);
    if (onClose) onClose();
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
    <Dialog open={isOpen} onOpenChange={handleClose}>
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

          <ConnectionFormTabs 
            credentials={credentials}
            handleInputChange={handleInputChange}
            allCredentials1Filled={allCredentials1Filled()}
            allCredentials2Filled={allCredentials2Filled()}
            allAccountFieldsFilled={allAccountFieldsFilled()}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />

          <ActionButtons 
            onCancel={handleClose}
            onSubmit={handleSubmit}
            onTest={testConnection}
            isSubmitting={isSubmitting}
            allFieldsFilled={allFieldsFilled()}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Exportar a função handleOpen como uma propriedade do componente
EditConnectionDialog.open = (setIsOpen: React.Dispatch<React.SetStateAction<boolean>>) => {
  setIsOpen(true);
}; 