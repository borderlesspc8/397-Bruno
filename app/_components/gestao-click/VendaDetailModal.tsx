"use client";

import { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/app/_components/ui/dialog";
import { Button } from "@/app/_components/ui/button";
import { Label } from "@/app/_components/ui/label";
import { Separator } from "@/app/_components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/_components/ui/tabs";
import { Badge } from "@/app/_components/ui/badge";
import { Loader2, User, Calendar, Clock, CreditCard, Building2, FileText, MapPin, ShoppingBag, Package, Receipt, Truck, ListChecks, AlertTriangle, RefreshCw } from "lucide-react";
import { ScrollArea } from "@/app/_components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/app/_components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/_components/ui/table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { processarVenda, VendaProcessada } from "@/app/_utils/venda-processor";

interface VendaDetailModalProps {
  vendaId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function VendaDetailModal({
  vendaId,
  isOpen,
  onClose
}: VendaDetailModalProps) {
  const [venda, setVenda] = useState<VendaProcessada | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchVendaDetails() {
      if (!vendaId || !isOpen) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Em ambiente de desenvolvimento, podemos usar o bypass para testes
        const bypassParam = process.env.NODE_ENV === 'development' ? '?bypass=true' : '';
        const response = await fetch(`/api/gestao-click/vendas/${vendaId}${bypassParam}`);
        
        if (response.status === 404) {
          throw new Error("Venda não encontrada no Gestão Click. O ID pode estar incorreto ou a venda pode ter sido excluída.");
        }
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error || 
            errorData.message || 
            `Erro ao buscar detalhes da venda (${response.status})`
          );
        }
        
        const data = await response.json();
        
        // Aplicar o processamento de dados para normalizar a estrutura da venda
        // e garantir que os pagamentos sejam corretamente formatados
        const vendaProcessada = processarVenda(data);
        
        // Verificação de segurança
        if (!vendaProcessada) {
          throw new Error("Erro ao processar dados da venda. Dados inválidos ou incompletos.");
        }
        
        // Log para depuração
        console.log('Venda processada:', {
          codigo: vendaProcessada.codigo,
          valor_total: vendaProcessada.valor_total,
          pagamentos: vendaProcessada.pagamentos.length,
          produtos: vendaProcessada.produtos.length
        });
        
        setVenda(vendaProcessada);
      } catch (error) {
        console.error("Erro ao buscar detalhes da venda:", error);
        setError(error instanceof Error ? error.message : String(error));
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchVendaDetails();
  }, [vendaId, isOpen]);

  function formatarData(dataString: string | Date | null | undefined): string {
    if (!dataString) return 'Não informada';
    
    try {
      // Verificar se a data já é um objeto Date
      let data: Date;
      
      if (dataString instanceof Date) {
        data = dataString;
      } else {
        // Verificar se a data está em formato ISO ou outros formatos comuns
        if (typeof dataString === 'string') {
          if (/^\d{4}-\d{2}-\d{2}/.test(dataString)) {
            // Formato ISO
            data = new Date(dataString);
          } else if (/^\d{2}\/\d{2}\/\d{4}/.test(dataString)) {
            // Formato DD/MM/YYYY
            const [dia, mes, ano] = dataString.split('/').map(Number);
            data = new Date(ano, mes - 1, dia);
          } else {
            // Tentar converter diretamente
            data = new Date(dataString);
          }
        } else {
          // Fallback para casos não tratados
          data = new Date();
        }
      }
      
      // Verificar se a data é válida
      if (isNaN(data.getTime())) {
        return 'Data inválida';
      }
      
      return format(data, 'dd/MM/yyyy', { locale: ptBR });
    } catch (e) {
      console.error("Erro ao formatar data:", dataString, e);
      return typeof dataString === 'string' ? dataString : 'Data inválida';
    }
  }

  function formatarValor(valor: string | number | null | undefined): string {
    if (valor === null || valor === undefined) return 'R$ 0,00';
    
    try {
      // Primeiro verificar se o valor já é um número
      let valorNumerico: number;
      
      if (typeof valor === 'string') {
        // Remover caracteres não numéricos, exceto pontos e vírgulas
        let valorLimpo = valor.replace(/[^\d.,]/g, '');
        
        // Verificar se estamos lidando com um valor no formato brasileiro (1.234,56)
        const formatoBrasileiro = /^\d{1,3}(\.\d{3})+(,\d+)?$/.test(valorLimpo);
        const temVirgula = valorLimpo.includes(',');
        
        if (formatoBrasileiro || temVirgula) {
          // Formato brasileiro: remover pontos e substituir vírgula por ponto
          valorLimpo = valorLimpo.replace(/\./g, '').replace(',', '.');
        }
        
        valorNumerico = parseFloat(valorLimpo);
      } else {
        valorNumerico = Number(valor);
      }
      
      if (isNaN(valorNumerico)) return 'R$ 0,00';
      
      // Usar toLocaleString para formatação correta
      return valorNumerico.toLocaleString('pt-BR', { 
        style: 'currency', 
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    } catch (e) {
      console.error("Erro ao formatar valor:", valor, e);
      return 'R$ 0,00';
    }
  }

  // Função para renderizar status com cores
  function renderStatus(status: string | undefined | null) {
    if (!status) return null;
    
    const statusMap: Record<string, { label: string, variant: "default" | "secondary" | "destructive" | "outline" }> = {
      "Concluída": { label: "Concluída", variant: "default" },
      "Cancelada": { label: "Cancelada", variant: "destructive" },
      "Em Andamento": { label: "Em Andamento", variant: "secondary" },
      "Orçamento": { label: "Orçamento", variant: "outline" },
      "Concretizada": { label: "Concretizada", variant: "default" }
    };
    
    const statusInfo = statusMap[status] || { label: status, variant: "outline" };
    
    return (
      <Badge variant={statusInfo.variant}>
        {statusInfo.label}
      </Badge>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Detalhes da Venda</DialogTitle>
          <DialogDescription>
            Informações detalhadas da venda do Gestão Click
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-1 px-1">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin mr-2" />
              <span>Carregando detalhes da venda...</span>
            </div>
          ) : error ? (
            <Alert variant="destructive" className="mt-4">
              <AlertTitle className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Erro ao carregar dados
              </AlertTitle>
              <AlertDescription className="mt-2">
                <p>{error}</p>
                <div className="mt-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => window.location.reload()}
                    className="mr-2"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Tentar novamente
                  </Button>
                  <Button 
                    variant="default" 
                    size="sm" 
                    onClick={onClose}
                  >
                    Fechar
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          ) : venda ? (
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="info">Informações</TabsTrigger>
                <TabsTrigger value="produtos">Produtos</TabsTrigger>
                <TabsTrigger value="servicos">Serviços</TabsTrigger>
                <TabsTrigger value="pagamentos">Pagamentos</TabsTrigger>
              </TabsList>
              
              <TabsContent value="info" className="mt-4 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-semibold">Venda #{venda.codigo}</h2>
                    <p className="text-muted-foreground">{venda.nome_cliente}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {renderStatus(venda.nome_situacao)}
                    <div className="text-xl font-semibold">{formatarValor(venda.valor_total)}</div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center">
                        <Clock className="h-5 w-5 mr-2 text-primary" />
                        Datas e Prazos
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex">
                        <Label className="w-36">Data da Venda:</Label>
                        <span>{formatarData(venda.data)}</span>
                      </div>
                      {venda.previsao_entrega && (
                        <div className="flex">
                          <Label className="w-36">Previsão de Entrega:</Label>
                          <span>{formatarData(venda.previsao_entrega)}</span>
                        </div>
                      )}
                      {venda.validade && (
                        <div className="flex">
                          <Label className="w-36">Validade:</Label>
                          <span>{formatarData(venda.validade)}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center">
                        <Building2 className="h-5 w-5 mr-2 text-primary" />
                        Dados da Empresa
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex">
                        <Label className="w-36">Centro de Custo:</Label>
                        <span>{venda.nome_centro_custo || 'Não informado'}</span>
                      </div>
                      <div className="flex">
                        <Label className="w-36">Loja:</Label>
                        <span>{venda.nome_loja || 'Não informado'}</span>
                      </div>
                      <div className="flex">
                        <Label className="w-36">Canal de Venda:</Label>
                        <span>{venda.nome_canal_venda || 'Não informado'}</span>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center">
                        <User className="h-5 w-5 mr-2 text-primary" />
                        Responsáveis
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex">
                        <Label className="w-36">Vendedor:</Label>
                        <span>{venda.nome_vendedor || 'Não informado'}</span>
                      </div>
                      {venda.nome_tecnico && (
                        <div className="flex">
                          <Label className="w-36">Técnico:</Label>
                          <span>{venda.nome_tecnico}</span>
                        </div>
                      )}
                      {venda.aos_cuidados_de && (
                        <div className="flex">
                          <Label className="w-36">Aos cuidados de:</Label>
                          <span>{venda.aos_cuidados_de}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center">
                        <FileText className="h-5 w-5 mr-2 text-primary" />
                        Observações
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {venda.introducao ? (
                        <div className="space-y-1">
                          <Label>Introdução:</Label>
                          <p className="text-sm">{venda.introducao}</p>
                        </div>
                      ) : null}
                      
                      {venda.observacoes ? (
                        <div className="space-y-1">
                          <Label>Observações:</Label>
                          <p className="text-sm">{venda.observacoes}</p>
                        </div>
                      ) : null}
                      
                      {venda.observacoes_interna ? (
                        <div className="space-y-1">
                          <Label>Observações Internas:</Label>
                          <p className="text-sm">{venda.observacoes_interna}</p>
                        </div>
                      ) : null}
                      
                      {!venda.introducao && !venda.observacoes && !venda.observacoes_interna && (
                        <p className="text-sm text-muted-foreground">Nenhuma observação registrada</p>
                      )}
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center">
                        <Truck className="h-5 w-5 mr-2 text-primary" />
                        Entrega
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex">
                        <Label className="w-36">Transportadora:</Label>
                        <span>{venda.nome_transportadora || 'Não informada'}</span>
                      </div>
                      <div className="flex">
                        <Label className="w-36">Valor do Frete:</Label>
                        <span>{formatarValor(venda.valor_frete?.toString())}</span>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center">
                        <ListChecks className="h-5 w-5 mr-2 text-primary" />
                        Status
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex">
                        <Label className="w-36">Situação:</Label>
                        <span>{renderStatus(venda.nome_situacao)}</span>
                      </div>
                      <div className="flex">
                        <Label className="w-36">Situação Financeiro:</Label>
                        <span>{venda.situacao_financeiro || 'Não informada'}</span>
                      </div>
                      <div className="flex">
                        <Label className="w-36">Situação Estoque:</Label>
                        <span>{venda.situacao_estoque || 'Não informada'}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="produtos" className="mt-4">
                {venda.produtos && venda.produtos.length > 0 ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Package className="h-5 w-5 mr-2" />
                        Produtos da Venda
                      </CardTitle>
                      <CardDescription>
                        {venda.produtos.length} {venda.produtos.length === 1 ? 'produto' : 'produtos'} incluídos nesta venda
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Produto</TableHead>
                            <TableHead>Qtd</TableHead>
                            <TableHead>Unidade</TableHead>
                            <TableHead>Valor Unit.</TableHead>
                            <TableHead>Desconto</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {venda.produtos.map((item: any, index: number) => {
                            // Verificar diferentes formatos possíveis de produto na resposta
                            const produto = item.produto || item;
                            
                            // Calcular o valor total do produto
                            const valorTotal = parseFloat(
                              produto.valor_total?.toString() || 
                              produto.valorTotal?.toString() || 
                              produto.total?.toString() || 
                              (
                                parseFloat(produto.quantidade || '1') * 
                                parseFloat(produto.valor_venda?.toString() || produto.valorUnitario?.toString() || '0')
                              ).toString()
                            );
                            
                            return (
                              <TableRow key={index}>
                                <TableCell className="font-medium">
                                  <div>
                                    {produto.nome_produto || produto.nome || 'Produto sem nome'}
                                  </div>
                                  {produto.detalhes && (
                                    <div className="text-xs text-muted-foreground mt-1">
                                      {produto.detalhes}
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell>{produto.quantidade}</TableCell>
                                <TableCell>{produto.sigla_unidade || '-'}</TableCell>
                                <TableCell>{formatarValor(produto.valor_venda || produto.valorUnitario?.toString())}</TableCell>
                                <TableCell>
                                  {produto.tipo_desconto === 'porcentagem' 
                                    ? `${produto.desconto_porcentagem}%` 
                                    : formatarValor(produto.desconto_valor?.toString() || produto.desconto?.toString() || '0')}
                                </TableCell>
                                <TableCell className="text-right">{formatarValor(valorTotal.toString())}</TableCell>
                              </TableRow>
                            );
                          })}
                          <TableRow>
                            <TableCell colSpan={5} className="text-right font-bold">Total de Produtos:</TableCell>
                            <TableCell className="text-right font-bold">
                              {formatarValor(
                                venda.produtos.reduce((total: number, item: any) => {
                                  const produto = item.produto || item;
                                  // Extrair o valor total do produto
                                  const valorTotal = parseFloat(
                                    produto.valor_total?.toString() || 
                                    produto.valorTotal?.toString() || 
                                    produto.total?.toString() || 
                                    (
                                      parseFloat(produto.quantidade || '1') * 
                                      parseFloat(produto.valor_venda?.toString() || produto.valorUnitario?.toString() || '0')
                                    ).toString()
                                  );
                                  // Verificar se é um número válido antes de somar
                                  return total + (isNaN(valorTotal) ? 0 : valorTotal);
                                }, 0).toString()
                              )}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                ) : (
                  <Alert>
                    <AlertTitle>Nenhum produto</AlertTitle>
                    <AlertDescription>Esta venda não possui produtos registrados.</AlertDescription>
                  </Alert>
                )}
              </TabsContent>
              
              <TabsContent value="servicos" className="mt-4">
                {venda.servicos && venda.servicos.length > 0 ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <ShoppingBag className="h-5 w-5 mr-2" />
                        Serviços da Venda
                      </CardTitle>
                      <CardDescription>
                        {venda.servicos.length} {venda.servicos.length === 1 ? 'serviço' : 'serviços'} incluídos nesta venda
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Serviço</TableHead>
                            <TableHead>Qtd</TableHead>
                            <TableHead>Unidade</TableHead>
                            <TableHead>Valor Unit.</TableHead>
                            <TableHead>Desconto</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {venda.servicos.map((item: any, index: number) => {
                            // Verificar diferentes formatos possíveis de serviço na resposta
                            const servico = item.servico || item;
                            
                            // Calcular o valor total do serviço
                            const valorTotal = parseFloat(
                              servico.valor_total?.toString() || 
                              servico.valorTotal?.toString() || 
                              servico.total?.toString() || 
                              (
                                parseFloat(servico.quantidade || '1') * 
                                parseFloat(servico.valor_venda?.toString() || servico.valorUnitario?.toString() || '0')
                              ).toString()
                            );
                            
                            return (
                              <TableRow key={index}>
                                <TableCell className="font-medium">
                                  <div>
                                    {servico.nome_servico || servico.nome || 'Serviço sem nome'}
                                  </div>
                                  {servico.detalhes && (
                                    <div className="text-xs text-muted-foreground mt-1">
                                      {servico.detalhes}
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell>{servico.quantidade}</TableCell>
                                <TableCell>{servico.sigla_unidade || '-'}</TableCell>
                                <TableCell>{formatarValor(servico.valor_venda || servico.valorUnitario?.toString())}</TableCell>
                                <TableCell>
                                  {servico.tipo_desconto === 'porcentagem' 
                                    ? `${servico.desconto_porcentagem}%` 
                                    : formatarValor(servico.desconto_valor?.toString() || servico.desconto?.toString() || '0')}
                                </TableCell>
                                <TableCell className="text-right">{formatarValor(valorTotal.toString())}</TableCell>
                              </TableRow>
                            );
                          })}
                          <TableRow>
                            <TableCell colSpan={5} className="text-right font-bold">Total de Serviços:</TableCell>
                            <TableCell className="text-right font-bold">
                              {formatarValor(
                                venda.servicos.reduce((total: number, item: any) => {
                                  const servico = item.servico || item;
                                  // Extrair o valor total do serviço
                                  const valorTotal = parseFloat(
                                    servico.valor_total?.toString() || 
                                    servico.valorTotal?.toString() || 
                                    servico.total?.toString() || 
                                    (
                                      parseFloat(servico.quantidade || '1') * 
                                      parseFloat(servico.valor_venda?.toString() || servico.valorUnitario?.toString() || '0')
                                    ).toString()
                                  );
                                  // Verificar se é um número válido antes de somar
                                  return total + (isNaN(valorTotal) ? 0 : valorTotal);
                                }, 0).toString()
                              )}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                ) : (
                  <Alert>
                    <AlertTitle>Nenhum serviço</AlertTitle>
                    <AlertDescription>Esta venda não possui serviços registrados.</AlertDescription>
                  </Alert>
                )}
              </TabsContent>
              
              <TabsContent value="pagamentos" className="mt-4">
                {venda.pagamentos && venda.pagamentos.length > 0 ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Receipt className="h-5 w-5 mr-2" />
                        Pagamentos da Venda
                      </CardTitle>
                      <CardDescription>
                        {venda.pagamentos.length} {venda.pagamentos.length === 1 ? 'pagamento' : 'pagamentos'} registrados
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Vencimento</TableHead>
                            <TableHead>Forma de Pagamento</TableHead>
                            <TableHead>Plano de Contas</TableHead>
                            <TableHead className="text-right">Valor</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {venda.pagamentos.map((item: any, index: number) => {
                            // Verificar diferentes formatos possíveis de pagamento na resposta
                            const pagamento = item.pagamento || item;
                            
                            // Extrair a forma de pagamento - checando todas as possíveis propriedades
                            const formaPagamento = 
                              pagamento.nome_forma_pagamento || 
                              pagamento.formaPagamento || 
                              pagamento.forma_pagamento ||
                              pagamento.nome ||
                              (typeof pagamento.forma_pagamento_id === 'string' && pagamento.forma_pagamento_id.length > 0 
                                ? pagamento.forma_pagamento_id 
                                : '-');
                            
                            // Extrair o valor do pagamento - buscar em várias propriedades possíveis
                            const valorPagamento = 
                              typeof pagamento.valor === 'number' || typeof pagamento.valor === 'string' ? parseFloat(pagamento.valor?.toString() || '0') :
                              typeof pagamento.total === 'number' || typeof pagamento.total === 'string' ? parseFloat(pagamento.total?.toString() || '0') :
                              typeof pagamento.valorTotal === 'number' || typeof pagamento.valorTotal === 'string' ? parseFloat(pagamento.valorTotal?.toString() || '0') : 0;
                            
                            // Verifica se é um pagamento válido (tem forma de pagamento e valor)
                            const isValid = formaPagamento !== '-' && valorPagamento > 0;
                            
                            // Adiciona classe de cor se o pagamento for inválido
                            const rowClassName = !isValid ? "opacity-50 text-muted-foreground" : "";
                            
                            return (
                              <TableRow key={index} className={rowClassName}>
                                <TableCell>
                                  {formatarData(pagamento.data_vencimento || pagamento.dataVencimento || pagamento.data)}
                                </TableCell>
                                <TableCell>
                                  {formaPagamento !== 'Não especificado' && formaPagamento !== '-' 
                                    ? formaPagamento 
                                    : venda.condicao_pagamento 
                                      ? <span title="Forma deduzida da condição de pagamento">
                                          {venda.condicao_pagamento}
                                        </span> 
                                      : 'Não disponível'}
                                </TableCell>
                                <TableCell>{pagamento.nome_plano_conta || pagamento.plano_conta || '-'}</TableCell>
                                <TableCell className="text-right">
                                  {formatarValor(valorPagamento.toString())}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                          <TableRow>
                            <TableCell colSpan={3} className="text-right font-bold">Total:</TableCell>
                            <TableCell className="text-right font-bold">
                              {formatarValor(
                                venda.pagamentos.reduce((total: number, item: any) => {
                                  const pagamento = item.pagamento || item;
                                  // Garantir que o valor seja tratado como número
                                  const valor = parseFloat(pagamento.valor?.toString() || '0');
                                  // Verificar se é um número válido antes de somar
                                  return total + (isNaN(valor) ? 0 : valor);
                                }, 0).toString()
                              )}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                      
                      <div className="mt-4 p-3 border rounded-md">
                        <div className="flex justify-between">
                          <div>
                            <span className="text-sm font-medium">Condição de Pagamento:</span>
                            <span className="text-sm ml-2">{venda.condicao_pagamento || venda.formaPagamento || 'Não informada'}</span>
                          </div>
                          <div>
                            <span className="text-sm font-medium">Nº de Parcelas:</span>
                            <span className="text-sm ml-2">{venda.numero_parcelas || venda.parcelas?.toString() || '-'}</span>
                          </div>
                          <div>
                            <span className="text-sm font-medium">Intervalo (dias):</span>
                            <span className="text-sm ml-2">{venda.intervalo_dias || '-'}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Alert>
                    <AlertTitle>Nenhum pagamento</AlertTitle>
                    <AlertDescription>Esta venda não possui pagamentos registrados.</AlertDescription>
                  </Alert>
                )}
              </TabsContent>
            </Tabs>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma venda selecionada.
            </div>
          )}
        </ScrollArea>
        
        <DialogFooter>
          <Button onClick={onClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 