export interface Bank {
  id: string;
  name: string;
  logo: string;
}

export interface Wallet {
  id: string;
  name: string;
  type: string;
  balance: number;
  bank?: Bank;
  account?: string;
  agency?: string;
  lastSync?: string;
  metadata?: {
    lastSync?: string;
    agencia?: string;
    conta?: string;
  };
} 