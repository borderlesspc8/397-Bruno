"use client";

import { useState, memo, useMemo } from "react";
import { Vendedor } from "@/app/_services/betelTecnologia";
import { formatCurrency } from "@/app/_utils/format";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/app/_components/ui/card";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/app/_components/ui/dropdown-menu";
import { Button } from "@/app/_components/ui/button";
import { Filter, CreditCard, BadgePercent, BarChart, AlertCircle } from "lucide-react";
import { PodiumRanking } from "@/app/_components/dashboard-shared/components";
import { useRankingVendedores } from "@/app/_components/dashboard-shared/hooks";

interface RankingVendedoresPodiumProps {
  vendedores: Vendedor[];
  onUploadFoto?: (vendedor: Vendedor) => void;
  onVendedorClick?: (vendedor: Vendedor) => void;
  erro?: string | null;
  isRankingComponent?: boolean;
  // Adicionar props para receber dados da mesma fonte (mesma do DashboardSummary)
  vendas?: any[];
  totalVendas?: number;
  totalValor?: number;
  ticketMedio?: number;
}

// Componente de Cabeçalho memoizado para evitar re-renders desnecessários
const CardHeader_Memo = memo(({ 
  titulo, 
  descricao, 
  ordenacao, 
  setOrdenacao 
}: {
  titulo: string;
  descricao: string;
  ordenacao: "faturamento" | "vendas" | "ticket";
  setOrdenacao: (ordenacao: "faturamento" | "vendas" | "ticket") => void;
}) => (
  <CardHeader className="pb-2">
    <div className="flex justify-between items-center">
      <div>
        <CardTitle className="text-xl font-bold">{titulo}</CardTitle>
        <CardDescription className="mt-1">{descricao}</CardDescription>
      </div>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 gap-1"
            aria-label="Opções de ordenação"
          >
            <Filter className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Ordenar</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[180px]">
          <DropdownMenuLabel>Ordenar por</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem 
              onClick={() => setOrdenacao("faturamento")}
              className={ordenacao === "faturamento" ? "bg-muted" : ""}
              aria-selected={ordenacao === "faturamento"}
            >
              <CreditCard className="mr-2 h-4 w-4" />
              <span>Faturamento</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => setOrdenacao("vendas")}
              className={ordenacao === "vendas" ? "bg-muted" : ""}
              aria-selected={ordenacao === "vendas"}
            >
              <BarChart className="mr-2 h-4 w-4" />
              <span>Quantidade</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => setOrdenacao("ticket")}
              className={ordenacao === "ticket" ? "bg-muted" : ""}
              aria-selected={ordenacao === "ticket"}
            >
              <BadgePercent className="mr-2 h-4 w-4" />
              <span>Ticket Médio</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </CardHeader>
));

// Nome do componente para melhor depuração
CardHeader_Memo.displayName = 'CardHeader_Memo';

// Componente de Footer memoizado
const CardFooter_Memo = memo(({ 
  quantidade, 
  valorTotal, 
  ordenacao 
}: {
  quantidade: number;
  valorTotal: number;
  ordenacao: "faturamento" | "vendas" | "ticket";
}) => {
  // Formatar valor de acordo com o tipo de ordenação
  const valorFormatado = useMemo(() => {
    if (ordenacao === "faturamento" || ordenacao === "ticket") {
      return formatCurrency(valorTotal);
    } else {
      return `${valorTotal} vendas`;
    }
  }, [ordenacao, valorTotal]);

  return (
    <div className="flex justify-between text-sm text-muted-foreground mt-4 border-t pt-3">
      <div>Total: {quantidade} vendedores</div>
      <div>{valorFormatado}</div>
    </div>
  );
});

// Nome do componente para melhor depuração
CardFooter_Memo.displayName = 'CardFooter_Memo';

// Componente mensagem de erro memoizado
const ErroMensagem = memo(({ mensagem }: { mensagem: string }) => (
  <div 
    className="bg-red-50 border border-red-200 rounded-md p-3 mt-2 text-red-700 flex items-center gap-2"
    role="alert"
    aria-live="assertive"
  >
    <AlertCircle className="h-4 w-4" />
    <span>{mensagem}</span>
  </div>
));

ErroMensagem.displayName = 'ErroMensagem';

// Componente principal
export default function RankingVendedoresPodium({ 
  vendedores = [], // Valor padrão para evitar erros
  onUploadFoto,
  onVendedorClick,
  erro = null,
  isRankingComponent = true, // Por padrão, consideramos como componente de ranking
  vendas = [],
  totalVendas,
  totalValor,
  ticketMedio
}: RankingVendedoresPodiumProps) {
  const [ordenacao, setOrdenacao] = useState<"faturamento" | "vendas" | "ticket">("faturamento");
  
  // Usar o hook otimizado para dados do ranking, passando o parâmetro isRankingComponent
  const { titulo, descricao, totalOrdenacao, vendedoresOrdenados } = useRankingVendedores(
    vendedores,
    ordenacao,
    10, // limite padrão
    isRankingComponent
  );

  // Memoizar função para prevenir recriações a cada render
  const handleClickVendedor = useMemo(() => {
    return (vendedor: Vendedor) => {
      // Priorizar a abertura do modal de detalhes se disponível
      if (onVendedorClick) {
        onVendedorClick(vendedor);
      } 
      // Manter compatibilidade com a função de upload de foto
      else if (onUploadFoto) {
        onUploadFoto(vendedor);
      }
    };
  }, [onVendedorClick, onUploadFoto]);
  
  // Verificar erros primeiro
  if (erro) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ranking de Vendedores</CardTitle>
          <CardDescription>Não foi possível carregar os dados</CardDescription>
        </CardHeader>
        <CardContent>
          <ErroMensagem mensagem={erro} />
        </CardContent>
      </Card>
    );
  }
  
  // Considerações sobre o número mínimo de vendedores necessários para exibir o pódio
  // Agora verificamos a lista filtrada vendedoresOrdenados em vez da lista original
  if (!vendedoresOrdenados || vendedoresOrdenados.length < 3) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{titulo || "Ranking de Vendedores"}</CardTitle>
          <CardDescription>
            São necessários pelo menos 3 vendedores para exibir o pódio
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-8">
          <p className="text-muted-foreground">
            Selecione um período com mais vendedores para visualizar o pódio
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader_Memo 
        titulo={titulo}
        descricao={descricao}
        ordenacao={ordenacao}
        setOrdenacao={setOrdenacao}
      />
      
      <CardContent>
        <div className="py-4" aria-label={`Pódio de vendedores por ${ordenacao === "faturamento" ? "faturamento" : ordenacao === "vendas" ? "quantidade de vendas" : "ticket médio"}`}>
          <PodiumRanking 
            vendedores={vendedoresOrdenados} // Usando a lista filtrada
            ordenacao={ordenacao}
            onVendedorClick={handleClickVendedor}
          />
        </div>
        
        <CardFooter_Memo 
          quantidade={vendedores.length} // Total de todos os vendedores
          valorTotal={
            ordenacao === "faturamento" 
              ? (totalValor !== undefined && totalValor !== null ? totalValor : totalOrdenacao) // Usar totalValor se fornecido, senão calcular do hook
              : ordenacao === "vendas"
              ? (totalVendas !== undefined && totalVendas !== null ? totalVendas : totalOrdenacao)
              : (ticketMedio !== undefined && ticketMedio !== null ? ticketMedio : totalOrdenacao)
          }
          ordenacao={ordenacao}
        />
      </CardContent>
    </Card>
  );
} 
