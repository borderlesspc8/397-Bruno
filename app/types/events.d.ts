interface WalletUpdateEvent {
  wallet?: {
    id: string;
    name: string;
    balance: number;
    type: string;
    bankId: string | null;
    bank?: {
      name: string;
      logo: string;
    };
    metadata: any;
    createdAt: string;
  };
  walletId?: string;
}

declare global {
  interface WindowEventMap {
    walletUpdate: CustomEvent<WalletUpdateEvent>;
  }
} 