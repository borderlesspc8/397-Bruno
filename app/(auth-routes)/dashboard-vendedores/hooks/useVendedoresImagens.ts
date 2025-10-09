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
      'marcos-vinicius': '/uploads/vendedores/vendedor_marcos-vinicius.png',
      // IDs com prefixo gc- (Gestão Click)
      'gc-1072623': '/uploads/vendedores/vendedor_1072623.png',
      'gc-1076058': '/uploads/vendedores/1076058.jpg',
      'gc-1089189': '/uploads/vendedores/1089189.jpg',
      'gc-1145968': '/uploads/vendedores/1145968.jpg',
      'gc-1093446': '/uploads/vendedores/vendedor_1093446.png',
      'gc-1187735': '/uploads/vendedores/vendedor_1187735.png'
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

      // Extrair o ID real do vendedor (remover prefixo gc- se existir)
      const vendedorIdReal = id.startsWith('gc-') ? id.replace('gc-', '') : id;

      // Formatos a tentar, em ordem de prioridade
      const formatos = [
        `/uploads/vendedores/vendedor_${vendedorIdReal}.png`,
        `/uploads/vendedores/vendedor_${vendedorIdReal}.jpg`,
        `/uploads/vendedores/${vendedorIdReal}.jpg`, // Formato sem prefixo vendedor_
        `/uploads/vendedores/${vendedorIdReal}.png`  // Formato sem prefixo vendedor_
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