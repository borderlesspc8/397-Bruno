import { useState, useEffect } from 'react';
import { Vendedor } from '@/app/_services/betelTecnologia';

/**
 * Hook para gerenciar imagens de vendedores
 * @param vendedores Lista de vendedores para os quais carregar imagens
 * @param limite Número máximo de vendedores a processar (opcional, por padrão processa todos)
 * @returns Objeto com mapeamento de ID de vendedor para URL da imagem
 */
export function useVendedoresImagens(vendedores: Vendedor[], limite?: number) {
  const [imagensVendedores, setImagensVendedores] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!vendedores || vendedores.length === 0) {
      return;
    }

    const vendedoresParaProcessar = limite ? vendedores.slice(0, limite) : vendedores;
    
    // Criamos um mapa das imagens conhecidas - otimização
    const imagensConhecidas: Record<string, string> = {
      '1072623': '/uploads/vendedores/vendedor_1072623.png',
      '1076058': '/uploads/vendedores/1076058.jpg',
      '1089189': '/uploads/vendedores/1089189.jpg',
      '1145968': '/uploads/vendedores/1145968.jpg',
      'marcos-vinicius': '/uploads/vendedores/vendedor_marcos-vinicius.png'
    };

    // Para cada vendedor, carregamos suas imagens
    vendedoresParaProcessar.forEach(vendedor => {
      if (!vendedor?.id) return;
      
      const id = vendedor.id;
      
      // Verifica se temos a imagem já mapeada
      if (imagensConhecidas[id]) {
        setImagensVendedores(prev => ({
          ...prev,
          [id]: imagensConhecidas[id]
        }));
        return;
      }

      // Formatos a tentar, em ordem de prioridade
      const formatos = [
        `/uploads/vendedores/vendedor_${id}.png`,
        `/uploads/vendedores/vendedor_${id}.jpg`
      ];
      
      // Função para tentar o próximo formato
      const tentarProximoFormato = (indice: number) => {
        if (indice >= formatos.length) {
          // Nenhuma imagem encontrada, usar padrão
          setImagensVendedores(prev => ({
            ...prev,
            [id]: '/images/default-avatar.svg'
          }));
          return;
        }
        
        const formatoAtual = formatos[indice];
        const img = new Image();
        
        img.onload = () => {
          // Imagem encontrada
          setImagensVendedores(prev => ({
            ...prev,
            [id]: formatoAtual
          }));
        };
        
        img.onerror = () => {
          // Tentar próximo formato
          tentarProximoFormato(indice + 1);
        };
        
        img.src = formatoAtual;
      };
      
      // Iniciar tentativa com o primeiro formato
      tentarProximoFormato(0);
    });
    
  }, [vendedores, limite]);

  return { imagensVendedores };
} 