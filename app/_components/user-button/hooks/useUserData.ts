"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { UserData } from "../types";
import { toast } from "../../ui/use-toast";

/**
 * Hook para gerenciar os dados do usuário
 */
export const useUserData = () => {
  const { data: session, update } = useSession();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Buscar dados completos do usuário
  useEffect(() => {
    const fetchUserData = async () => {
      if (!session?.user) {
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        
        // Buscar dados reais da API
        const response = await fetch("/api/user/profile");
        
        if (!response.ok) {
          throw new Error(`Erro ao buscar dados: ${response.status}`);
        }
        
        const data = await response.json();
        
        setUserData(data);
      } catch (error) {
        console.error("Erro ao buscar dados do usuário:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os dados do usuário.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserData();
  }, [session, toast]);
  
  // Atualizar avatar do usuário
  const updateAvatar = async (imageUrl: string) => {
    try {
      // Em um caso real, isso enviaria uma requisição para a API
      // para atualizar o avatar do usuário
      
      // Simulação para demonstração
      await update({
        ...session,
        user: {
          ...session?.user,
          image: imageUrl
        }
      });
      
      setUserData(prev => prev ? { ...prev, image: imageUrl } : null);
      
      toast({
        title: "Avatar atualizado",
        description: "Seu avatar foi atualizado com sucesso!",
        variant: "default"
      });
      
      return true;
    } catch (error) {
      console.error("Erro ao atualizar avatar:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar seu avatar.",
        variant: "destructive"
      });
      
      return false;
    }
  };
  
  return {
    userData,
    isLoading,
    updateAvatar
  };
}; 