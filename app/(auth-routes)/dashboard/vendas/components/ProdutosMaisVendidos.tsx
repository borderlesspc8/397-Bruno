import { useState, useEffect, useCallback, useMemo, memo } from "react";
import { Package, ShoppingBag, Dumbbell } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/app/_components/ui/card";
import { ProdutoDetalhesModal } from "./ProdutoDetalhesModal";
import { VendaDetalheModal } from "./VendaDetalheModal";

// Importações dos componentes refatorados
import { useProdutosMaisVendidos, ProdutoItem, OrdenacaoTipo, VisualizacaoTipo } from "./hooks/useProdutosMaisVendidos";
import { FiltrosInteligentes } from "./FiltrosInteligentes";
import { CategoriaCard } from "./CategoriaCard";

// Importar tipos centralizados
import { VendaItem } from '../types';

// Tipos para props
interface ProdutosMaisVendidosProps {
  dataInicio: Date;
  dataFim: Date;
  onVendaClick?: (venda: VendaItem) => void;
}

interface CategoriasExpandidas {
  equipamentos: boolean;
  acessorios: boolean;
  acessoriosEspeciais: boolean;
  acessoriosSextavados: boolean;
  acessoriosEmborrachados: boolean;
}

// Hook personalizado para detectar dispositivos móveis
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => {
      window.removeEventListener('resize', checkIsMobile);
    };
  }, []);
  
  return isMobile;
};

// Componente de loading memoizado
const LoadingComponent = memo(() => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Package className="h-5 w-5 text-amber-500" />
        Produtos e Acessórios Mais Vendidos
      </CardTitle>
      <CardDescription>Análise de produtos por categoria</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="flex items-center justify-center h-[300px]">
        <div className="text-center">
          <div 
            className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#faba33] mx-auto mb-4" 
            role="progressbar" 
            aria-label="Carregando dados dos produtos"
          />
          <p className="text-muted-foreground">Carregando produtos e acessórios mais vendidos...</p>
        </div>
      </div>
    </CardContent>
  </Card>
));

LoadingComponent.displayName = 'LoadingComponent';

// Componente de erro memoizado
const ErrorComponent = memo(({ erro }: { erro: string }) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Package className="h-5 w-5 text-amber-500" />
        Produtos e Acessórios Mais Vendidos
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="flex items-center justify-center h-[300px] text-red-500">
        <p>{erro}</p>
      </div>
    </CardContent>
  </Card>
));

ErrorComponent.displayName = 'ErrorComponent';

// Componente de estado vazio memoizado
const EmptyStateComponent = memo(() => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Package className="h-5 w-5 text-amber-500" />
        Produtos e Acessórios Mais Vendidos
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="flex items-center justify-center h-[300px]">
        <p className="text-muted-foreground">Nenhum produto ou acessório encontrado no período selecionado</p>
      </div>
    </CardContent>
  </Card>
));

EmptyStateComponent.displayName = 'EmptyStateComponent';

