import { useState, useEffect, useMemo } from 'react';
import { formatCurrency } from '@/app/_utils/format';
import { BadgeCheck, TrendingUp, Target } from 'lucide-react';
import { cn } from '@/app/_lib/utils';
import { Vendedor as VendedorBetel } from '@/app/_services/betelTecnologia';
import { useMetas, Meta } from '@/app/_hooks/useMetas';

// Usamos a interface Vendedor importada diretamente do serviço BetelTecnologia
interface VendedoresChartImprovedProps {
  vendedores: VendedorBetel[];
  onVendedorClick?: (vendedor: VendedorBetel, index?: number) => void;
  // Adicionar props para receber dados da mesma fonte
  vendas?: any[];
  totalVendas?: number;
  totalValor?: number;
  ticketMedio?: number;
  // Data do mês selecionado no filtro (opcional, usa mês atual se não fornecido)
  mesSelecionado?: Date;
}


// Objeto de mapeamento entre nomes de vendedores e IDs usados no sistema de metas
const VENDEDORES_MAPEAMENTO = {
  "MARCUS VINICIUS MACEDO": "marcus-vinicius-macedo-unidade-matriz",
  "DIULY MORAES": "diuly-moraes-filial-golden",
  "BRUNA RAMOS": "bruna-ramos-filial-golden",
  "FERNANDO LOYO": "fernando-loyo-unidade-matriz",
  "ALYNE LIMA": "alyne-lima-unidade-matriz",
  "ADMINISTRATIVO": "administrativo"
};

// Mapeamento reverso para IDs das metas para nomes
const METAS_VENDEDORES_MAPEAMENTO = {
  "marcus-vinicius-macedo-(unidade-matriz)": "MARCUS VINICIUS MACEDO",
  "diuly-moraes-(unidade-matriz)": "DIULY MORAES",
  "bruna-ramos-(unidade-matriz)": "BRUNA RAMOS",
  "fernando-loyo-(unidade-matriz)": "FERNANDO LOYO",
  "alyne-lima-(unidade-matriz)": "ALYNE LIMA",
  "marcus-vinicius-macedo-unidade-matriz": "MARCUS VINICIUS MACEDO",
  "diuly-moraes-filial-golden": "DIULY MORAES",
  "bruna-ramos-filial-golden": "BRUNA RAMOS",
  "fernando-loyo-unidade-matriz": "FERNANDO LOYO",
  "alyne-lima-unidade-matriz": "ALYNE LIMA",
  "administrativo": "ADMINISTRATIVO"
};

// Função auxiliar para remover identificação de unidade do nome (apenas para exibição)
const removerUnidadeDoNome = (nome: string): string => {
  return nome
    .replace(/\s*\(Unidade Matriz\)/gi, '')
    .replace(/\s*\(Filial Golden\)/gi, '')
    .replace(/\s*Unidade Matriz/gi, '')
    .replace(/\s*Filial Golden/gi, '')
    .trim();
};

// Função auxiliar para verificar se um vendedor já existe na lista
const vendedorJaExiste = (nome: string, listaVendedores: VendedorBetel[]): boolean => {
  const nomeNormalizado = nome.toUpperCase();
  return listaVendedores.some(v => {
    const nomeVendedor = v.nome.toUpperCase();
    // Verificar se o nome contém as palavras-chave do vendedor
    const palavrasNome = nomeNormalizado.split(' ').filter(p => p.length > 2);
    return palavrasNome.every(palavra => nomeVendedor.includes(palavra));
  });
};

// Função para criar um vendedor vazio baseado no mapeamento
const criarVendedorVazio = (nome: string, id: string): VendedorBetel => {
  const nomeNormalizado = id.toLowerCase().replace(/[()-]/g, '');
  const lojaNome = nomeNormalizado.includes('golden') ? 'Filial Golden' : 'Unidade Matriz';
  const lojaId = nomeNormalizado.includes('golden') ? 'golden' : 'matriz';
  
  return {
    id: id,
    nome: `${nome} (${lojaNome})`,
    vendas: 0,
    faturamento: 0,
    ticketMedio: 0,
    lojaId: lojaId,
    lojaNome: lojaNome
  };
};

