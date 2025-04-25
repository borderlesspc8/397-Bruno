"use client";

import { useState, useEffect } from "react";
import { Vendedor } from "@/app/_services/betelTecnologia";
import { VendedorImagensService } from "@/app/_services/vendedorImagens";
import { formatCurrency } from "@/app/_utils/format";
import "./podium.css";

interface PodiumRankingProps {
  vendedores: Vendedor[];
  ordenacao?: "faturamento" | "vendas" | "ticket";
  onVendedorClick?: (vendedor: Vendedor) => void;
}

export default function PodiumRanking({
  vendedores,
  ordenacao = "faturamento",
  onVendedorClick
}: PodiumRankingProps) {
  const [imagensVendedores, setImagensVendedores] = useState<Record<string, string>>({});
  const [podio, setPodio] = useState<Vendedor[]>([]);
  const [animacoesCarregadas, setAnimacoesCarregadas] = useState<Record<number, boolean>>({});

  // Ordenar vendedores e pegar os 3 primeiros
  useEffect(() => {
    const vendedoresOrdenados = [...vendedores].sort((a, b) => {
      if (ordenacao === "faturamento") {
        return b.faturamento - a.faturamento;
      } 
      if (ordenacao === "vendas") {
        return b.vendas - a.vendas;
      }
      return b.ticketMedio - a.ticketMedio;
    }).slice(0, 3);

    setPodio(vendedoresOrdenados);
  }, [vendedores, ordenacao]);

  // Carregar imagens de vendedores
  useEffect(() => {
    const carregarImagens = async () => {
      if (podio.length === 0) return;

      try {
        const novasImagens: Record<string, string> = {};
        
        for (const vendedor of podio) {
          if (vendedor?.id) {
            const imagemUrl = await VendedorImagensService.buscarImagemVendedor(vendedor.id);
            novasImagens[vendedor.id] = imagemUrl;
          }
        }
        
        setImagensVendedores(novasImagens);
        
        // Ativar animações com um pequeno atraso para cada item
        setTimeout(() => {
          setAnimacoesCarregadas({ 0: true });
          setTimeout(() => {
            setAnimacoesCarregadas(prev => ({ ...prev, 1: true }));
            setTimeout(() => {
              setAnimacoesCarregadas(prev => ({ ...prev, 2: true }));
            }, 200);
          }, 200);
        }, 100);
        
      } catch (error) {
        console.error("Erro ao carregar imagens dos vendedores:", error);
      }
    };

    carregarImagens();
  }, [podio]);

  // Obter valor do vendedor com base na ordenação
  const getValorVendedor = (vendedor: Vendedor) => {
    if (ordenacao === "faturamento") {
      return formatCurrency(vendedor.faturamento);
    } 
    if (ordenacao === "vendas") {
      return `${vendedor.vendas} vendas`;
    }
    return formatCurrency(vendedor.ticketMedio);
  };

  // Se não tiver vendedores suficientes, não mostrar o pódio
  if (!vendedores || vendedores.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground w-full">
        <p>Não há vendedores suficientes para montar o pódio.</p>
      </div>
    );
  }

  // Layout atualizado seguindo o novo design
  return (
    <div className="podium-container w-full" style={{ backgroundImage: 'url("/images/podium/game-podium.png")' }}>
      <div className="podium-inner">
        {/* Segundo Lugar */}
        {podio.length > 1 && (
          <div className="podium-card second-place" style={{ opacity: animacoesCarregadas[1] ? 1 : 0 }}>
            <div className="card-frame card-frame-second">
              <div className="diamond diamond-second"></div>
              <div className="medal-container medal-second">
                  <div className="medal"></div>
                </div>
              <div className="avatar-container">
                <img 
                  className="avatar-image" 
                  src={podio[1]?.id ? imagensVendedores[podio[1].id] : '/images/default-avatar.svg'} 
                  alt={`Foto de ${podio[1]?.nome || 'vendedor'}`}
                  onClick={() => podio[1] && onVendedorClick && onVendedorClick(podio[1])}
                />
                
              </div>
              <div className="info-container">
                <h3 className="vendedor-nome">{podio[1]?.nome.split(' ')[0] || 'Vendedor'}</h3>
                <p className="vendedor-sobrenome">{podio[1]?.nome.split(' ').slice(1).join(' ') || ''}</p>
                <p className="vendedor-valor">{getValorVendedor(podio[1])}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Primeiro Lugar */}
        {podio.length > 0 && (
          <div className="podium-card first-place" style={{ opacity: animacoesCarregadas[0] ? 1 : 0 }}>
            <div className="card-frame card-frame-first">
              <div className="diamond diamond-first"></div>

              <div className="medal-container medal-first">
                  <div className="medal"></div>
                </div>
              <div className="avatar-container">
                <div className="avatar-highlight"></div>
                <img 
                  className="avatar-image" 
                  src={podio[0]?.id ? imagensVendedores[podio[0].id] : '/images/default-avatar.svg'} 
                  alt={`Foto de ${podio[0]?.nome || 'vendedor'}`}
                  onClick={() => podio[0] && onVendedorClick && onVendedorClick(podio[0])}
                />
              </div>
              <div className="info-container">
                <h3 className="vendedor-nome">{podio[0]?.nome.split(' ')[0] || 'Vendedor'}</h3>
                <p className="vendedor-sobrenome">{podio[0]?.nome.split(' ').slice(1).join(' ') || ''}</p>
                <p className="vendedor-valor">{getValorVendedor(podio[0])}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Terceiro Lugar */}
        {podio.length > 2 && (
          <div className="podium-card third-place" style={{ opacity: animacoesCarregadas[2] ? 1 : 0 }}>
            <div className="card-frame card-frame-third">
              <div className="diamond diamond-third"></div>
              <div className="medal-container medal-third">
                  <div className="medal"></div>
                </div>
              <div className="avatar-container">
                <img 
                  className="avatar-image" 
                  src={podio[2]?.id ? imagensVendedores[podio[2].id] : '/images/default-avatar.svg'} 
                  alt={`Foto de ${podio[2]?.nome || 'vendedor'}`}
                  onClick={() => podio[2] && onVendedorClick && onVendedorClick(podio[2])}
                />
               
              </div>
              <div className="info-container">
                <h3 className="vendedor-nome">{podio[2]?.nome.split(' ')[0] || 'Vendedor'}</h3>
                <p className="vendedor-sobrenome">{podio[2]?.nome.split(' ').slice(1).join(' ') || ''}</p>
                <p className="vendedor-valor">{getValorVendedor(podio[2])}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Base com efeitos luminosos */}
        <div className="podium-base"></div>
      </div>
    </div>
  );
} 