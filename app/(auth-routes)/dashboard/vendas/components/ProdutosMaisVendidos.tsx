import { useState, useEffect } from "react";
import { Package } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/app/_components/ui/card";
import { useSession } from "next-auth/react";
import { ProdutoDetalhesModal } from "./ProdutoDetalhesModal";
import { VendaDetalheModal } from "./VendaDetalheModal";

// Importações dos componentes refatorados
import { useProdutosMaisVendidos, ProdutoItem } from "./hooks/useProdutosMaisVendidos";
import { FiltrosInteligentes } from "./FiltrosInteligentes";
import { CategoriaCard } from "./CategoriaCard";
import { ShoppingBag, Dumbbell } from "lucide-react";

// Tipos para props
interface ProdutosMaisVendidosProps {
  dataInicio: Date;
  dataFim: Date;
  onVendaClick?: (venda: any) => void;
}

export function ProdutosMaisVendidos({ dataInicio, dataFim, onVendaClick }: ProdutosMaisVendidosProps) {
  // Estado para armazenar se estamos em um dispositivo móvel
  const [isMobile, setIsMobile] = useState(false);
  
  // Detectar tela mobile
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Verificar na primeira renderização
    checkIsMobile();
    
    // Verificar quando a tela for redimensionada
    window.addEventListener('resize', checkIsMobile);
    
    // Limpar o evento quando o componente for desmontado
    return () => {
      window.removeEventListener('resize', checkIsMobile);
    };
  }, []);

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
  // Em dispositivos móveis, expandir apenas a primeira por padrão
  const [categoriasExpandidas, setCategoriasExpandidas] = useState({
    equipamentos: true,
    acessorios: !isMobile,
    acessoriosEspeciais: false,
    acessoriosSextavados: false,
    acessoriosEmborrachados: false
  });

  // Atualizar estado de categorias expandidas quando detectar mobile
  useEffect(() => {
    if (isMobile) {
      setCategoriasExpandidas(prev => ({
        ...prev,
        acessorios: false
      }));
    }
  }, [isMobile]);

  // Função para alternar expansão de uma categoria
  const toggleCategoria = (categoria: keyof typeof categoriasExpandidas) => {
    setCategoriasExpandidas(prev => ({
      ...prev,
      [categoria]: !prev[categoria]
    }));
  };

  // Componente para loading
  const ComponenteLoading = () => (
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#faba33] mx-auto mb-4" 
                 role="progressbar" 
                 aria-label="Carregando dados dos produtos"/>
            <p className="text-muted-foreground">Carregando produtos e acessórios mais vendidos...</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Renderização condicional para estados de loading e erro
  if (loading) {
    return <ComponenteLoading />;
  }

  // Tratamento de erro
  if (erro && !equipamentos.length && !acessorios.length) {
    return (
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
    );
  }

  // Caso não existam produtos
  if (equipamentos.length === 0 && acessorios.length === 0) {
    return (
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
    );
  }

  // Handler para abrir detalhes da venda
  const handleVendaClick = (venda: any) => {
    if (onVendaClick) {
      onVendaClick(venda);
    } else {
      abrirDetalhesVenda(venda);
    }
  };

  // Número máximo de itens a exibir por categoria
  // Em telas pequenas, podemos reduzir para melhor performance
  const LIMITE_ITENS = isMobile ? 10 : 15;

  // Ordenar produtos conforme o critério selecionado
  const equipamentosOrdenados = ordenarProdutos(equipamentos, ordenacao, LIMITE_ITENS);
  
  // Acessórios principais (excluindo especiais, sextavados e emborrachados)
  const acessoriosOrdenados = ordenarProdutos(
    acessorios.filter(a => 
      !a.nome.toUpperCase().includes("ANILHA") && 
      !a.nome.toUpperCase().includes("HALTER") && 
      !a.nome.toUpperCase().includes("CABO DE AÇO") && 
      !a.nome.toUpperCase().includes("KETTLEBELL") && 
      !a.nome.toUpperCase().includes("PAR DE CANELEIRAS") &&
      !a.nome.toLowerCase().includes("sextavado") &&
      !a.nome.toLowerCase().includes("emborrachado")
    ),
    ordenacao,
    LIMITE_ITENS
  );
  
  // Categorias específicas
  const acessoriosEspeciaisOrdenados = ordenarProdutos(acessoriosEspeciais, ordenacao, LIMITE_ITENS);
  const acessoriosSextavadosOrdenados = ordenarProdutos(acessoriosSextavados, ordenacao, LIMITE_ITENS);
  const acessoriosEmborrachadosOrdenados = ordenarProdutos(acessoriosEmborrachados, ordenacao, LIMITE_ITENS);

  return (
    <Card className="shadow-lg">
      <CardHeader className={`pb-2 ${isMobile ? 'px-3' : 'px-6'}`}>
        <div className="flex flex-wrap justify-between items-center">
          <div>
            <CardTitle className={`flex items-center gap-2 ${isMobile ? 'text-lg' : 'text-xl'}`}>
              <Package className={`${isMobile ? 'h-5 w-5' : 'h-6 w-6'} text-amber-500`} />
              Produtos e Acessórios Mais Vendidos
            </CardTitle>
            <CardDescription className={`${isMobile ? 'text-sm' : 'text-base'} mt-1`}>
              Análise detalhada por categoria no período selecionado
            </CardDescription>
            {erro && (
              <div className="mt-2 text-xs p-2 bg-amber-50 border border-amber-200 rounded-md text-amber-800">
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
          produtos={equipamentosOrdenados}
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
          produtos={acessoriosOrdenados}
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
        {acessoriosEspeciaisOrdenados.length > 0 && (
          <CategoriaCard
            titulo="Acessórios especiais (Anilhas, Halteres, etc.)"
            icone={<Dumbbell className="h-5 w-5 text-purple-500" />}
            produtos={acessoriosEspeciaisOrdenados}
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
        {acessoriosSextavadosOrdenados.length > 0 && (
          <CategoriaCard
            titulo="Halteres Sextavados"
            icone={<Dumbbell className="h-5 w-5 text-blue-500" />}
            produtos={acessoriosSextavadosOrdenados}
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
        {acessoriosEmborrachadosOrdenados.length > 0 && (
          <CategoriaCard
            titulo="Halteres Emborrachados"
            icone={<Dumbbell className="h-5 w-5 text-green-500" />}
            produtos={acessoriosEmborrachadosOrdenados}
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
} 