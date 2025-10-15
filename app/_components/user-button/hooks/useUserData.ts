"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/_hooks/useAuth";
import { UserData } from "../types";
import { toast } from "../../ui/use-toast";

/**
 * Hook para gerenciar os dados do usuário
 */
export const useUserData = () => {
  const { user } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Buscar dados completos do usuário
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        
        // Buscar dados reais da API
        const response = await fetch(`/api/user/profile?userId=${user.id}`);
        
        // Se não autorizado, não exibir erro (usuário será redirecionado)
        if (response.status === 401) {
          console.log("Usuário não autenticado, aguardando redirecionamento");
          setIsLoading(false);
          return;
        }
        
        if (!response.ok) {
          throw new Error(`Erro ao buscar dados: ${response.status}`);
        }
        
        const data = await response.json();
        
        setUserData(data);
      } catch (error) {
        console.error("Erro ao buscar dados do usuário:", error);
        // Só exibir toast se não for erro de autenticação
        if (error instanceof Error && !error.message.includes('401')) {
          toast({
            title: "Erro",
            description: "Não foi possível carregar os dados do usuário.",
            variant: "destructive"
          });
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserData();
  }, [user, toast]);
  
  // Atualizar avatar do usuário
  const updateAvatar = async (imageUrl: string) => {
    try {
      // Simulação para demonstração - apenas atualizar o estado local
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
