export interface Bank {
  id: string;
  name: string;
  logo: string;
}

export interface BankConnection {
  id: string;
  userId: string;
  bankId: string;
  status: string;
  consentId?: string;
  accessToken?: string;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface BankConsent {
  id: string;
  connectionId: string;
  consentId: string;
  status: string;
  authUrl?: string;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface BankAccount {
  id: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
  accountNumber: string;
  bankId: string;
  userId: string;
}

export interface BankTransaction {
  id: string;
  type: "CREDIT" | "DEBIT";
  amount: number;
  currency: string;
  description: string;
  category?: string;
  date: Date;
  accountId: string;
  status: string;
  correlationId?: string;
}
