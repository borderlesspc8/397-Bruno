"use client";

import { useState, useEffect, memo, useMemo } from "react";
import { Vendedor } from "@/app/_services/betelTecnologia";
import { formatCurrency } from "@/app/_utils/format";
import { useVendedoresImagens, useRankingVendedores } from "@/app/_components/dashboard-shared/hooks";
import "@/app/_components/dashboard-shared/components/podium.css";

interface PodiumRankingProps {
  vendedores: Vendedor[];
  ordenacao?: "faturamento" | "vendas" | "ticket";
  onVendedorClick?: (vendedor: Vendedor) => void;
}

// Separamos o VendedorCard em um componente memoizado para evitar renderizações desnecessárias
const VendedorCard = memo(({ 
  vendedor, 
  posicao, 
  imagemUrl, 
  valorFormatado, 
  animacaoCarregada,
  onClick 
}: {
  vendedor: Vendedor;
  posicao: number;
  imagemUrl: string;
  valorFormatado: string;
  animacaoCarregada: boolean;
  onClick?: () => void;
}) => {
  const [imagemCarregada, setImagemCarregada] = useState(false);
  const [erroImagem, setErroImagem] = useState(false);

  // Funções para lidar com carregamento de imagem
  const handleImagemCarregada = () => setImagemCarregada(true);
  const handleErroImagem = () => {
    setErroImagem(true);
    setImagemCarregada(true); // Consideramos carregada mesmo em caso de erro
  };

  // Constantes de classes para posição
  const classePosicao = useMemo(() => {
    switch(posicao) {
      case 0: return "first-place";
      case 1: return "second-place";
      case 2: return "third-place";
      default: return "";
    }
  }, [posicao]);
  
  // Classes para estilização
  const classeFrame = useMemo(() => `card-frame-${posicao === 0 ? 'first' : posicao === 1 ? 'second' : 'third'}`, [posicao]);
  const classeDiamond = useMemo(() => `diamond-${posicao === 0 ? 'first' : posicao === 1 ? 'second' : 'third'}`, [posicao]);
  const classeMedal = useMemo(() => `medal-${posicao === 0 ? 'first' : posicao === 1 ? 'second' : 'third'}`, [posicao]);
  
  // Dividir o nome para exibir primeiro nome e sobrenome separados
  const [primeiroNome, sobrenome] = useMemo(() => {
    const partesNome = vendedor?.nome?.split(' ') || [''];
    return [
      partesNome[0],
      partesNome.slice(1).join(' ')
    ];
  }, [vendedor?.nome]);
  
  return (
    <div 
      className={`podium-card ${classePosicao}`} 
      style={{ opacity: animacaoCarregada ? 1 : 0 }}
      role="listitem"
      aria-label={`${primeiroNome} ${sobrenome}, ${posicao === 0 ? '1º lugar' : posicao === 1 ? '2º lugar' : '3º lugar'} com ${valorFormatado}`}
    >
      <div className={`card-frame ${classeFrame}`}>
        <div className={`diamond ${classeDiamond}`}></div>
        <div className={`medal-container ${classeMedal}`}>
          <div className="medal"></div>
        </div>
        <div className="avatar-container">
          {posicao === 0 && <div className="avatar-highlight"></div>}
          
          {/* Indicador de carregamento */}
          {!imagemCarregada && (
            <div className="avatar-loading-indicator">
              <div className="animate-pulse w-full h-full rounded-full bg-gray-300 dark:bg-gray-700" />
            </div>
          )}

          <img 
            className={`avatar-image ${!imagemCarregada ? 'opacity-0' : 'opacity-100'}`}
            src={erroImagem ? '/images/default-avatar.svg' : imagemUrl} 
            alt={`Foto de ${vendedor?.nome || 'vendedor'}`}
            onClick={onClick}
            onLoad={handleImagemCarregada}
            onError={handleErroImagem}
            style={{ 
              cursor: onClick ? 'pointer' : 'default',
              transition: 'opacity 0.2s ease-in-out' 
            }}
            aria-label={onClick ? `Abrir detalhes de ${vendedor?.nome}` : undefined}
            role={onClick ? "button" : undefined}
            tabIndex={onClick ? 0 : undefined}
            onKeyDown={(e) => {
              if (onClick && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                onClick();
              }
            }}
          />
        </div>
        <div className="info-container">
          <h3 className="vendedor-nome">{primeiroNome}</h3>
          <p className="vendedor-sobrenome">{sobrenome}</p>
          <p className="vendedor-valor">{valorFormatado}</p>
        </div>
      </div>
    </div>
  );
});

// Nome do componente para melhor depuração
VendedorCard.displayName = 'VendedorCard';

