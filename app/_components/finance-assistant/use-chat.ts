"use client";

import { useState, useCallback, useRef, useEffect } from 'react';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface UseChatProps {
  month?: string;
  onError?: () => void;
}

export function useChat({ month, onError }: UseChatProps = {}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isChatDisabled, setIsChatDisabled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Verificar status do chat ao inicializar
  useEffect(() => {
    checkChatStatus();
  }, []);

  // Função para verificar o status do chat
  const checkChatStatus = async () => {
    try {
      const response = await fetch('/api/chat-status?check_db=true');
      if (response.ok) {
        const data = await response.json();
        setIsChatDisabled(data.chatDisabled);
        
        if (data.chatDisabled) {
          setError("O chat está temporariamente desabilitado. Tente novamente mais tarde.");
        } else {
          setError(null);
        }
      }
    } catch (error) {
      console.error("Erro ao verificar status do chat:", error);
      // Não definir como desabilitado em caso de erro de verificação
    }
  };

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || isLoading) return;
    
    // Verificar novamente se o chat está habilitado
    await checkChatStatus();
    if (isChatDisabled) {
      setError("O chat está temporariamente desabilitado. Tente novamente mais tarde.");
      return;
    }
    
    // Adicionar mensagem do usuário
    const userMessage: ChatMessage = { role: 'user', content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    // Cancelar requisição anterior se existir
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Criar um novo AbortController para esta requisição
    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;
    
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          month
        }),
        signal
      });
      
      if (!response.ok) {
        throw new Error('Falha na comunicação com o assistente financeiro');
      }
      
      const data = await response.json();
      
      if (data.response) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: data.response }
        ]);
      }
    } catch (error) {
      // Ignorar erros de aborto deliberados
      if ((error as Error).name !== 'AbortError') {
        console.error('Erro na comunicação com o assistente:', error);
        setError('Não foi possível conectar ao assistente. Tente novamente mais tarde.');
        if (onError) onError();
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };
  
  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);
  
  return {
    messages,
    input,
    setInput,
    handleInputChange,
    handleSubmit,
    isLoading,
    clearMessages,
    isChatDisabled,
    checkChatStatus,
    error
  };
} 