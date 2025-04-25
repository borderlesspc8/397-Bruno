"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/app/_components/ui/dialog";
import { Button } from "@/app/_components/ui/button";
import { PlusCircle, Database } from "lucide-react";
import { CreateWalletForm } from "@/app/(auth-routes)/wallets/new/_components/create-wallet-form";
import { useState, forwardRef, useImperativeHandle } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from "@/app/_components/ui/dropdown-menu";
import { WalletTypeSelector, WalletType } from "../wallets/creation/WalletTypeSelector";
import { BBCredentialsForm } from "../wallets/creation/BBCredentialsForm";
import { SuccessModal } from "../wallets/creation/SuccessModal";
import { useWalletCreation } from "../wallets/hooks/useWalletCreation";
import { useRealtimeUpdates } from "@/app/_hooks/use-realtime-updates";
import { useRouter } from "next/navigation";
import { ImportWalletsModal } from "../gestao-click/ImportWalletsModal";

export interface Bank {
  id: string;
  name: string;
  logo: string;
}

interface CreateWalletModalProps {
  banks: Bank[];
  existingWallet?: {
    id: string;
    name: string;
    type: string;
    metadata?: Record<string, any>;
  };
  initialType?: WalletType;
  "data-create-wallet-button"?: boolean;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  isEditMode?: boolean;
}

interface CreateWalletModalRef {
  openEditModal: (wallet: CreateWalletModalProps['existingWallet']) => void;
}

