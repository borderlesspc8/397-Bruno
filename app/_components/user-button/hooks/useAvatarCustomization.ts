"use client";

import { useState, useCallback } from "react";
import { AvatarOption } from "../types";
import { getAvatarColorOptions } from "../utils/formatters";
import { toast } from "../../ui/use-toast";

/**
 * Hook para gerenciar a personalização do avatar do usuário
 */
export const useAvatarCustomization = (currentAvatarUrl: string | null | undefined, updateAvatarFn: (url: string) => Promise<boolean>) => {
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string>("bg-blue-500");
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(currentAvatarUrl || null);
  const [isUploading, setIsUploading] = useState(false);
  
  // Abrir modal de personalização
  const openCustomization = useCallback(() => {
    setIsCustomizing(true);
  }, []);
  
  // Fechar modal de personalização
  const closeCustomization = useCallback(() => {
    setIsCustomizing(false);
  }, []);
  
  // Selecionar cor de fundo para avatar de iniciais
  const selectColor = useCallback((color: string) => {
    setSelectedColor(color);
  }, []);
  
  // Obter lista de cores de fundo disponíveis
  const colorOptions = getAvatarColorOptions();
  
  // Obter avatares predefinidos
  const getAvatarOptions = useCallback((): AvatarOption[] => {
    return [
      { id: "default", src: undefined, label: "Iniciais" },
      { id: "avatar1", src: "/avatars/avatar1.png", label: "Avatar 1" },
      { id: "avatar2", src: "/avatars/avatar2.png", label: "Avatar 2" },
      { id: "avatar3", src: "/avatars/avatar3.png", label: "Avatar 3" },
      { id: "avatar4", src: "/avatars/avatar4.png", label: "Avatar 4" },
      { id: "avatar5", src: "/avatars/avatar5.png", label: "Avatar 5" },
      { id: "upload", src: selectedAvatar || undefined, label: "Personalizado" }
    ];
  }, [selectedAvatar]);
  
  // Simular upload de arquivo
  const uploadAvatarFile = useCallback(async (file: File) => {
    try {
      setIsUploading(true);
      
      // Simulação de upload de arquivo
      // Em um caso real, isso enviaria o arquivo para um servidor/CDN
      return new Promise<string>((resolve) => {
        setTimeout(() => {
          // Criar URL temporária para a imagem (em produção, seria a URL do servidor)
          const url = URL.createObjectURL(file);
          setSelectedAvatar(url);
          resolve(url);
          setIsUploading(false);
        }, 1500);
      });
    } catch (error) {
      console.error("Erro ao fazer upload do avatar:", error);
      toast({
        title: "Erro no upload",
        description: "Não foi possível fazer o upload do arquivo.",
        variant: "destructive"
      });
      setIsUploading(false);
      return null;
    }
  }, [toast]);
  
  // Salvar alterações de avatar
  const saveAvatarChanges = useCallback(async () => {
    try {
      if (!selectedAvatar) {
        // Se não tiver imagem selecionada, usa o avatar de iniciais com a cor selecionada
        // Na verdade, precisaríamos gerar uma imagem com a cor ou salvar a preferência
        // no backend. Para fins de demo, vamos apenas considerar como "sem imagem".
        await updateAvatarFn("");
      } else {
        await updateAvatarFn(selectedAvatar);
      }
      
      closeCustomization();
      return true;
    } catch (error) {
      console.error("Erro ao salvar alterações do avatar:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar as alterações do avatar.",
        variant: "destructive"
      });
      return false;
    }
  }, [selectedAvatar, selectedColor, updateAvatarFn, closeCustomization, toast]);
  
  return {
    isCustomizing,
    selectedColor,
    selectedAvatar,
    isUploading,
    colorOptions,
    getAvatarOptions,
    openCustomization,
    closeCustomization,
    selectColor,
    uploadAvatarFile,
    saveAvatarChanges
  };
}; 