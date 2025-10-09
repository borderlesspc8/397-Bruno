import { useState, useEffect } from "react";
import { ProdutosService } from "@/app/_services/produtos";

interface ProdutosExternosPanelProps {
  dataInicio: Date;
  dataFim: Date;
}

export function ProdutosExternosPanel({ dataInicio, dataFim }: ProdutosExternosPanelProps) {
  const [produtos, setProdutos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  
  useEffect(() => {
    const buscarProdutos = async () => {
      try {
        setLoading(true);
        setErro(null);
        
        // Buscar produtos externos
        const response = await ProdutosService.buscarProdutosExternos({
          dataInicio,
          dataFim
        });
        
        if (response.erro) {
          throw new Error(response.erro);
        }
        
        setProdutos(response.produtos || []);
        console.log('Produtos externos recebidos:', response.produtos?.length || 0);
      } catch (error) {
        console.error('Erro ao buscar produtos externos:', error);
        setErro(error instanceof Error ? error.message : 'Erro ao buscar produtos externos');
      } finally {
        setLoading(false);
      }
    };
    
    buscarProdutos();
  }, [dataInicio, dataFim]);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[300px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#faba33] mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando produtos externos...</p>
        </div>
      </div>
    );
  }
  
  if (erro) {
    return (
      <div className="flex items-center justify-center h-[300px] text-red-500">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <p>{erro}</p>
        </div>
      </div>
    );
  }
  
  if (produtos.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px]">
        <p className="text-muted-foreground">Nenhum produto externo encontrado no período selecionado</p>
      </div>
    );
  }
  
  return (
    <div className="overflow-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b text-left">
            <th className="pb-2">Produto</th>
            <th className="pb-2">Categoria</th>
            <th className="pb-2 text-right">Preço</th>
            <th className="pb-2 text-right">Qtd</th>
            <th className="pb-2 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {produtos.map((produto, index) => (
            <tr key={index} className="border-b last:border-0 hover:bg-muted/50">
              <td className="py-3">{produto.nome}</td>
              <td className="py-3">{produto.categoria || 'N/A'}</td>
              <td className="py-3 text-right">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(produto.precoUnitario)}
              </td>
              <td className="py-3 text-right">{produto.quantidade}</td>
              <td className="py-3 text-right">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(produto.total)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 