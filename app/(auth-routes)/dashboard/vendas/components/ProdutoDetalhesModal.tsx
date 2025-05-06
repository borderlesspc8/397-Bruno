import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/_components/ui/dialog';
import { Badge } from '@/app/_components/ui/badge';
import { Progress } from '@/app/_components/ui/progress';
import { VendasService } from "@/app/_services/vendas";
import { 
  BarChart2, 
  Package, 
  DollarSign, 
  ShoppingBag, 
  Hash, 
  Percent,
  Warehouse,
  Tag,
  AlertTriangle,
  AlertCircle,
  FileBarChart,
  CalendarIcon,
  ArrowUpRight,
  ShoppingCart,
  RefreshCcw
} from "lucide-react";
import { formatCurrency } from "@/app/_utils/format";
import { Button } from "@/app/_components/ui/button";
import { Card, CardContent } from '@/app/_components/ui/card';
import { Alert, AlertDescription } from '@/app/_components/ui/alert';
import { format } from 'date-fns';
import { VendaDetalheModal } from './VendaDetalheModal';
import { ScrollArea } from '@/app/_components/ui/scroll-area';
import { Separator } from '@/app/_components/ui/separator';
import { Skeleton } from '@/app/_components/ui/skeleton';

// Interface para o produto
interface Produto {
  id?: string | number;
  nome: string;
  quantidade: number;
  valor: number;
  percentual?: number;
  codigo?: string | number;
  categoria?: string;
  descricao?: string;
}

interface VendaItemBasico {
  id: string | number;
  data: string;
  cliente: string;
  valor: number;
}

interface ProdutoDetalhesModalProps {
  produto: Produto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dataInicio: Date;
  dataFim: Date;
}

