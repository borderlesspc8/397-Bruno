"use server";

interface UpdateWalletData {
  name?: string;
  balance?: number;
}

export async function updateWallet(walletId: string, data: UpdateWalletData) {
  try {
    const response = await fetch(`/api/wallets/${walletId}`, {
      method: "PATCH",
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
    return { error: "Erro ao atualizar carteira" };
  }
} 