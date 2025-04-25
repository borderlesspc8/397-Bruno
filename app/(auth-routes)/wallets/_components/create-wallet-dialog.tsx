"use client";

import { WalletActions } from "@/app/_components/wallet/WalletActions";
import { useEffect, useState } from "react";
import { getAuthSession } from "@/app/_lib/auth";

/**
 * Este componente é mantido para compatibilidade com código existente,
 * mas internamente usa o WalletActions para evitar duplicação de código.
 */
export default function CreateWalletDialog() {
  const [userId, setUserId] = useState<string>("");

  useEffect(() => {
    // Obter o ID do usuário da sessão
    const getUserId = async () => {
      const { user } = await getAuthSession();
      if (user?.id) {
        setUserId(user.id);
      }
    };
    getUserId();
  }, []);

  if (!userId) return null;
  
  return <WalletActions userId={userId} />;
} 