export const ProdutosMaisVendidos = memo(({ dataInicio, dataFim, onVendaClick }: ProdutosMaisVendidosProps) => {
  // Todos os hooks devem estar no topo, sem condições
  const isMobile = useIsMobile();

  // Usar o hook personalizado para gerenciamento de estado e lógica
  const {
    loading,
    erro,
    equipamentos,
    acessorios,
    acessoriosEspeciais,
    acessoriosSextavados,
    acessoriosEmborrachados,
    ordenacao,
    visualizacao,
    modalAberto,
    produtoSelecionado,
    vendaModalAberto,
    vendaSelecionada,
    ordenarProdutos,
    formatarDinheiro,
    formatarMargem,
    setModalAberto,
    setVendaModalAberto,
    mudarVisualizacao,
    mudarOrdenacao,
    abrirDetalhesProduto,
    abrirDetalhesVenda
  } = useProdutosMaisVendidos({ dataInicio, dataFim });

  // Estado para controlar quais categorias estão expandidas
  const [categoriasExpandidas, setCategoriasExpandidas] = useState<CategoriasExpandidas>({
    equipamentos: true,
    acessorios: true,
    acessoriosEspeciais: false,
    acessoriosSextavados: false,
    acessoriosEmborrachados: false
  });

  // Número máximo de itens a exibir por categoria
  const LIMITE_ITENS = useMemo(() => isMobile ? 10 : 15, [isMobile]);


  // Produtos ordenados memoizados
  const produtosOrdenados = useMemo(() => {
    const equipamentosOrdenados = ordenarProdutos(equipamentos, ordenacao, LIMITE_ITENS);
    const acessoriosOrdenados = ordenarProdutos(acessorios, ordenacao, LIMITE_ITENS);
    const acessoriosEspeciaisOrdenados = ordenarProdutos(acessoriosEspeciais, ordenacao, LIMITE_ITENS);
    const acessoriosSextavadosOrdenados = ordenarProdutos(acessoriosSextavados, ordenacao, LIMITE_ITENS);
    const acessoriosEmborrachadosOrdenados = ordenarProdutos(acessoriosEmborrachados, ordenacao, LIMITE_ITENS);

    return {
      equipamentos: equipamentosOrdenados,
      acessorios: acessoriosOrdenados,
      acessoriosEspeciais: acessoriosEspeciaisOrdenados,
      acessoriosSextavados: acessoriosSextavadosOrdenados,
      acessoriosEmborrachados: acessoriosEmborrachadosOrdenados
    };
  }, [
    equipamentos, 
    acessorios, 
    acessoriosEspeciais, 
    acessoriosSextavados, 
    acessoriosEmborrachados, 
    ordenacao, 
    LIMITE_ITENS, 
    ordenarProdutos
  ]);

  // Atualizar estado de categorias expandidas quando detectar mobile
  useEffect(() => {
    setCategoriasExpandidas(prev => ({
      ...prev,
      acessorios: !isMobile
    }));
  }, [isMobile]);

  // Função para alternar expansão de uma categoria
  const toggleCategoria = useCallback((categoria: keyof CategoriasExpandidas) => {
    setCategoriasExpandidas(prev => ({
      ...prev,
      [categoria]: !prev[categoria]
    }));
  }, []);

  // Handler para abrir detalhes da venda
  const handleVendaClick = useCallback((venda: VendaItem) => {
    if (onVendaClick) {
      onVendaClick(venda);
    } else {
      abrirDetalhesVenda(venda);
    }
  }, [onVendaClick, abrirDetalhesVenda]);

  // Renderização condicional para estados de loading e erro
  if (loading) {
    return <LoadingComponent />;
  }

  // Tratamento de erro
  if (erro && !equipamentos.length && !acessorios.length) {
    return <ErrorComponent erro={erro} />;
  }

  // Caso não existam produtos
  if (equipamentos.length === 0 && acessorios.length === 0) {
    return <EmptyStateComponent />;
  }

  return (
    <Card className="shadow-lg bg-card/95 backdrop-blur-sm border-0">
      <CardHeader className={`pb-2 ${isMobile ? 'px-3' : 'px-6'}`}>
        <div className="flex flex-wrap justify-between items-center">
          <div>
            <CardTitle className={`flex items-center gap-2 ${isMobile ? 'text-lg' : 'text-xl'} font-semibold`}>
              <Package className={`${isMobile ? 'h-5 w-5' : 'h-6 w-6'} text-amber-500`} />
              Produtos e Acessórios Mais Vendidos
            </CardTitle>
            <CardDescription className={`${isMobile ? 'text-sm' : 'text-base'} mt-1 text-muted-foreground`}>
              Análise detalhada por categoria no período selecionado
            </CardDescription>
            {erro && (
              <div className="mt-2 text-xs p-2 bg-amber-50 border border-amber-200 rounded-md text-amber-800 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-200">
                <p>{erro}</p>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className={isMobile ? 'px-3' : 'px-6'}>
        {/* Filtros inteligentes */}
        <FiltrosInteligentes 
          ordenacao={ordenacao}
          visualizacao={visualizacao}
          onChangeOrdenacao={mudarOrdenacao}
          onChangeVisualizacao={mudarVisualizacao}
        />

        {/* Equipamentos */}
        <CategoriaCard
          titulo="Equipamentos mais vendidos"
          icone={<Package className="h-5 w-5 text-amber-500" />}
          produtos={produtosOrdenados.equipamentos}
          corGrafico="rgba(54, 162, 235, 0.8)"
          ordenacao={ordenacao}
          visualizacao={visualizacao}
          formatarDinheiro={formatarDinheiro}
          formatarMargem={formatarMargem}
          onItemClick={abrirDetalhesProduto}
          expanded={categoriasExpandidas.equipamentos}
          onToggleExpand={() => toggleCategoria('equipamentos')}
        />
        
        {/* Acessórios */}
        <CategoriaCard
          titulo="Acessórios mais vendidos"
          icone={<ShoppingBag className="h-5 w-5 text-red-500" />}
          produtos={produtosOrdenados.acessorios}
          corGrafico="rgba(255, 99, 132, 0.8)"
          ordenacao={ordenacao}
          visualizacao={visualizacao}
          formatarDinheiro={formatarDinheiro}
          formatarMargem={formatarMargem}
          onItemClick={abrirDetalhesProduto}
          expanded={categoriasExpandidas.acessorios}
          onToggleExpand={() => toggleCategoria('acessorios')}
        />
        
        {/* Acessórios especiais */}
        {produtosOrdenados.acessoriosEspeciais.length > 0 && (
          <CategoriaCard
            titulo="Acessórios especiais (Anilhas, Halteres, etc.)"
            icone={<Dumbbell className="h-5 w-5 text-purple-500" />}
            produtos={produtosOrdenados.acessoriosEspeciais}
            corGrafico="rgba(153, 102, 255, 0.8)"
            ordenacao={ordenacao}
            visualizacao={visualizacao}
            formatarDinheiro={formatarDinheiro}
            formatarMargem={formatarMargem}
            onItemClick={abrirDetalhesProduto}
            expanded={categoriasExpandidas.acessoriosEspeciais}
            onToggleExpand={() => toggleCategoria('acessoriosEspeciais')}
          />
        )}
        
        {/* Acessórios sextavados */}
        {produtosOrdenados.acessoriosSextavados.length > 0 && (
          <CategoriaCard
            titulo="Halteres Sextavados"
            icone={<Dumbbell className="h-5 w-5 text-blue-500" />}
            produtos={produtosOrdenados.acessoriosSextavados}
            corGrafico="rgba(75, 192, 192, 0.8)"
            ordenacao={ordenacao}
            visualizacao={visualizacao}
            formatarDinheiro={formatarDinheiro}
            formatarMargem={formatarMargem}
            onItemClick={abrirDetalhesProduto}
            expanded={categoriasExpandidas.acessoriosSextavados}
            onToggleExpand={() => toggleCategoria('acessoriosSextavados')}
          />
        )}
        
        {/* Acessórios emborrachados */}
        {produtosOrdenados.acessoriosEmborrachados.length > 0 && (
          <CategoriaCard
            titulo="Halteres Emborrachados"
            icone={<Dumbbell className="h-5 w-5 text-green-500" />}
            produtos={produtosOrdenados.acessoriosEmborrachados}
            corGrafico="rgba(129, 199, 132, 0.8)"
            ordenacao={ordenacao}
            visualizacao={visualizacao}
            formatarDinheiro={formatarDinheiro}
            formatarMargem={formatarMargem}
            onItemClick={abrirDetalhesProduto}
            expanded={categoriasExpandidas.acessoriosEmborrachados}
            onToggleExpand={() => toggleCategoria('acessoriosEmborrachados')}
          />
        )}
        
        {/* Modal de detalhes do produto */}
        {modalAberto && produtoSelecionado && (
          <ProdutoDetalhesModal
            produto={produtoSelecionado}
            open={modalAberto}
            onOpenChange={setModalAberto}
            dataInicio={dataInicio}
            dataFim={dataFim}
            onVendaClick={handleVendaClick}
          />
        )}
        
        {/* Modal de detalhes da venda - renderizar apenas quando não tiver onVendaClick externo */}
        {!onVendaClick && vendaModalAberto && vendaSelecionada && (
          <VendaDetalheModal
            venda={vendaSelecionada}
            aberto={vendaModalAberto}
            onOpenChange={setVendaModalAberto}
          />
        )}
      </CardContent>
    </Card>
  );
});

ProdutosMaisVendidos.displayName = 'ProdutosMaisVendidos'; 