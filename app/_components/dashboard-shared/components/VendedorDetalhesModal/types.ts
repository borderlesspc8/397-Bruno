import { Vendedor as BaseVendedor } from "@/app/_services/betelTecnologia";

// Interface estendida com propriedades adicionais
export interface Vendedor extends BaseVendedor {
  posicao?: number;
  percentual?: number;
}

export interface VendedorDetalhesModalProps {
  vendedor: Vendedor | null;
  aberto: boolean;
  onOpenChange: (aberto: boolean) => void;
  onClose?: () => void;
  dataInicio: Date;
  dataFim: Date;
  totalFaturamento: number;
  onVendaClick: (venda: any) => void;
  vendasExternas?: any[];
  lastSync?: string;
}

export interface OrigemData {
  origem: string;
  quantidade: number;
  percentual: number;
}

export interface CanalVendaData {
  canal: string;
  quantidade: number;
  percentual: number;
}

