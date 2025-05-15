"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/app/_components/ui/card";
import { Progress } from "@/app/_components/ui/progress";
import { Skeleton } from "@/app/_components/ui/skeleton";
import { AlertCircle, TrendingUp, TrendingDown } from "lucide-react";
import { formatCurrency } from "@/app/_utils/format";
import { Vendedor } from "@/app/_services/betelTecnologia";

// Tipo para as metas dos vendedores
interface MetaVendedor {
  vendedorId: string;
  nome: string;
  meta: number;
}

// Tipo para meta completa
interface Meta {
  id: string;
  mesReferencia: string;
  metaMensal: number;
  metaSalvio: number;
  metaCoordenador: number;
  metasVendedores: MetaVendedor[];
}

// Tipo para dados de progresso
interface ProgressoVendedor {
  nome: string;
  meta: number;
  realizado: number;
  percentual: number;
  vendedorId: string;
}

export default function VendedoresMetaPodium({ 
  vendedores,
  filtrarVendedores = true
}: { 
  vendedores: Vendedor[];
  filtrarVendedores?: boolean;
}) {
  const [metas, setMetas] = useState<Meta[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  // Vendedores específicos que queremos monitorar
  const VENDEDORES_ALVO = useMemo(() => [
    "MARCUS", 
    "DIULY", 
    "BRUNA",
    "FERNANDO"
  ], []);

  // Buscar metas na API
  useEffect(() => {
    const fetchMetas = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/dashboard/metas");
        
        if (!response.ok) {
          throw new Error("Erro ao buscar metas");
        }
        
        const data = await response.json();
        
        // Ordenar por data mais recente
        const metasOrdenadas = Array.isArray(data) ? 
          data.sort((a, b) => new Date(b.mesReferencia).getTime() - new Date(a.mesReferencia).getTime()) : 
          [];
        
        setMetas(metasOrdenadas);
        setErro(null);
      } catch (error) {
        console.error("Erro ao buscar metas:", error);
        setErro("Não foi possível carregar as metas");
      } finally {
        setLoading(false);
      }
    };

    fetchMetas();
  }, []);

  // Calcular o progresso dos vendedores
  const progressoVendedores: ProgressoVendedor[] = useMemo(() => {
    if (!metas.length || !vendedores.length) return [];

    // Pegar a meta mais recente
    const metaRecente = metas[0];
    if (!metaRecente?.metasVendedores?.length) return [];

    // Filtrar vendedores pelos nomes específicos se necessário
    const vendedoresFiltrados = filtrarVendedores ? 
      vendedores.filter(v => 
        VENDEDORES_ALVO.some(nome => 
          v.nome?.toUpperCase().includes(nome.toUpperCase())
        )
      ) : 
      vendedores;

    // Mapear o progresso para cada vendedor
    const progresso = vendedoresFiltrados.map(vendedor => {
      // Encontrar a meta correspondente ao vendedor
      const metaVendedor = metaRecente.metasVendedores.find(
        mv => vendedor.nome?.toUpperCase().includes(mv.nome.toUpperCase())
      );

      const realizado = vendedor.faturamento || 0;
      const meta = metaVendedor?.meta || 0;
      const percentual = meta > 0 ? (realizado / meta) : 0;

      return {
        nome: vendedor.nome || "",
        meta,
        realizado,
        percentual,
        vendedorId: vendedor.id || ""
      };
    });

    // Ordenar por percentual de realização (decrescente)
    return progresso
      .filter(p => p.meta > 0) // Somente vendedores com meta definida
      .sort((a, b) => b.percentual - a.percentual);
  }, [metas, vendedores, VENDEDORES_ALVO, filtrarVendedores]);

  // Calcular média total de realização
  const mediaRealizacao = useMemo(() => {
    if (!progressoVendedores.length) return 0;
    
    const soma = progressoVendedores.reduce((acc, curr) => acc + curr.percentual, 0);
    return soma / progressoVendedores.length;
  }, [progressoVendedores]);

  // Verificar se dados estão disponíveis
  const semDados = !loading && progressoVendedores.length === 0;

  // Formatar data da meta mais recente
  const dataMetaFormatada = useMemo(() => {
    if (!metas.length) return "";
    
    const data = new Date(metas[0].mesReferencia);
    return data.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  }, [metas]);

  // Renderizar mensagem de erro
  if (erro) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Evolução de Metas</CardTitle>
          <CardDescription>Acompanhamento de vendedores</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-red-500 p-4 border border-red-200 rounded bg-red-50 dark:bg-red-950/30 dark:border-red-900">
            <AlertCircle size={18} />
            <span>{erro}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl font-bold">
              Evolução das Metas
            </CardTitle>
            <CardDescription className="mt-1">
              {dataMetaFormatada ? `Referência: ${dataMetaFormatada}` : "Acompanhamento de vendedores"}
            </CardDescription>
          </div>
          
          {!loading && !semDados && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-primary/10 text-sm">
              <span className="font-medium">Média:</span>
              <span className="font-bold">{Math.round(mediaRealizacao * 100)}%</span>
              {mediaRealizacao >= 1 ? (
                <TrendingUp size={14} className="text-green-500" />
              ) : (
                <TrendingDown size={14} className="text-red-500" />
              )}
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div className="space-y-4 py-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        ) : semDados ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Nenhum dado de meta disponível para os vendedores selecionados.</p>
          </div>
        ) : (
          <div className="space-y-5 py-2">
            {progressoVendedores.map((vendedor) => (
              <div key={vendedor.vendedorId} className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <div className="font-medium">{vendedor.nome}</div>
                  <div className="text-sm flex items-center gap-1.5">
                    <span className="font-semibold">
                      {Math.round(vendedor.percentual * 100)}%
                    </span>
                    <span className="text-muted-foreground">
                      ({formatCurrency(vendedor.realizado)} / {formatCurrency(vendedor.meta)})
                    </span>
                  </div>
                </div>
                
                <div className="relative pt-1">
                  <Progress 
                    value={vendedor.percentual * 100} 
                    className="h-4"
                    indicatorClassName={vendedor.percentual >= 1 ? "bg-green-500" : ""}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && !semDados && (
          <div className="text-center mt-6 text-xs text-muted-foreground">
            Dados baseados nas metas cadastradas em "/metas-vendas"
          </div>
        )}
      </CardContent>
    </Card>
  );
} 