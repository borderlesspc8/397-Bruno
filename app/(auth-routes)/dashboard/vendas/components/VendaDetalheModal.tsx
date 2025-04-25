import { useState, useEffect } from "react";
import { 
  CalendarIcon, 
  ClockIcon, 
  ShoppingBagIcon, 
  StoreIcon, 
  CreditCardIcon, 
  ClipboardCheckIcon,
  MessageSquareText,
  ServerIcon,
  ShoppingBag,
  Package
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/_components/ui/dialog';
import { Badge } from '@/app/_components/ui/badge';
import { renderSafe } from '@/app/_utils/render-helpers';
import { 
  processarVenda, 
  VendaProcessada, 
  Pagamento, 
  Produto 
} from '@/app/_utils/venda-processor';

interface VendaDetalheModalProps {
  venda: any;
  aberto: boolean;
  onOpenChange: (aberto: boolean) => void;
}

export function VendaDetalheModal({ venda, aberto, onOpenChange }: VendaDetalheModalProps) {
  const [vendaProcessada, setVendaProcessada] = useState<VendaProcessada | null>(null);
  
  // Processar os dados da venda sempre que ela mudar
  useEffect(() => {
    if (!venda) return;
    
    try {
      // Usar o utilitário para processar a venda
      const dadosProcessados = processarVenda(venda);
      setVendaProcessada(dadosProcessados);
    } catch (erro) {
      console.error("Erro ao processar dados da venda:", erro);
      // Caso ocorra um erro, tentar usar os dados originais
      setVendaProcessada(venda);
    }
  }, [venda]);
  
  // Se não houver venda, não renderizar nada
  if (!venda || !vendaProcessada || Object.keys(vendaProcessada).length === 0) {
    return null;
  }
  
  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="text-xl font-semibold flex items-center">
            <ShoppingBag className="w-5 h-5 mr-2 text-amber-500" />
            Detalhes da Venda
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Cabeçalho com informações principais */}
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="px-3 py-1 text-sm">
                  #{renderSafe(vendaProcessada.id)}
                </Badge>
                {vendaProcessada.nome_situacao && (
                  <Badge 
                    className={`px-3 py-1 ${
                      renderSafe(vendaProcessada.nome_situacao) === "Concretizada" 
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                        : String(renderSafe(vendaProcessada.nome_situacao)).includes("Canc")
                          ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                    }`}
                  >
                    {renderSafe(vendaProcessada.nome_situacao)}
                  </Badge>
                )}
              </div>
              <h3 className="text-lg font-semibold">
                {renderSafe(vendaProcessada.nome_cliente || vendaProcessada.cliente || "Cliente não identificado")}
              </h3>
              <p className="text-muted-foreground text-sm">
                Vendedor: {renderSafe(vendaProcessada.vendedor_nome || vendaProcessada.nome_vendedor || "Não especificado")}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Valor Total</p>
              <p className="text-2xl font-bold text-green-600">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                  vendaProcessada.valor_total
                )}
              </p>
            </div>
          </div>
          
          {/* Grid de informações */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Data */}
            {(vendaProcessada.data || vendaProcessada.data_inclusao) && (
              <div className="bg-muted/10 p-4 rounded-lg border flex items-start">
                <CalendarIcon className="w-5 h-5 mr-3 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Data</p>
                  <p className="font-medium">
                    {vendaProcessada.data instanceof Date 
                      ? vendaProcessada.data.toLocaleDateString('pt-BR')
                      : vendaProcessada.data_inclusao instanceof Date
                        ? vendaProcessada.data_inclusao.toLocaleDateString('pt-BR')
                        : new Date(String(renderSafe(vendaProcessada.data || vendaProcessada.data_inclusao))).toLocaleDateString('pt-BR')
                    }
                  </p>
                </div>
              </div>
            )}
            
            {/* Prazo de Entrega */}
            {vendaProcessada.prazo_entrega && (
              <div className="bg-muted/10 p-4 rounded-lg border flex items-start">
                <ClockIcon className="w-5 h-5 mr-3 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Prazo de Entrega</p>
                  <p className="font-medium">
                    {vendaProcessada.prazo_entrega instanceof Date
                      ? vendaProcessada.prazo_entrega.toLocaleDateString('pt-BR')
                      : new Date(String(renderSafe(vendaProcessada.prazo_entrega))).toLocaleDateString('pt-BR')
                    }
                  </p>
                </div>
              </div>
            )}
            
            {/* Canal de Venda */}
            {vendaProcessada.nome_canal_venda && (
              <div className="bg-muted/10 p-4 rounded-lg border flex items-start">
                <ShoppingBagIcon className="w-5 h-5 mr-3 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Canal de Venda</p>
                  <p className="font-medium">{renderSafe(vendaProcessada.nome_canal_venda)}</p>
                </div>
              </div>
            )}
            
            {/* Loja */}
            {vendaProcessada.nome_loja && (
              <div className="bg-muted/10 p-4 rounded-lg border flex items-start">
                <StoreIcon className="w-5 h-5 mr-3 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Loja</p>
                  <p className="font-medium">{renderSafe(vendaProcessada.nome_loja)}</p>
                </div>
              </div>
            )}
            
            {/* Condição de Pagamento */}
            {vendaProcessada.condicao_pagamento && (
              <div className="bg-muted/10 p-4 rounded-lg border flex items-start">
                <CreditCardIcon className="w-5 h-5 mr-3 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Condição de Pagamento</p>
                  <p className="font-medium">{renderSafe(vendaProcessada.condicao_pagamento)}</p>
                </div>
              </div>
            )}
            
            {/* Técnico */}
            {vendaProcessada.tecnico_id && (
              <div className="bg-muted/10 p-4 rounded-lg border flex items-start">
                <ClipboardCheckIcon className="w-5 h-5 mr-3 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Técnico</p>
                  <p className="font-medium">{renderSafe(vendaProcessada.nome_tecnico || vendaProcessada.tecnico_id)}</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Observações Internas */}
          {vendaProcessada.observacoes_interna && (
            <div className="bg-muted/10 p-4 rounded-lg border">
              <div className="flex items-center mb-2">
                <MessageSquareText className="w-5 h-5 mr-2 text-muted-foreground" />
                <p className="font-medium">Observações Internas</p>
              </div>
              <p className="text-sm whitespace-pre-line pl-7">{renderSafe(vendaProcessada.observacoes_interna)}</p>
            </div>
          )}
          
          {/* Pagamentos */}
          {Array.isArray(vendaProcessada.pagamentos) && vendaProcessada.pagamentos.length > 0 && (
            <div className="bg-muted/10 p-4 rounded-lg border">
              <div className="flex items-center mb-4">
                <CreditCardIcon className="w-5 h-5 mr-2 text-muted-foreground" />
                <p className="font-medium">Formas de Pagamento</p>
              </div>
              <div className="overflow-auto max-h-[200px]">
                <table className="w-full text-sm">
                  <thead className="text-xs bg-muted/30">
                    <tr>
                      <th className="px-3 py-2 text-left rounded-l-md">Forma</th>
                      <th className="px-3 py-2 text-center">Parcelas</th>
                      <th className="px-3 py-2 text-right rounded-r-md">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {vendaProcessada.pagamentos.map((pagamento: Pagamento, idx: number) => (
                      <tr key={idx} className="hover:bg-muted/20">
                        <td className="px-3 py-2">{renderSafe(pagamento.forma_pagamento)}</td>
                        <td className="px-3 py-2 text-center">{renderSafe(pagamento.parcelas)}</td>
                        <td className="px-3 py-2 text-right">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                            pagamento.valor
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {/* Produtos */}
          {Array.isArray(vendaProcessada.produtos) && vendaProcessada.produtos.length > 0 && (
            <div className="bg-muted/10 p-4 rounded-lg border">
              <div className="flex items-center mb-4">
                <Package className="w-5 h-5 mr-2 text-muted-foreground" />
                <p className="font-medium">Produtos</p>
              </div>
              <div className="overflow-auto max-h-[250px]">
                <table className="w-full text-sm">
                  <thead className="text-xs bg-muted/30">
                    <tr>
                      <th className="px-3 py-2 text-left rounded-l-md">Produto</th>
                      <th className="px-3 py-2 text-right">Qtde</th>
                      <th className="px-3 py-2 text-right">Valor Unit.</th>
                      <th className="px-3 py-2 text-right rounded-r-md">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {vendaProcessada.produtos.map((produto: Produto, idx: number) => (
                      <tr key={idx} className="hover:bg-muted/20">
                        <td className="px-3 py-2">{renderSafe(produto.nome_produto)}</td>
                        <td className="px-3 py-2 text-right">{renderSafe(produto.quantidade)}</td>
                        <td className="px-3 py-2 text-right">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                            typeof produto.valor_unitario === 'number' ? produto.valor_unitario : 0
                          )}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                            typeof produto.valor_total === 'number' ? produto.valor_total : 0
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
        </div>
      </DialogContent>
    </Dialog>
  );
}