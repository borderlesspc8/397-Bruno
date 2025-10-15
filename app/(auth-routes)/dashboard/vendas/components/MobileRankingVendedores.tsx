import { useState, useEffect, useMemo } from 'react';
import { formatCurrency } from '@/app/_utils/format';
import { Target } from 'lucide-react';
import { cn } from '@/app/_lib/utils';
import { Vendedor } from '@/app/_services/betelTecnologia';
import { useMetas } from '@/app/_hooks/useMetas';


// Interface para vendedor com metas
interface VendedorComMeta extends Vendedor {
  meta: number;
  percentualMeta: number;
}

interface MobileRankingVendedoresProps {
  vendedores: Vendedor[];
  onVendedorClick?: (vendedor: Vendedor, index?: number) => void;
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

export function MobileRankingVendedores({ vendedores, onVendedorClick }: MobileRankingVendedoresProps) {
  const { metas, loading: isLoadingMetas } = useMetas();
  const [metaAtual, setMetaAtual] = useState<Meta | null>(null);

  // Encontrar a meta atual (mês atual ou mais recente)
  useEffect(() => {
    if (metas.length === 0) return;
    
    const hoje = new Date();
    const mesAtual = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    
    // Tenta encontrar a meta para o mês atual
    let metaDoMesAtual = metas.find((meta) => {
      const mesRef = new Date(meta.mesReferencia);
      return mesRef.getMonth() === mesAtual.getMonth() && 
             mesRef.getFullYear() === mesAtual.getFullYear();
    });
    
    // Se não encontrar meta para o mês atual, pega a meta mais recente
    if (!metaDoMesAtual && metas.length > 0) {
      metaDoMesAtual = metas.sort((a, b) => 
        new Date(b.mesReferencia).getTime() - new Date(a.mesReferencia).getTime()
      )[0];
    }
    
    setMetaAtual(metaDoMesAtual || null);
  }, [metas]);

  // Preparar dados dos vendedores com metas
  const vendedoresComMetas = useMemo(() => {
    if (!vendedores || !metaAtual) return vendedores as VendedorComMeta[];

    return vendedores.map(vendedor => {
      let metaVendedor = 0;
      let percentualMeta = 0;

      if (metaAtual?.metasVendedores) {
        const nomeNormalizado = vendedor.nome.toUpperCase();
        let vendedorId = "";
        
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
            // Buscar meta do vendedor pelo ID exato
            const vendedorMeta = metaAtual.metasVendedores.find(mv => {
              const idNormalizado = mv.vendedorId.toLowerCase().replace(/[()-]/g, '');
              const vendedorIdNormalizado = vendedorId.toLowerCase().replace(/[()-]/g, '');
              return idNormalizado === vendedorIdNormalizado;
            });

            if (vendedorMeta) {
              metaVendedor = vendedorMeta.meta;
            }
          } else {
            console.log(`📱 ⚠️ Não foi possível determinar o ID para ${vendedor.nome}`);
          }
        }
        
        if (metaVendedor > 0) {
          percentualMeta = (vendedor.faturamento / metaVendedor) * 100;
        }
      }

      return {
        ...vendedor,
        meta: metaVendedor,
        percentualMeta: percentualMeta
      } as VendedorComMeta;
    });
  }, [vendedores, metaAtual?.metasVendedores, metaAtual?.metaCoordenador]);

  if (isLoadingMetas) {
    return <div className="text-center py-4">Carregando dados...</div>;
  }

  return (
    <div className="space-y-4">
      {vendedoresComMetas.map((vendedor: VendedorComMeta, index) => (
        <div key={vendedor.id} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
              index === 0 ? "bg-amber-500 text-white" :
              index === 1 ? "bg-blue-500 text-white" :
              index === 2 ? "bg-orange-500 text-white" :
              "bg-gray-200 text-gray-700"
            )}>
              {index + 1}
            </div>
            <div className="flex-1">
              <div className="font-medium">{vendedor.nome}</div>
              <div className="text-sm text-gray-500">
                {vendedor.vendas} {vendedor.vendas === 1 ? 'venda' : 'vendas'}
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold">{formatCurrency(vendedor.faturamento)}</div>
            </div>
          </div>
          
          {/* Exibição da meta */}
          {vendedor.meta > 0 && (
            <div className="mt-2">
              <div className="flex justify-between items-center text-xs text-gray-600 dark:text-gray-400">
                <span className="flex items-center">
                  <Target className="h-3 w-3 mr-1" />
                  Meta: {formatCurrency(vendedor.meta)}
                </span>
                <span className={cn(
                  "font-medium",
                  vendedor.percentualMeta >= 100 
                    ? "text-green-600 dark:text-green-400"
                    : vendedor.percentualMeta >= 70 
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-red-600 dark:text-red-400"
                )}>
                  {vendedor.percentualMeta.toFixed(1)}%
                </span>
              </div>
              <div className="mt-1 w-full h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    vendedor.percentualMeta >= 100 
                      ? "bg-green-500"
                      : vendedor.percentualMeta >= 70 
                        ? "bg-amber-500"
                        : "bg-red-500"
                  )}
                  style={{ 
                    width: `${Math.min(Math.max(vendedor.percentualMeta, 3), 100)}%`
                  }} 
                />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
} 