const CreateWalletModal = forwardRef<CreateWalletModalRef, CreateWalletModalProps>(
  function CreateWalletModal({
    banks,
    existingWallet,
    initialType,
    "data-create-wallet-button": dataAttr,
    isOpen,
    onOpenChange,
    isEditMode,
    ...props
  }, ref) {
    const [isOpenInternal, setIsOpenInternal] = useState(false);
    const [selectedType, setSelectedType] = useState<WalletType | null>(null);
    const [isEditModeInternal, setIsEditMode] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const { emitWalletUpdate } = useRealtimeUpdates();
    const router = useRouter();
    
    // Estado para o modal do Gestão Click
    const [isGestaoClickModalOpen, setIsGestaoClickModalOpen] = useState(false);

    // Controle do modal - usando estado interno ou externo
    const controlledIsOpen = isOpen !== undefined ? isOpen : isOpenInternal;
    const setIsOpen = (value: boolean) => {
      setIsOpenInternal(value);
      if (onOpenChange) {
        onOpenChange(value);
      }
    };
    
    // Estado de edição - interno ou externo
    const controlledIsEditMode = isEditMode !== undefined ? isEditMode : isEditModeInternal;
    
    // Instanciar o hook de criação de carteira
    const {
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
    } = useWalletCreation({
      isEditMode: controlledIsEditMode,
      existingWalletId: existingWallet?.id,
      onSuccess: (walletId, metadata) => {
        if (!controlledIsEditMode) {
          setShowSuccessModal(true);
        } else {
          setIsOpen(false);
        }
      }
    });
    
    // Nova função para atualizar a lista de carteiras após criar uma carteira
    const handleWalletCreated = () => {
      setIsOpen(false);
      
      // Usar o sistema de eventos para notificar que carteiras foram alteradas
      emitWalletUpdate({
        action: 'created',
        timestamp: new Date().toISOString(),
      });
      
      // Forçar atualização da UI
      router.refresh();
      
      // Se estamos em /wallets, vamos garantir que a página seja completamente atualizada
      if (typeof window !== 'undefined' && window.location.pathname.includes('/wallets')) {
        // Adicionar um pequeno atraso antes de redirecionar para garantir
        // que os eventos sejam processados
        setTimeout(() => {
          window.location.href = '/wallets';
        }, 300);
      }
    };

    // Nova função para abrir o modal com informações sobre Carteira Manual
    const openManualInfoModal = () => {
      setIsOpen(true);
      setSelectedType("MANUAL_INFO"); // Novo tipo específico para o modal informativo
    };

    // Expor a função openEditModal através da referência
    useImperativeHandle(ref, () => ({
      openEditModal: (wallet) => {
        if (!wallet) return;
        
        setIsEditMode(true);
        setSelectedType("BANK_INTEGRATION");
        
        // Preencher formulário com dados existentes
        if (wallet.metadata) {
          setBbCredentials({
            applicationKey: wallet.metadata.applicationKey || "",
            clientBasic: wallet.metadata.clientBasic || "",
            clientId: wallet.metadata.clientId || "",
            clientSecret: wallet.metadata.clientSecret || "",
            apiUrl: wallet.metadata.apiUrl || "https://api.bb.com.br/pix/v1",
            agencia: wallet.metadata.agencia || "",
            conta: wallet.metadata.conta || ""
          });
        }
        
        setIsOpen(true);
      }
    }));

    return (
      <>
        {/* Dropdown Button for creating wallet */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              id="create-wallet-button"
              data-create-wallet-button="true"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Nova Carteira
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Adicionar carteira</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => {
              setIsEditMode(false);
              setSelectedType("MANUAL");
              setIsOpen(true);
            }}>
              Carteira Manual
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {
              setIsEditMode(false);
              setSelectedType("BANK_INTEGRATION");
              setIsOpen(true);
            }}>
              Banco do Brasil
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Importação automática</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => {
              setIsGestaoClickModalOpen(true);
            }}>
              <Database className="mr-2 h-4 w-4" />
              Gestão Click
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Modal de importação do Gestão Click */}
        <ImportWalletsModal 
          open={isGestaoClickModalOpen} 
          onOpenChange={setIsGestaoClickModalOpen} 
        />

        {/* Main Creation Dialog */}
        <Dialog open={controlledIsOpen} onOpenChange={setIsOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {controlledIsEditMode ? "Editar Carteira" : "Nova Carteira"}
              </DialogTitle>
              <DialogDescription>
                {controlledIsEditMode 
                  ? "Atualize as configurações da sua carteira existente."
                  : "Crie uma nova carteira para gerenciar suas finanças."}
              </DialogDescription>
            </DialogHeader>

            {/* Manual Info Modal */}
            {selectedType === "MANUAL_INFO" && (
              <div className="space-y-4 py-4">
                <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
                  <h3 className="font-medium text-blue-800">Sobre Carteiras Manuais</h3>
                  <p className="text-sm text-blue-700 mt-2">
                    Carteiras manuais são ideais para gerenciar gastos diversos que não estão associados a uma conta bancária específica.
                  </p>
                  <ul className="list-disc list-inside text-sm text-blue-700 mt-2 space-y-1">
                    <li>Rastreie gastos em dinheiro físico</li>
                    <li>Gerencie cartões de crédito</li>
                    <li>Acompanhe despesas compartilhadas</li>
                  </ul>
                </div>
                
                <Button onClick={() => {
                  setSelectedType("MANUAL");
                }} className="w-full">
                  Criar Carteira Manual
                </Button>
              </div>
            )}

            {/* Tipo Selection */}
            {selectedType === null && !controlledIsEditMode && (
              <WalletTypeSelector 
                selectedType={selectedType}
                onSelectType={setSelectedType}
              />
            )}

            {/* Manual Wallet Form */}
            {selectedType === "MANUAL" && (
              <CreateWalletForm 
                onSuccess={handleWalletCreated} 
                banks={banks} 
              />
            )}

            {/* BB Integration */}
            {selectedType === "BANK_INTEGRATION" && (
              <BBCredentialsForm 
                bbCredentials={bbCredentials}
                onCredentialsChange={setBbCredentials}
                certificates={certificates}
                onCertificatesChange={setCertificates}
                isSubmitting={isSubmitting}
                errorMessage={errorMessage}
                onTestConnection={testConnection}
                isTestingConnection={isTestingConnection}
                testConnectionResult={testConnectionResult}
                onSubmit={handleBBIntegration}
                isEditMode={controlledIsEditMode}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Success Modal */}
        <SuccessModal 
          isOpen={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
          walletId={createdWalletId || ""}
          metadata={createdWalletMetadata}
          onSyncNow={syncWallet}
          isSyncing={isSyncing}
        />
      </>
    );
  }
);

CreateWalletModal.displayName = "CreateWalletModal";

export default CreateWalletModal; 