export function ProdutoDetalhesModal({ 
  produto, 
  open, 
  onOpenChange, 
  dataInicio, 
  dataFim 
}: ProdutoDetalhesModalProps) {
  const [vendas, setVendas] = useState<VendaItemBasico[]>([]);
  const [totalVendas, setTotalVendas] = useState<number>(0);
  const [totalValor, setTotalValor] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [vendaSelecionada, setVendaSelecionada] = useState<any | null>(null);
  const [vendaModalAberta, setVendaModalAberta] = useState<boolean>(false);

  const buscarVendas = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log(`Buscando vendas para o produto ID: ${produto.id} (${produto.nome})`);
      
      const produtoId = produto.id || produto.codigo || produto.nome.replace(/\s+/g, '_');
      const response = await VendasService.buscarVendasPorProduto({
        dataInicio,
        dataFim,
        produtoId: String(produtoId),
      });

      if (response.erro) {
        console.error('Erro ao buscar vendas:', response.erro);
        setError(`Erro ao buscar vendas: ${response.erro}`);
        setVendas([]);
        setTotalVendas(0);
        setTotalValor(0);
      } else {
        const vendasFormatadas = response.vendas.map((venda: any) => ({
          id: venda.id,
          data: venda.data || venda.data_inclusao || venda.data_venda,
          cliente: venda.nome_cliente || venda.cliente || 'Cliente não identificado',
          valor: parseFloat(typeof venda.valor_total === 'string' ? venda.valor_total : String(venda.valor_total)),
        }));

        console.log(`Encontradas ${vendasFormatadas.length} vendas para o produto ${produto.nome}`);
        setVendas(vendasFormatadas);
        setTotalVendas(response.totalVendas || vendasFormatadas.length);
        setTotalValor(response.totalValor || vendasFormatadas.reduce((sum, venda) => sum + venda.valor, 0));
      }
    } catch (err) {
      console.error('Erro ao buscar vendas do produto:', err);
      setError(`Erro na busca: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
      setVendas([]);
      setTotalVendas(0);
      setTotalValor(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && produto) {
      buscarVendas();
    }
  }, [open, produto]);

  const abrirVendaDetalhe = async (vendaId: string | number) => {
    try {
      // Aqui vamos apenas capturar o ID da venda para abrir o modal
      setVendaSelecionada({ id: vendaId });
      setVendaModalAberta(true);
    } catch (err) {
      console.error('Erro ao buscar detalhe da venda:', err);
    }
  };

  const percentualExibicao = produto.percentual || 0;

  // Função para formatar data e hora
  const formatarDataHora = (dataString: string) => {
    if (!dataString) return 'Data não disponível';
    try {
      const data = new Date(dataString);
      return format(data, 'dd/MM/yyyy HH:mm');
    } catch (e) {
      return dataString;
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" /> Detalhes do Produto
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-medium">{produto.nome}</h3>
                    <div className="text-sm text-muted-foreground mt-1">
                      {produto.codigo && (
                        <div className="flex items-center">
                          <ShoppingCart className="h-4 w-4 mr-1" />
                          <span>Código: {produto.codigo}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {produto.categoria ? (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Warehouse className="h-3 w-3" />
                      {produto.categoria}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Warehouse className="h-3 w-3" />
                      Não categorizado
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Qtde. Vendida</span>
                    <span className="font-medium">{produto.quantidade}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Valor Total</span>
                    <span className="font-medium">{formatCurrency(produto.valor)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Participação nas Vendas</span>
                    <span className="font-medium">{percentualExibicao.toFixed(2)}%</span>
                  </div>
                  
                  <Progress value={percentualExibicao} className="h-2 mt-2" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Separator className="my-2" />
          
          <div className="mb-2">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <FileBarChart className="h-5 w-5" /> 
              <span>Vendas do Período</span>
              <span className="text-sm text-muted-foreground">
                ({format(dataInicio, 'dd/MM/yyyy')} a {format(dataFim, 'dd/MM/yyyy')})
              </span>
            </h3>
          </div>

          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : error ? (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="flex justify-between items-center">
                <div>
                  {error}
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={buscarVendas}
                  className="ml-2"
                >
                  <RefreshCcw className="h-4 w-4 mr-1" /> Tentar novamente
                </Button>
              </AlertDescription>
            </Alert>
          ) : vendas.length > 0 ? (
            <ScrollArea className="h-[300px]">
              <div className="space-y-3">
                <div className="grid grid-cols-[1fr_2fr_1fr_auto] text-sm font-medium text-muted-foreground">
                  <div>Data</div>
                  <div>Cliente</div>
                  <div className="text-right">Valor</div>
                  <div></div>
                </div>
                {vendas.map((venda) => (
                  <div 
                    key={venda.id} 
                    className="grid grid-cols-[1fr_2fr_1fr_auto] items-center py-2 border-b text-sm hover:bg-muted cursor-pointer rounded-md px-2"
                    onClick={() => abrirVendaDetalhe(venda.id)}
                  >
                    <div className="flex items-center">
                      <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                      {formatarDataHora(venda.data)}
                    </div>
                    <div>{venda.cliente}</div>
                    <div className="text-right font-medium">{formatCurrency(venda.valor)}</div>
                    <div>
                      <Button variant="ghost" size="icon">
                        <ArrowUpRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex justify-between items-center">
                <div>
                  Nenhuma venda encontrada para {produto.nome} no período selecionado ({format(dataInicio, 'dd/MM/yyyy')} a {format(dataFim, 'dd/MM/yyyy')}).
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={buscarVendas}
                  className="ml-2"
                >
                  <RefreshCcw className="h-4 w-4 mr-1" /> Atualizar
                </Button>
              </AlertDescription>
            </Alert>
          )}
          
          {vendas.length > 0 && (
            <div className="flex justify-between mt-4 text-sm">
              <div>
                <span className="text-muted-foreground">Total de Vendas:</span>{' '}
                <span className="font-medium">{totalVendas}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Valor Total:</span>{' '}
                <span className="font-medium">{formatCurrency(totalValor)}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {vendaSelecionada && (
        <VendaDetalheModal 
          venda={vendaSelecionada}
          aberto={vendaModalAberta}
          onOpenChange={setVendaModalAberta}
          onClose={() => {
            setVendaSelecionada(null);
            setVendaModalAberta(false);
          }}
        />
      )}
    </>
  );
} 