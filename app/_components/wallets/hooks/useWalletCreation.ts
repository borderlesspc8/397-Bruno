"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CertificateFile } from "../creation/CertificateUploader";
import { BBCredentials } from "../creation/BBCredentialsForm";

interface UseWalletCreationProps {
  onSuccess?: (walletId: string, metadata: any) => void;
  isEditMode?: boolean;
  existingWalletId?: string;
}

export function useWalletCreation({ 
  onSuccess, 
  isEditMode = false,
  existingWalletId 
}: UseWalletCreationProps = {}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [testConnectionResult, setTestConnectionResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [createdWalletId, setCreatedWalletId] = useState<string | null>(null);
  const [createdWalletMetadata, setCreatedWalletMetadata] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Credenciais do Banco do Brasil
  const [bbCredentials, setBbCredentials] = useState<BBCredentials>({
    applicationKey: "",
    clientBasic: "",
    clientId: "",
    clientSecret: "",
    apiUrl: "",
    agencia: "",
    conta: "",
  });

  // Certificados
  const [certificates, setCertificates] = useState<CertificateFile[]>([
    { 
      name: "Certificado CA", 
      file: null, 
      valid: false, 
      validating: false, 
      fieldName: "ca", 
      description: "Certificado da Autoridade Certificadora (CA)", 
      path: "certs/ca.cer" 
    },
    { 
      name: "Certificado", 
      file: null, 
      valid: false, 
      validating: false, 
      fieldName: "cert", 
      description: "Certificado de cliente em formato PEM", 
      path: "certs/cert.pem" 
    },
    { 
      name: "Chave Privada", 
      file: null, 
      valid: false, 
      validating: false, 
      fieldName: "key", 
      description: "Chave privada para o certificado", 
      path: "certs/private.key" 
    }
  ]);

  // Upload de certificados
  const uploadCertificates = async (): Promise<boolean> => {
    try {
      const formData = new FormData();
      
      // Verificar se há certificados para enviar
      const filesToUpload = certificates.filter(c => c.file !== null);
      if (filesToUpload.length === 0) {
        console.log("[UPLOAD_CERTIFICATES] Nenhum certificado foi alterado, pulando upload");
        return true;
      }
      
      // Adicionar cada certificado ao FormData
      filesToUpload.forEach(cert => {
        if (cert.file) {
          formData.append(cert.fieldName, cert.file);
        }
      });
      
      // Adicionar ID da carteira existente (apenas em modo de edição)
      if (isEditMode && existingWalletId) {
        formData.append("walletId", existingWalletId);
      }
      
      console.log("[UPLOAD_CERTIFICATES] Enviando certificados...");
      
      // Enviar os certificados para o servidor
      const response = await fetch("/api/certificates/upload", {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Falha ao enviar certificados");
      }

      const data = await response.json();
      toast.success("Certificados enviados com sucesso!");
      return true;
    } catch (error) {
      console.error("[UPLOAD_CERTIFICATES_ERROR]", error);
      const errorMsg = error instanceof Error ? error.message : "Erro ao enviar certificados. Tente novamente.";
      setErrorMessage(errorMsg);
      toast.error(errorMsg);
      return false;
    }
  };

  // Teste de conexão
  const testConnection = async () => {
    setIsTestingConnection(true);
    setTestConnectionResult(null);
    setErrorMessage(null);

    try {
      // Enviar as credenciais para teste
      const response = await fetch("/api/banks/test-connection", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          applicationKey: bbCredentials.applicationKey,
          clientBasic: bbCredentials.clientBasic,
          clientId: bbCredentials.clientId,
          clientSecret: bbCredentials.clientSecret,
          apiUrl: bbCredentials.apiUrl || "https://api.bb.com.br/pix/v1",
          agencia: bbCredentials.agencia,
          conta: bbCredentials.conta,
          walletId: existingWalletId
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Falha ao testar conexão");
      }

      setTestConnectionResult({
        success: true,
        message: data.message || "Conexão estabelecida com sucesso!"
      });
    } catch (error) {
      console.error("[TEST_CONNECTION_ERROR]", error);
      const errorMsg = error instanceof Error ? error.message : "Erro ao testar conexão com o banco";
      
      setTestConnectionResult({
        success: false,
        message: errorMsg
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  // Criar ou atualizar a integração com o BB
  const handleBBIntegration = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // Validar e enviar os certificados primeiro, apenas se algum foi modificado
      const certificatesModified = certificates.some(cert => cert.file !== null);
      if (certificatesModified) {
        const certificatesSaved = await uploadCertificates();
        if (!certificatesSaved) {
          setIsSubmitting(false);
          return;
        }
      }

      // URL e método diferentes dependendo do modo (criar ou editar)
      const url = isEditMode && existingWalletId
        ? `/api/wallets/${existingWalletId}/update-credentials` 
        : "/api/banks/connect/bb";
      
      const method = "POST";

      // Enviar as credenciais
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          applicationKey: bbCredentials.applicationKey,
          clientBasic: bbCredentials.clientBasic,
          clientId: bbCredentials.clientId,
          clientSecret: bbCredentials.clientSecret,
          apiUrl: bbCredentials.apiUrl || "https://api.bb.com.br/pix/v1",
          agencia: bbCredentials.agencia,
          conta: bbCredentials.conta,
          type: "BANK_INTEGRATION",
          metadata: {
            applicationKey: bbCredentials.applicationKey,
            clientBasic: bbCredentials.clientBasic,
            clientId: bbCredentials.clientId,
            clientSecret: bbCredentials.clientSecret,
            apiUrl: bbCredentials.apiUrl || "https://api.bb.com.br/pix/v1",
            agencia: bbCredentials.agencia,
            conta: bbCredentials.conta
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Falha ao ${isEditMode ? 'atualizar' : 'criar'} integração com o Banco do Brasil`);
      }

      const data = await response.json();
      console.log(`Integração ${isEditMode ? 'atualizada' : 'criada'}:`, data);
      
      // Guardar o ID da carteira e metadados para uso posterior
      setCreatedWalletId(data.id);
      setCreatedWalletMetadata(data.metadata);
      
      // Notificar o sucesso
      if (onSuccess) {
        onSuccess(data.id, data.metadata);
      }
      
      // Em modo de edição, apenas mostrar toast
      if (isEditMode) {
        toast.success("Integração atualizada com sucesso!");
        
        // Disparar evento para atualizar a lista de carteiras
        const event = new CustomEvent('walletCreated');
        window.dispatchEvent(event);
      }
      
    } catch (error) {
      console.error("[BB_INTEGRATION_ERROR]", error);
      const errorMsg = error instanceof Error ? error.message : `Erro ao ${isEditMode ? 'atualizar' : 'configurar'} integração com o Banco do Brasil`;
      setErrorMessage(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Sincronizar a carteira 
  const syncWallet = async () => {
    if (!createdWalletId) return;
    
    setIsSyncing(true);
    
    try {
      const response = await fetch(`/api/wallets/${createdWalletId}/sync`, {
        method: "POST",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Falha ao sincronizar carteira");
      }

      const data = await response.json();
      toast.success("Carteira sincronizada com sucesso!");
      
      // Disparar evento para atualizar a lista de carteiras
      const event = new CustomEvent('walletCreated');
      window.dispatchEvent(event);
      
    } catch (error) {
      console.error("[SYNC_WALLET_ERROR]", error);
      const errorMsg = error instanceof Error ? error.message : "Erro ao sincronizar carteira";
      toast.error(errorMsg);
    } finally {
      setIsSyncing(false);
    }
  };

  return {
    bbCredentials,
    setBbCredentials,
    certificates,
    setCertificates,
    isSubmitting,
    errorMessage,
    testConnectionResult,
    isTestingConnection,
    createdWalletId,
    createdWalletMetadata,
    isSyncing,
    testConnection,
    handleBBIntegration,
    syncWallet
  };
} 