// Cores no estilo Material Design
const COLORS = [
  '#FFC107', // Amber 500
  '#2196F3', // Blue 500
  '#FF5722', // Deep Orange 500
  '#4CAF50', // Green 500
  '#9C27B0', // Purple 500
  '#F44336', // Red 500
  '#607D8B', // Blue Grey 500
  '#00BCD4', // Cyan 500
  '#009688', // Teal 500
  '#673AB7', // Deep Purple 500
];

export function VendedoresChartImproved({ 
  vendedores, 
  onVendedorClick, 
  vendas = [], 
  totalVendas = 0, 
  totalValor = 0, 
  ticketMedio = 0,
  mesSelecionado
}: VendedoresChartImprovedProps) {
  const [isClient, setIsClient] = useState(false);
  const { metas, loading: isLoadingMetas } = useMetas();
  const [metaAtual, setMetaAtual] = useState<Meta | null>(null);

  // Garantir que o componente só renderize completamente no cliente
  useEffect(() => {
    setIsClient(true);
  }, []);


  // Encontrar a meta do mês selecionado (ou mês atual se não fornecido)
  useEffect(() => {
    if (metas.length === 0) return;
    
    // Usar o mês selecionado no filtro ou o mês atual
    const mesParaBuscar = mesSelecionado 
      ? new Date(mesSelecionado.getFullYear(), mesSelecionado.getMonth(), 1)
      : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    
    // Tenta encontrar a meta para o mês selecionado
    let metaDoMesSelecionado = metas.find((meta) => {
      const mesRef = new Date(meta.mesReferencia);
      const match = mesRef.getMonth() === mesParaBuscar.getMonth() && 
             mesRef.getFullYear() === mesParaBuscar.getFullYear();
      return match;
    });
    
    // Se não encontrar meta para o mês selecionado, pega a meta mais recente
    if (!metaDoMesSelecionado && metas.length > 0) {
      metaDoMesSelecionado = metas.sort((a, b) => 
        new Date(b.mesReferencia).getTime() - new Date(a.mesReferencia).getTime()
      )[0];
    }
    
    setMetaAtual(metaDoMesSelecionado || null);
  }, [metas, mesSelecionado]);

  // Usar todos os vendedores do mapeamento, mesclando com os que têm vendas
  const vendedoresFiltrados = useMemo(() => {
    // Criar mapa de vendedores existentes (com vendas) para facilitar busca
    const vendedoresExistentes = new Map<string, VendedorBetel>();
    if (vendedores && vendedores.length > 0) {
      vendedores.forEach(v => {
        const nomeChave = v.nome.toUpperCase();
        vendedoresExistentes.set(nomeChave, v);
      });
    }
    
    // Lista final de vendedores
    const vendedoresCompletos: VendedorBetel[] = [];
    
    // Primeiro, adicionar todos os vendedores do mapeamento
    Object.entries(VENDEDORES_MAPEAMENTO).forEach(([nome, id]) => {
      // Verificar se já existe um vendedor com esse nome (com vendas)
      const vendedorExistente = Array.from(vendedoresExistentes.values()).find(v => {
        const nomeVendedor = v.nome.toUpperCase();
        const palavrasNome = nome.toUpperCase().split(' ').filter(p => p.length > 2);
        return palavrasNome.every(palavra => nomeVendedor.includes(palavra));
      });
      
      if (vendedorExistente) {
        // Se existe, usar o vendedor com vendas
        vendedoresCompletos.push(vendedorExistente);
      } else {
        // Se não existe, criar um vendedor vazio
        vendedoresCompletos.push(criarVendedorVazio(nome, id));
      }
    });
    
    // Se temos metas, verificar se há vendedores com metas que não estão no mapeamento
    if (metaAtual?.metasVendedores) {
      metaAtual.metasVendedores.forEach((metaVendedor: any) => {
        const nomeNormalizado = metaVendedor.vendedorId.toLowerCase().replace(/[()-]/g, '');
        
        // Mapear IDs de vendedores para nomes e lojas
        const vendedorInfo = (METAS_VENDEDORES_MAPEAMENTO as any)[metaVendedor.vendedorId] || 
          Object.entries(VENDEDORES_MAPEAMENTO).find(([nome, id]) => 
            id.toLowerCase().replace(/[()-]/g, '') === nomeNormalizado
          )?.[0];
        
        if (vendedorInfo) {
          const nomeVendedor = vendedorInfo;
          // Verificar se já existe na lista
          const jaExiste = vendedorJaExiste(nomeVendedor, vendedoresCompletos);
          
          if (!jaExiste) {
            // Determinar loja baseada no ID
            let lojaNome = 'Unidade Matriz';
            if (nomeNormalizado.includes('golden')) {
              lojaNome = 'Filial Golden';
            }
            
            vendedoresCompletos.push({
              id: metaVendedor.vendedorId,
              nome: `${nomeVendedor} (${lojaNome})`,
              vendas: 0,
              faturamento: 0,
              ticketMedio: 0,
              lojaId: nomeNormalizado.includes('golden') ? 'golden' : 'matriz',
              lojaNome: lojaNome
            });
          }
        }
      });
    }
    
    return vendedoresCompletos;
  }, [vendedores, metaAtual?.metasVendedores]);

  // Preparar dados para o componente, incluindo metas
  const dadosFormatados = useMemo(() => {
    if (!vendedoresFiltrados || vendedoresFiltrados.length === 0) return [];

    // Ordenar vendedores por valor de vendas (decrescente)
    const vendedoresOrdenados = [...vendedoresFiltrados]
      .sort((a, b) => b.faturamento - a.faturamento);

    // Calcular o total de vendas para referência percentual
    const totalVendas = vendedoresOrdenados.reduce((acc, curr) => acc + curr.faturamento, 0);

    // Preparar dados formatados com percentuais, metas e cores
    return vendedoresOrdenados.map((vendedor, index) => {
      const percentual = totalVendas > 0 ? (vendedor.faturamento / totalVendas) * 100 : 0;
      
      // Buscar meta do vendedor
      let metaVendedor = 0;
      let percentualMeta = 0;
      
      if (metaAtual?.metasVendedores) {
        // Gerar o ID do vendedor no formato correto
        const nomeNormalizado = vendedor.nome.toUpperCase();
        let vendedorId = "";
        
        // Caso especial para o Fernando (usa a meta de Coordenador)
        if (nomeNormalizado.includes("FERNANDO")) {
          metaVendedor = metaAtual.metaCoordenador;
        } else {
          // Buscar o ID exato do vendedor
          for (const [nome, id] of Object.entries(VENDEDORES_MAPEAMENTO)) {
            if (nomeNormalizado.includes(nome)) {
              vendedorId = id;
              break; // Sai do loop assim que encontrar o primeiro match
            }
          }

          if (vendedorId) {
            // Função auxiliar para extrair apenas o nome do vendedor do ID (removendo unidade)
            const extrairNomeDoId = (id: string): string => {
              return id
                .toLowerCase()
                .replace(/[()-]/g, '')
                .replace(/unidadematriz/g, '')
                .replace(/filialgolden/g, '')
                .trim();
            };

            // Buscar meta do vendedor - primeiro tentar match exato
            let vendedorMeta = metaAtual.metasVendedores.find((mv: any) => {
              const idNormalizado = mv.vendedorId.toLowerCase().replace(/[()-]/g, '');
              const vendedorIdNormalizado = vendedorId.toLowerCase().replace(/[()-]/g, '');
              return idNormalizado === vendedorIdNormalizado;
            });

            // Se não encontrou, tentar por nome (ignorando unidade)
            if (!vendedorMeta) {
              const nomeVendedorId = extrairNomeDoId(vendedorId);
              vendedorMeta = metaAtual.metasVendedores.find((mv: any) => {
                const nomeMetaId = extrairNomeDoId(mv.vendedorId);
                const match = nomeMetaId === nomeVendedorId && nomeMetaId.length > 0;
              return match;
            });
            }

            if (vendedorMeta) {
              metaVendedor = vendedorMeta.meta;
            } else {
              // Tentar buscar por nome direto no mapeamento de metas
              const metaPorNome = metaAtual.metasVendedores.find((mv: any) => {
                const nomeMeta = (METAS_VENDEDORES_MAPEAMENTO as any)[mv.vendedorId];
                return nomeMeta && nomeNormalizado.includes(nomeMeta);
              });
              
              if (metaPorNome) {
                metaVendedor = metaPorNome.meta;
              }
            }
          }
        }
        
        // Calcular percentual apenas se houver meta
        if (metaVendedor > 0) {
          percentualMeta = (vendedor.faturamento / metaVendedor) * 100;
        }
      }
      
      return {
        ...vendedor,
        valor: vendedor.faturamento,
        percentual: percentual,
        color: COLORS[index % COLORS.length],
        meta: metaVendedor,
        percentualMeta: percentualMeta
      };
    });
  }, [vendedoresFiltrados, metaAtual?.metasVendedores, metaAtual?.metaCoordenador]);

  // Calcular totais usando os dados recebidos como props (mesma fonte do DashboardSummary)
  // Se não fornecidos ou zerados, calcular a partir dos vendedores filtrados
  const totais = useMemo(() => {
    // Se as props foram fornecidas e não são zero, usar elas
    if (totalValor !== undefined && totalValor > 0 && totalVendas !== undefined && totalVendas > 0) {
      return {
        valorTotal: totalValor,
        vendasTotal: totalVendas
      };
    }
    
    // Caso contrário, calcular a partir dos vendedores filtrados
    const valorTotalCalculado = vendedoresFiltrados.reduce((acc, v) => acc + (v.faturamento || 0), 0);
    const vendasTotalCalculado = vendedoresFiltrados.reduce((acc, v) => acc + (v.vendas || 0), 0);
    
    return {
      valorTotal: valorTotalCalculado,
      vendasTotal: vendasTotalCalculado
    };
  }, [totalValor, totalVendas, vendedoresFiltrados]);

  if (!isClient) {
    return null; // Evita renderização no servidor
  }

  return (
    <div className="ios26-chart-container ios26-animate-fade-in">
      {/* Header - Responsivo */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-4 lg:mb-6">
        <div>
          <h3 className="flex items-center gap-2 lg:gap-3 text-lg lg:text-xl font-bold text-foreground">
            <div className="p-1.5 lg:p-2 bg-gradient-to-br from-orange-100 to-yellow-100 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-xl lg:rounded-2xl">
              <TrendingUp className="h-5 w-5 lg:h-6 lg:w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <span className="hidden lg:inline">Evolução Vendas vs Metas</span>
            <span className="lg:hidden">Vendedores</span>
          </h3>
          <p className="text-muted-foreground text-xs lg:text-sm mt-1 hidden lg:block">
            Acompanhamento de vendedores em relação às metas
          </p>
        </div>
        
        {/* Resumo de totais - Oculto no mobile */}
        <div className="text-right hidden lg:block">
          <div className="text-sm text-muted-foreground">
            Total: <span className="ios26-currency-small text-orange-600 dark:text-orange-400">{formatCurrency(totais.valorTotal)}</span>
          </div>
          <div className="text-xs text-muted-foreground">{totais.vendasTotal} vendas no período</div>
        </div>
      </div>
      
      {isLoadingMetas ? (
        <div className="flex items-center justify-center h-[300px]">
          <div className="ios26-skeleton h-8 w-48" />
        </div>
      ) : vendedoresFiltrados.length === 0 ? (
        <div className="flex items-center justify-center h-[300px]">
          <p className="text-muted-foreground">Carregando vendedores...</p>
        </div>
      ) : (
        <div className="space-y-3 lg:space-y-4 max-h-screen overflow-y-auto pr-1 custom-scrollbar">
          {dadosFormatados.map((vendedor, index) => (
            <div 
              key={vendedor.id} 
              className="group relative cursor-pointer bg-white dark:bg-gray-800 rounded-lg lg:ios26-card p-3 lg:p-4 shadow-sm lg:shadow-md transition-all duration-300 hover:shadow-lg"
              onClick={() => onVendedorClick && onVendedorClick(vendedor, index)}
              style={{ transform: 'translateZ(0)' }}
            >
              <div className="flex items-center gap-2 lg:gap-4">
                {/* Posição/Rank - Menor no mobile */}
                <div className={cn(
                  "flex-shrink-0 w-8 h-8 lg:w-10 lg:h-10 rounded-full lg:rounded-2xl flex items-center justify-center text-xs lg:text-sm font-bold shadow-sm transition-transform group-hover:scale-110",
                  index === 0 ? "bg-amber-500 lg:bg-gradient-to-br lg:from-yellow-400 lg:to-orange-500 text-white" : 
                  index === 1 ? "bg-blue-500 lg:bg-gradient-to-br lg:from-blue-400 lg:to-blue-600 text-white" : 
                  index === 2 ? "bg-orange-500 lg:bg-gradient-to-br lg:from-orange-400 lg:to-red-500 text-white" : 
                  "bg-gray-200 lg:bg-gradient-to-br lg:from-gray-200 lg:to-gray-300 text-gray-700 dark:bg-gray-700 lg:dark:from-gray-700 lg:dark:to-gray-600 dark:text-gray-300"
                )}>
                  {index + 1}
                </div>
                
                {/* Informações do vendedor */}
                <div className="flex-1 min-w-0">
                  <div className="font-medium lg:font-semibold text-foreground flex items-center gap-1.5 lg:gap-2">
                    <span className="truncate">{removerUnidadeDoNome(vendedor.nome)}</span>
                    {index < 3 && <BadgeCheck className="h-3.5 w-3.5 lg:h-4 lg:w-4 text-orange-500 flex-shrink-0" />}
                  </div>
                  <div className="text-xs lg:text-sm text-muted-foreground mt-0.5 lg:mt-1">
                    {vendedor.vendas} {vendedor.vendas === 1 ? 'venda' : 'vendas'}
                  </div>
                    
                  {/* Barra de progresso - Estilo simplificado no mobile */}
                  <div className="mt-2 lg:mt-3 ios26-progress">
                    <div 
                      className="ios26-progress-bar lg:ios26-progress-bar transition-all duration-500 group-hover:opacity-90 h-1.5 lg:h-2"
                      style={{ 
                        width: `${vendedor.meta > 0 ? Math.min(Math.max(vendedor.percentualMeta, 3), 100) : Math.max(vendedor.percentual, 3)}%`, 
                        backgroundColor: vendedor.meta > 0 
                          ? (vendedor.percentualMeta >= 100 
                              ? '#10B981' // Verde para meta atingida
                              : vendedor.percentualMeta >= 70 
                                ? '#F59E0B' // Amarelo para próximo da meta
                                : '#EF4444') // Vermelho para abaixo da meta
                          : vendedor.color, // Cor original se não há meta
                        boxShadow: '0 1px 3px rgba(0,0,0,0.12)'
                      }} 
                    />
                  </div>
                  
                  {/* Informações da meta */}
                  {vendedor.meta > 0 && (
                    <div className="mt-1.5 lg:mt-2 flex items-center justify-between text-xs">
                      <span className="flex items-center text-muted-foreground font-medium">
                        <Target className="h-3 w-3 mr-1 flex-shrink-0" />
                        <span className="hidden lg:inline">Meta: </span>
                        <span className="truncate">{formatCurrency(vendedor.meta)}</span>
                      </span>
                      <span className={cn(
                        "font-semibold flex-shrink-0 ml-2",
                        vendedor.percentualMeta >= 100 
                          ? "text-green-600 dark:text-green-400" 
                          : vendedor.percentualMeta >= 70 
                            ? "text-orange-600 dark:text-orange-400"
                            : "text-red-600 dark:text-red-400"
                      )}>
                        {vendedor.percentualMeta.toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Valor e percentual - Layout simplificado no mobile */}
                <div className="text-right flex-shrink-0">
                  <div className="text-sm lg:ios26-currency-medium font-bold lg:font-normal text-orange-600 dark:text-orange-400">
                    {formatCurrency(vendedor.valor)}
                  </div>
                  <div className="text-xs text-muted-foreground hidden lg:block">
                    {vendedor.meta > 0 
                      ? `${vendedor.percentualMeta.toFixed(1)}% da meta`
                      : `${vendedor.percentual.toFixed(1)}% do total`
                    }
                  </div>
                </div>
              </div>
            </div>
            ))}
          </div>
        )}
    </div>
  );
} 
