"use server";

interface CreateWalletData {
  name: string;
  initialBalance: number;
  type: "MANUAL" | "BANK" | "BANK_INTEGRATION";
  bankId?: string;
  metadata?: Record<string, any>;
}

export async function createWallet(data: CreateWalletData) {
  try {
    const response = await fetch("/api/wallets", {
      method: "POST",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.json();
      return { error };
    }

    const wallet = await response.json();
    return { wallet };
  } catch (error) {
    return { error: "Erro ao criar carteira" };
  }
} 