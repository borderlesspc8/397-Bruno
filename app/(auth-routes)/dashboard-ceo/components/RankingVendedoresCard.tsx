import { useState, useEffect, useMemo } from "react";
import { Vendedor } from "@/app/_services/betelTecnologia";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/app/_components/ui/card";
import { useRankingVendedores } from "../hooks/useRankingVendedores";
import { TrendingUp, ShoppingCart, CreditCard, Users, Filter, ChevronDown, User, EyeOff, Eye } from "lucide-react";
import { Button } from "@/app/_components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/app/_components/ui/dropdown-menu";
import { VendedoresTable } from "./VendedoresTable";
import { MobileRankingVendedores } from "./MobileRankingVendedores";
import PodiumRanking from "./PodiumRanking";
import { formatCurrency } from "@/app/_utils/format";
import { Switch } from "@/app/_components/ui/switch";
import { Label } from "@/app/_components/ui/label";

interface RankingVendedoresCardProps {
  vendedores: Vendedor[];
  onVendedorClick?: (vendedor: Vendedor) => void;
}

export function RankingVendedoresCard({
  vendedores,
  onVendedorClick
}: RankingVendedoresCardProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [ordenacao, setOrdenacao] = useState<"faturamento" | "vendas" | "ticket">("faturamento");
  const [visualizacao, setVisualizacao] = useState<"podio" | "lista">("podio");
  const [mostrarTodos, setMostrarTodos] = useState(true);
  
  // Usar o hook personalizado para organizar os vendedores
  const { vendedoresOrdenados, totalOrdenacao, titulo, descricao } = useRankingVendedores(
    vendedores, 
    ordenacao, 
    15, // Limite máximo de vendedores a exibir
    !mostrarTodos // Passar false para não filtrar vendedores excluídos
  );
  
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

  // Memoizar o componente de título com filtros
  const CardTitulo = useMemo(() => {
    return (
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <CardTitle className="text-lg font-bold">{titulo}</CardTitle>
          <CardDescription>{descricao}</CardDescription>
        </div>
        
        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
          {/* Toggle para mostrar todos os vendedores */}
          <div className="flex items-center space-x-2 text-xs bg-gray-100 dark:bg-gray-800 p-1.5 rounded-md">
            <Switch 
              id="mostrar-todos" 
              checked={mostrarTodos}
              onCheckedChange={setMostrarTodos}
              aria-label="Mostrar todos os vendedores"
            />
            <Label htmlFor="mostrar-todos" className="cursor-pointer">
              {mostrarTodos ? 
                <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                  <Eye className="h-3.5 w-3.5" />
                  Todos
                </span> : 
                <span className="flex items-center gap-1">
                  <EyeOff className="h-3.5 w-3.5" />
                  Filtrados
                </span>
              }
            </Label>
          </div>
          
          {/* Dropdown para ordenação */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1">
                <Filter className="h-3.5 w-3.5" />
                <span className="text-xs">
                  {ordenacao === "faturamento" ? "Por faturamento" : 
                   ordenacao === "vendas" ? "Por vendas" : 
                   "Por ticket médio"}
                </span>
                <ChevronDown className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => setOrdenacao("faturamento")}>
                  <TrendingUp className="mr-2 h-4 w-4 text-orange-500" />
                  <span>Por faturamento</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setOrdenacao("vendas")}>
                  <ShoppingCart className="mr-2 h-4 w-4 text-amber-500" />
                  <span>Por vendas</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setOrdenacao("ticket")}>
                  <CreditCard className="mr-2 h-4 w-4 text-emerald-500" />
                  <span>Por ticket médio</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Botões de visualização */}
          {!isMobile && (
            <div className="flex border rounded-md overflow-hidden">
              <Button 
                variant={visualizacao === "podio" ? "default" : "ghost"}
                size="sm"
                className="h-8 px-2.5 rounded-none"
                onClick={() => setVisualizacao("podio")}
              >
                <Users className="h-3.5 w-3.5" />
                <span className="sr-only">Visualizar como pódio</span>
              </Button>
              <Button 
                variant={visualizacao === "lista" ? "default" : "ghost"}
                size="sm"
                className="h-8 px-2.5 rounded-none"
                onClick={() => setVisualizacao("lista")}
              >
                <Filter className="h-3.5 w-3.5" />
                <span className="sr-only">Visualizar como lista</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }, [titulo, descricao, ordenacao, visualizacao, isMobile, mostrarTodos]);

  // Verificação para garantir que temos vendedores suficientes para o pódio
  const podioDisponivel = vendedoresOrdenados.length >= 3;
  
  // Em mobile, forçar visualização de ranking otimizado ao invés de pódio
  const visualizacaoAtual = isMobile ? "mobile" : podioDisponivel ? visualizacao : "lista";

  return (
    <Card className="shadow-md border-gray-200 dark:border-gray-700">
      <CardHeader className="px-4 py-4">
        {CardTitulo}
      </CardHeader>
      
      <CardContent className="px-4 py-0 pb-4">
        {/* Mensagem quando não temos vendedores */}
        {!vendedoresOrdenados.length && (
          <div className="flex items-center justify-center h-[200px]">
            <p className="text-muted-foreground">Nenhum vendedor encontrado no período</p>
          </div>
        )}
        
        {/* Visualização mobile */}
        {visualizacaoAtual === "mobile" && vendedoresOrdenados.length > 0 && (
          <MobileRankingVendedores 
            vendedores={vendedoresOrdenados} 
            ordenacao={ordenacao}
            onVendedorClick={onVendedorClick}
          />
        )}
        
        {/* Visualização do pódio (apenas em desktop) */}
        {visualizacaoAtual === "podio" && vendedoresOrdenados.length > 0 && (
          <div className="py-4">
            <PodiumRanking 
              vendedores={vendedoresOrdenados}
              ordenacao={ordenacao}
              onVendedorClick={onVendedorClick}
            />
          </div>
        )}
        
        {/* Visualização em lista (apenas em desktop) */}
        {visualizacaoAtual === "lista" && vendedoresOrdenados.length > 0 && (
          <VendedoresTable 
            vendedores={vendedoresOrdenados} 
            onClickVendedor={onVendedorClick}
          />
        )}
        
        {/* Rodapé com informações adicionais */}
        {vendedoresOrdenados.length > 0 && (
          <div className="mt-4 pt-3 border-t text-sm text-muted-foreground flex justify-between items-center">
            <span>Total: {vendedores.length} vendedores</span>
            <span>
              {ordenacao === "faturamento" 
                ? `Faturamento: ${formatCurrency(totalOrdenacao)}` 
                : ordenacao === "vendas" 
                ? `Vendas: ${totalOrdenacao}` 
                : `Ticket médio: ${formatCurrency(totalOrdenacao)}`}
            </span>
          </div>
        )}
        
        {/* Legenda para vendedores especiais */}
        {mostrarTodos && ordenacao === "faturamento" && (
          <div className="mt-2 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
            <User className="h-3.5 w-3.5" />
            <span>Usuário Administrativo e Fernando Loyo incluídos</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 
