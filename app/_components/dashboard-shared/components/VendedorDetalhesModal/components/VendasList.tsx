import { useState, useMemo } from "react";
import { Button } from "@/app/_components/ui/button";
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from '@/app/_components/ui/pagination';
import { BarChart2, ArrowDown, ArrowUp } from "lucide-react";
import { formatarDataBrasileira, extrairDadosVenda } from "../utils";
import { ITENS_POR_PAGINA } from "../constants";

interface VendasListProps {
  vendas: any[];
  loading: boolean;
  erro: string | null;
  onVendaClick: (venda: any) => void;
}

export function VendasList({ vendas, loading, erro, onVendaClick }: VendasListProps) {
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [ordenacaoValor, setOrdenacaoValor] = useState<'maior-menor' | 'menor-maior'>('maior-menor');

  const ordenarVendasPorValor = (vendas: any[]) => {
    return [...vendas].sort((a, b) => {
      const { valorTotal: valorAStr } = extrairDadosVenda(a);
      const { valorTotal: valorBStr } = extrairDadosVenda(b);
      const valorA = parseFloat(valorAStr) || 0;
      const valorB = parseFloat(valorBStr) || 0;
      
      if (ordenacaoValor === 'maior-menor') {
        return valorB - valorA;
      } else {
        return valorA - valorB;
      }
    });
  };

  const alternarOrdenacao = () => {
    const novaOrdenacao = ordenacaoValor === 'maior-menor' ? 'menor-maior' : 'maior-menor';
    setOrdenacaoValor(novaOrdenacao);
    setPaginaAtual(1);
  };

  const vendasOrdenadas = useMemo(() => ordenarVendasPorValor(vendas), [vendas, ordenacaoValor]);
  const indiceInicial = (paginaAtual - 1) * ITENS_POR_PAGINA;
  const indiceFinal = indiceInicial + ITENS_POR_PAGINA;
  const totalPaginas = Math.ceil((vendasOrdenadas?.length || 0) / ITENS_POR_PAGINA);
  const vendasPaginadas = vendasOrdenadas.slice(indiceInicial, indiceFinal);

  const irParaPaginaAnterior = () => {
    if (paginaAtual > 1) {
      setPaginaAtual(paginaAtual - 1);
    }
  };

  const irParaProximaPagina = () => {
    if (paginaAtual < totalPaginas) {
      setPaginaAtual(paginaAtual + 1);
    }
  };

  return (
    <div className="ios26-card p-6 mt-4">
      <div className="flex justify-between items-center mb-6">
        <h4 className="text-lg font-bold flex items-center gap-2">
          <BarChart2 className="h-5 w-5 text-[hsl(var(--orange-primary))]" />
          Vendas Realizadas
        </h4>
        
        <Button
          variant="outline"
          size="sm"
          onClick={alternarOrdenacao}
          className="flex items-center gap-2 rounded-xl border-[hsl(var(--orange-primary))]/30 hover:bg-[hsl(var(--orange-light))] hover:border-[hsl(var(--orange-primary))] transition-all duration-300 shadow-sm"
        >
          <span className="text-sm font-medium">Valor</span>
          {ordenacaoValor === 'maior-menor' ? (
            <ArrowDown className="h-4 w-4 text-[hsl(var(--orange-primary))]" />
          ) : (
            <ArrowUp className="h-4 w-4 text-[hsl(var(--orange-primary))]" />
          )}
        </Button>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center h-[150px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[hsl(var(--orange-primary))] mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground font-medium">Carregando vendas...</p>
          </div>
        </div>
      ) : erro ? (
        <div className="flex items-center justify-center h-[100px] text-[hsl(var(--destructive))]">
          <p className="text-sm font-medium">{erro}</p>
        </div>
      ) : vendas.length === 0 ? (
        <div className="flex items-center justify-center h-[100px]">
          <p className="text-sm text-muted-foreground font-medium">Nenhuma venda encontrada no período</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="overflow-auto max-h-[250px] rounded-xl border border-border/50">
            <table className="w-full text-sm">
              <thead className="text-xs bg-gradient-to-r from-[hsl(var(--orange-light))] to-[hsl(var(--yellow-light))] border-b border-border sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Data</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Cliente</th>
                  <th className="px-4 py-3 text-right font-semibold text-foreground">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {vendasPaginadas.map((venda, index) => {
                  const { dataVenda, nomeCliente, valorTotal } = extrairDadosVenda(venda);
                  return (
                    <tr 
                      key={index} 
                      className="hover:bg-[hsl(var(--orange-light))]/30 cursor-pointer transition-colors duration-200" 
                      onClick={() => onVendaClick(venda)}
                    >
                      <td className="px-4 py-3 text-muted-foreground font-medium">
                        {formatarDataBrasileira(dataVenda || '')}
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground">{nomeCliente}</td>
                      <td className="px-4 py-3 text-right font-bold text-[hsl(var(--orange-primary))] ios26-currency-small">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(valorTotal) || 0)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {totalPaginas > 1 && (
            <Pagination className="mt-4">
              <PaginationContent className="flex items-center gap-2">
                <PaginationItem>
                  <PaginationPrevious 
                    href="#"
                    onClick={irParaPaginaAnterior} 
                    className={`rounded-xl transition-all duration-300 ${
                      paginaAtual === 1 
                        ? "pointer-events-none opacity-50 cursor-not-allowed" 
                        : "cursor-pointer hover:bg-[hsl(var(--orange-light))] hover:border-[hsl(var(--orange-primary))]"
                    }`}
                  />
                </PaginationItem>
                <PaginationItem>
                  <span className="text-sm font-semibold px-4 py-2 bg-[hsl(var(--orange-light))] rounded-xl text-[hsl(var(--orange-primary))]">
                    {paginaAtual} de {totalPaginas}
                  </span>
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext 
                    href="#"
                    onClick={irParaProximaPagina}
                    className={`rounded-xl transition-all duration-300 ${
                      paginaAtual === totalPaginas 
                        ? "pointer-events-none opacity-50 cursor-not-allowed" 
                        : "cursor-pointer hover:bg-[hsl(var(--orange-light))] hover:border-[hsl(var(--orange-primary))]"
                    }`}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </div>
      )}
    </div>
  );
}

