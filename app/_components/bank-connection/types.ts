// Tipos para credenciais de conexão bancária
export interface BankCredentials {
  applicationKey: string;
  clientBasic: string;
  clientId: string;
  clientSecret: string;
  apiUrl: string;
  agencia: string;
  conta: string;
}

// Tipos para componente de edição
export interface EditConnectionProps {
  connectionId: string;
  initialData?: Partial<BankCredentials>;
  onSuccess?: () => void;
  onClose?: () => void;
}

// Tipos para componente de abas de formulário
export interface ConnectionFormTabsProps {
  credentials: BankCredentials;
  handleInputChange: (field: string, value: string) => void;
  allCredentials1Filled: boolean;
  allCredentials2Filled: boolean;
  allAccountFieldsFilled: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

// Tipos para botões de ação
export interface ActionButtonsProps {
  onCancel: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onTest: () => void;
  isSubmitting: boolean;
  allFieldsFilled: boolean;
} 