const PodiumRanking = ({
  vendedores,
  ordenacao = "faturamento",
  onVendedorClick
}: PodiumRankingProps) => {
  // Hooks personalizados para melhorar performance - sem condicionais
  const { vendedoresOrdenados: podio } = useRankingVendedores(vendedores || [], ordenacao, 3);
  const { imagensVendedores } = useVendedoresImagens(podio || [], 3);
  const [animacoesCarregadas, setAnimacoesCarregadas] = useState<Record<number, boolean>>({});

  // Ativa as animações com delay progressivo
  useEffect(() => {
    // Resetar as animações quando o pódio mudar
    setAnimacoesCarregadas({});
    
    if (!podio || podio.length === 0) return;
    
    // Ativar as animações com delay progressivo para cada posição
    const timeouts: NodeJS.Timeout[] = [];
    
    // Primeiro lugar
    timeouts.push(setTimeout(() => {
      setAnimacoesCarregadas(prev => ({ ...prev, 0: true }));
    }, 100));
    
    // Segundo lugar
    if (podio.length > 1) {
      timeouts.push(setTimeout(() => {
        setAnimacoesCarregadas(prev => ({ ...prev, 1: true }));
      }, 300));
    }
    
    // Terceiro lugar
    if (podio.length > 2) {
      timeouts.push(setTimeout(() => {
        setAnimacoesCarregadas(prev => ({ ...prev, 2: true }));
      }, 500));
    }
    
    // Limpar timeouts se o componente for desmontado
    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, [podio]);

  // Obter valor do vendedor com base na ordenação - já formatado
  const getValorVendedor = useMemo(() => {
    return (vendedor: Vendedor) => {
      if (ordenacao === "faturamento") {
        return formatCurrency(vendedor.faturamento);
      } 
      if (ordenacao === "vendas") {
        return `${vendedor.vendas} vendas`;
      }
      return formatCurrency(vendedor.ticketMedio);
    };
  }, [ordenacao]);

  // Renderização para caso de vendedores insuficientes
  if (!vendedores || vendedores.length < 2) {
    return (
      <div 
        className="flex flex-col items-center justify-center py-12 text-muted-foreground w-full"
        role="alert"
        aria-live="polite"
      >
        <p>Não há vendedores suficientes para montar o pódio.</p>
      </div>
    );
  }

  // Handlers seguros para clicks nos vendedores - memoizados para evitar recriação
  const handlers = useMemo(() => {
    const handleClick = (index: number) => () => {
      if (podio.length > index && podio[index] && onVendedorClick) {
        onVendedorClick(podio[index]);
      }
    };
    
    return {
      handleFirstClick: handleClick(0),
      handleSecondClick: handleClick(1),
      handleThirdClick: handleClick(2)
    };
  }, [podio, onVendedorClick]);

  return (
    <div 
      className="podium-container w-full" 
      style={{ backgroundImage: 'url("/images/podium/game-podium.png")' }}
      role="list"
      aria-label="Pódio de vendedores"
    >
      <div className="podium-inner">
        {/* Segundo Lugar */}
        {podio.length > 1 && (
          <VendedorCard
            vendedor={podio[1]}
            posicao={1}
            imagemUrl={podio[1]?.id ? imagensVendedores[podio[1].id] || '/images/default-avatar.svg' : '/images/default-avatar.svg'}
            valorFormatado={getValorVendedor(podio[1])}
            animacaoCarregada={!!animacoesCarregadas[1]}
            onClick={handlers.handleSecondClick}
          />
        )}
        
        {/* Primeiro Lugar */}
        {podio.length > 0 && (
          <VendedorCard
            vendedor={podio[0]}
            posicao={0}
            imagemUrl={podio[0]?.id ? imagensVendedores[podio[0].id] || '/images/default-avatar.svg' : '/images/default-avatar.svg'}
            valorFormatado={getValorVendedor(podio[0])}
            animacaoCarregada={!!animacoesCarregadas[0]}
            onClick={handlers.handleFirstClick}
          />
        )}
        
        {/* Terceiro Lugar */}
        {podio.length > 2 && (
          <VendedorCard
            vendedor={podio[2]}
            posicao={2}
            imagemUrl={podio[2]?.id ? imagensVendedores[podio[2].id] || '/images/default-avatar.svg' : '/images/default-avatar.svg'}
            valorFormatado={getValorVendedor(podio[2])}
            animacaoCarregada={!!animacoesCarregadas[2]}
            onClick={handlers.handleThirdClick}
          />
        )}
        
        {/* Base com efeitos luminosos */}
        <div className="podium-base"></div>
      </div>
    </div>
  );
};

// Exportamos o componente como padrão, sem memoizar o componente principal
// já que os seus subcomponentes estão memoizados e seus hooks otimizados
export default PodiumRanking; 
