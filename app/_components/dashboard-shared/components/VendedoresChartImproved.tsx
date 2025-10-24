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
  ticketMedio = 0 
}: VendedoresChartImprovedProps) {
  const [isClient, setIsClient] = useState(false);
  const { metas, loading: isLoadingMetas } = useMetas();
  const [metaAtual, setMetaAtual] = useState<Meta | null>(null);

  // Garantir que o componente só renderize completamente no cliente
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Encontrar a meta atual (mês atual ou mais recente)
  useEffect(() => {
    if (metas.length === 0) return;
    
    console.log('🔍 Metas disponíveis:', metas.map(m => ({
      id: m.id,
      mes: m.mesReferencia,
      vendedores: m.metasVendedores?.length || 0
    })));
    
    const hoje = new Date();
    const mesAtual = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    
    console.log('📅 Mês atual:', mesAtual);
    
    // Tenta encontrar a meta para o mês atual
    let metaDoMesAtual = metas.find((meta) => {
      const mesRef = new Date(meta.mesReferencia);
      const match = mesRef.getMonth() === mesAtual.getMonth() && 
             mesRef.getFullYear() === mesAtual.getFullYear();
      console.log(`🔍 Verificando meta ${meta.id}:`, {
        mesRef,
        mesAtual,
        match
      });
      return match;
    });
    
    // Se não encontrar meta para o mês atual, pega a meta mais recente
    if (!metaDoMesAtual && metas.length > 0) {
      console.log('⚠️ Meta do mês atual não encontrada, usando meta mais recente');
      metaDoMesAtual = metas.sort((a, b) => 
        new Date(b.mesReferencia).getTime() - new Date(a.mesReferencia).getTime()
      )[0];
    }
    
    console.log('✅ Meta selecionada:', metaDoMesAtual ? {
      id: metaDoMesAtual.id,
      mes: metaDoMesAtual.mesReferencia,
      vendedores: metaDoMesAtual.metasVendedores?.length || 0,
      metasVendedores: metaDoMesAtual.metasVendedores
    } : 'Nenhuma');
    
    setMetaAtual(metaDoMesAtual || null);
  }, [metas]);

  // Usar todos os vendedores sem filtro e incluir vendedores com metas mesmo sem vendas
  const vendedoresFiltrados = useMemo(() => {
    if (!vendedores || vendedores.length === 0) return [];
    
    // Log para debug
    console.log('🔍 [VendedoresChartImproved] Vendedores recebidos:', {
      totalVendedores: vendedores.length,
      vendedores: vendedores.map(v => ({
        id: v.id,
        nome: v.nome,
        vendas: v.vendas,
        faturamento: v.faturamento
      }))
    });
    
    // Se temos metas, verificar se há vendedores com metas que não apareceram nas vendas
    if (metaAtual?.metasVendedores) {
      // Adicionar vendedores que têm metas mas não apareceram nas vendas
      const vendedoresAdicionais: VendedorBetel[] = [];
      
      // Mapear vendedores existentes para facilitar verificação
      const vendedoresExistentes = new Map(
        vendedores.map(v => [v.nome.toUpperCase(), v])
      );
      
      // Verificar cada vendedor com meta
      console.log('🔍 Verificando vendedores com metas:', metaAtual.metasVendedores);
      
      metaAtual.metasVendedores.forEach((metaVendedor: any) => {
        const nomeNormalizado = metaVendedor.vendedorId.toLowerCase().replace(/[()-]/g, '');
        console.log(`🔍 Processando vendedor: ${metaVendedor.vendedorId} -> ${nomeNormalizado}`);
        
        // Mapear IDs de vendedores para nomes e lojas
        const vendedorInfo = (METAS_VENDEDORES_MAPEAMENTO as any)[metaVendedor.vendedorId] || 
          Object.entries(VENDEDORES_MAPEAMENTO).find(([nome, id]) => 
            id.toLowerCase().replace(/[()-]/g, '') === nomeNormalizado
          )?.[0];
        
        console.log(`🔍 Vendedor info encontrada:`, vendedorInfo);
        
        if (vendedorInfo) {
          const nomeVendedor = vendedorInfo;
          const jaExiste = Array.from(vendedoresExistentes.keys()).some(nome => 
            nome.includes(nomeVendedor.split(' ')[0]) && 
            nome.includes(nomeVendedor.split(' ')[1])
          );
          
          console.log(`🔍 Vendedor ${nomeVendedor} já existe nas vendas:`, jaExiste);
          
          if (!jaExiste) {
            // Determinar loja baseada no ID
            let lojaNome = 'Unidade Matriz';
            if (nomeNormalizado.includes('golden')) {
              lojaNome = 'Filial Golden';
            }
            
            console.log(`➕ Adicionando vendedor ${nomeVendedor} (${lojaNome})`);
            
            vendedoresAdicionais.push({
              id: metaVendedor.vendedorId,
              nome: `${nomeVendedor} (${lojaNome})`,
              vendas: 0,
              faturamento: 0,
              ticketMedio: 0,
              lojaId: nomeNormalizado.includes('golden') ? 'golden' : 'matriz',
              lojaNome: lojaNome
            });
          }
        } else {
          console.log(`⚠️ Vendedor ${metaVendedor.vendedorId} não encontrado no mapeamento`);
        }
      });
      
      // Adicionar vendedores adicionais à lista
      const resultado = [...vendedores, ...vendedoresAdicionais];
      
      console.log('✅ [VendedoresChartImproved] Vendedores finais:', {
        totalVendedores: resultado.length,
        vendedoresComVendas: resultado.filter(v => v.vendas > 0).length,
        vendedoresSemVendas: resultado.filter(v => v.vendas === 0).length
      });
      
      return resultado;
    }
    
    return vendedores;
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
        
        console.log(`🔍 Buscando meta para vendedor: ${vendedor.nome} (${nomeNormalizado})`);
        
        // Caso especial para o Fernando (usa a meta de Coordenador)
        if (nomeNormalizado.includes("FERNANDO")) {
          metaVendedor = metaAtual.metaCoordenador;
          console.log(`✅ Fernando - Meta coordenador: ${metaVendedor}`);
        } else {
          // Buscar o ID exato do vendedor
          for (const [nome, id] of Object.entries(VENDEDORES_MAPEAMENTO)) {
            if (nomeNormalizado.includes(nome)) {
              vendedorId = id;
              console.log(`✅ Encontrado ID para ${vendedor.nome}: ${vendedorId}`);
              break; // Sai do loop assim que encontrar o primeiro match
            }
          }

          if (vendedorId) {
            // Buscar meta do vendedor pelo ID exato
            const vendedorMeta = metaAtual.metasVendedores.find((mv: any) => {
              const idNormalizado = mv.vendedorId.toLowerCase().replace(/[()-]/g, '');
              const vendedorIdNormalizado = vendedorId.toLowerCase().replace(/[()-]/g, '');
              const match = idNormalizado === vendedorIdNormalizado;
              console.log(`🔍 Comparando: ${idNormalizado} === ${vendedorIdNormalizado} = ${match}`);
              return match;
            });

            if (vendedorMeta) {
              metaVendedor = vendedorMeta.meta;
              console.log(`✅ Meta encontrada para ${vendedor.nome}: ${metaVendedor}`);
            } else {
              // Tentar buscar por nome direto no mapeamento de metas
              const metaPorNome = metaAtual.metasVendedores.find((mv: any) => {
                const nomeMeta = (METAS_VENDEDORES_MAPEAMENTO as any)[mv.vendedorId];
                return nomeMeta && nomeNormalizado.includes(nomeMeta);
              });
              
              if (metaPorNome) {
                metaVendedor = metaPorNome.meta;
                console.log(`✅ Meta encontrada por nome para ${vendedor.nome}: ${metaVendedor}`);
              } else {
                console.log(`⚠️ Meta não encontrada para ${vendedor.nome} (ID: ${vendedorId})`);
              }
            }
          } else {
            console.log(`⚠️ Não foi possível determinar o ID para ${vendedor.nome}`);
          }
        }
        
        // Calcular percentual apenas se houver meta
        if (metaVendedor > 0) {
          percentualMeta = (vendedor.faturamento / metaVendedor) * 100;
        }
      } else {
        console.log(`⚠️ Nenhuma meta disponível para ${vendedor.nome}`);
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
  const totais = useMemo(() => {
    // Usar os dados recebidos como props em vez de calcular localmente
    return {
      valorTotal: totalValor,
      vendasTotal: totalVendas
    };
  }, [totalValor, totalVendas]);

  if (!isClient) {
    return null; // Evita renderização no servidor
  }

  return (
    <div className="ios26-chart-container ios26-animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="flex items-center gap-3 text-xl font-bold text-foreground">
            <div className="p-2 bg-gradient-to-br from-orange-100 to-yellow-100 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-2xl">
              <TrendingUp className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            Evolução Vendas vs Metas
          </h3>
          <p className="text-muted-foreground text-sm mt-1">
            Acompanhamento de vendedores em relação às metas
          </p>
        </div>
        
        {/* Resumo de totais */}
        <div className="text-right">
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
          <p className="text-muted-foreground">Nenhum vendedor encontrado no período selecionado</p>
        </div>
      ) : (
        <div className="space-y-4 max-h-screen overflow-y-auto pr-1 custom-scrollbar">
          {dadosFormatados.map((vendedor, index) => (
            <div 
              key={vendedor.id} 
              className="group relative cursor-pointer ios26-card p-4 transition-all duration-300 hover:shadow-lg"
              onClick={() => onVendedorClick && onVendedorClick(vendedor, index)}
              style={{ transform: 'translateZ(0)' }}
            >
              <div className="flex items-center gap-4">
                {/* Posição/Rank */}
                <div className={cn(
                  "flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-bold shadow-sm transition-transform group-hover:scale-110",
                  index === 0 ? "bg-gradient-to-br from-yellow-400 to-orange-500 text-white" : 
                  index === 1 ? "bg-gradient-to-br from-blue-400 to-blue-600 text-white" : 
                  index === 2 ? "bg-gradient-to-br from-orange-400 to-red-500 text-white" : 
                  "bg-gradient-to-br from-gray-200 to-gray-300 text-gray-700 dark:from-gray-700 dark:to-gray-600 dark:text-gray-300"
                )}>
                  {index + 1}
                </div>
                
                {/* Informações do vendedor */}
                <div className="flex-1">
                  <div className="font-semibold text-foreground flex items-center gap-2">
                    {vendedor.nome}
                    {index < 3 && <BadgeCheck className="h-4 w-4 text-orange-500" />}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {vendedor.vendas} {vendedor.vendas === 1 ? 'venda' : 'vendas'}
                    {vendedor.lojaNome && ` • ${vendedor.lojaNome}`}
                  </div>
                    
                  {/* Barra de progresso de vendas totais - agora baseada na meta */}
                  <div className="mt-3 ios26-progress">
                    <div 
                      className="ios26-progress-bar transition-all duration-500 group-hover:opacity-90"
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
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className="flex items-center text-muted-foreground font-medium">
                        <Target className="h-3 w-3 mr-1" /> Meta: {formatCurrency(vendedor.meta)}
                      </span>
                      <span className={cn(
                        "font-semibold",
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
                
                {/* Valor e percentual */}
                <div className="text-right">
                  <div className="ios26-currency-medium text-orange-600 dark:text-orange-400">
                    {formatCurrency(vendedor.valor)}
                  </div>
                  <div className="text-xs text-muted-foreground">
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
