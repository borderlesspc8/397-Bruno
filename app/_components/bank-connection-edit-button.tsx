"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { FileEdit, Settings } from "lucide-react";
import { toast } from "sonner";
import EditConnectionModal from "./modals/edit-connection-modal";

interface BankConnectionEditButtonProps {
  connectionId: string;
  walletId: string;
  initialData?: {
    applicationKey: string;
    clientBasic?: string;
    clientId: string;
    clientSecret: string;
    apiUrl: string;
    agencia: string;
    conta: string;
  };
  variant?: "icon" | "full" | "text";
}

export default function BankConnectionEditButton({ 
  connectionId, 
  walletId,
  initialData,
  variant = "full" 
}: BankConnectionEditButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Função para abrir o modal de edição
  const openEditModal = () => {
    console.log("Abrindo modal de edição para a conexão:", connectionId);
    console.log("Dados iniciais:", initialData);
    if (!initialData?.clientBasic) {
      console.warn("Aviso: clientBasic ausente nos dados iniciais");
    }
    setIsModalOpen(true);
  };
  
  const renderButton = () => {
    switch (variant) {
      case "icon":
        return (
          <Button
            variant="ghost"
            size="icon"
            onClick={openEditModal}
            className="h-8 w-8"
            title="Editar credenciais da conexão"
          >
            <FileEdit className="h-4 w-4" />
          </Button>
        );
      case "text":
        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={openEditModal}
            className="text-blue-600 hover:text-blue-800 hover:underline"
          >
            Editar Credenciais
          </Button>
        );
      default:
        return (
          <Button
            variant="outline"
            size="sm"
            onClick={openEditModal}
            className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
          >
            <Settings className="h-3 w-3 mr-2" />
            Editar Conexão
          </Button>
        );
    }
  };
  
  return (
    <>
      {renderButton()}
      
      <EditConnectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        connectionId={connectionId}
        walletId={walletId}
        initialData={initialData}
      />
    </>
  );
} 