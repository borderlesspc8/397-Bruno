"use server";

export async function deleteWallet(walletId: string) {
  try {
    // Primeiro, excluir todas as transações associadas à carteira
    const deleteTransactionsResponse = await fetch(`/api/transactions/by-wallet/${walletId}`, {
      method: "DELETE",
    });

    if (!deleteTransactionsResponse.ok) {
      console.error("Erro ao excluir transações da carteira:", await deleteTransactionsResponse.json());
      // Continuar mesmo com erro, para tentar excluir a carteira
    }

    // Agora, excluir a carteira
    const response = await fetch(`/api/wallets/${walletId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const error = await response.json();
      return { error };
    }

    // Revalidar cache da rota /wallets para atualizar a UI
    try {
      await fetch('/api/revalidate?path=/wallets', { method: 'POST' });
    } catch (revalidateError) {
      console.error("Erro ao revalidar cache:", revalidateError);
      // Ignorar erros de revalidação, pois a carteira já foi excluída
    }

    return { success: true };
  } catch (error) {
    console.error("Erro ao excluir carteira:", error);
    return { error: "Erro ao excluir carteira" };
  }
} 