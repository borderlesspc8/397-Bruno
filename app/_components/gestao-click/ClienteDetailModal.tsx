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
import { Loader2, Mail, Phone, MapPin, Info, User, Building2, Calendar, Tag, ShoppingCart, CreditCard, Clock, FileText } from "lucide-react";
import { GestaoClickCliente, GestaoClickVenda, GestaoClickResponse } from "@/app/_types/gestao-click";
import { ScrollArea } from "@/app/_components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/app/_components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/app/_components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/_components/ui/table";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/app/_components/ui/pagination";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/app/_lib/utils";
import VendaDetailModal from "./VendaDetailModal";

interface ClienteDetailModalProps {
  clienteId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ClienteDetailModal({
  clienteId,
  isOpen,
  onClose
}: ClienteDetailModalProps) {
  const [cliente, setCliente] = useState<GestaoClickCliente | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("info");
  
  // Estados para a aba de vendas
  const [vendas, setVendas] = useState<GestaoClickVenda[]>([]);
  const [isLoadingVendas, setIsLoadingVendas] = useState(false);
  const [vendasError, setVendasError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalVendas, setTotalVendas] = useState(0);
  
  // Estados para o modal de detalhes da venda
  const [selectedVendaId, setSelectedVendaId] = useState<string | null>(null);
  const [isVendaModalOpen, setIsVendaModalOpen] = useState(false);

  // Efeito para buscar dados do cliente
  useEffect(() => {
    async function fetchClienteDetails() {
      if (!clienteId || !isOpen) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Em ambiente de desenvolvimento, podemos usar o bypass para testes
        const bypassParam = process.env.NODE_ENV === 'development' ? '?bypass=true' : '';
        const response = await fetch(`/api/gestao-click/clients/${clienteId}${bypassParam}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || errorData.message || 'Erro ao buscar detalhes do cliente');
        }
        
        const data = await response.json();
        setCliente(data);
      } catch (error) {
        console.error("Erro ao buscar detalhes do cliente:", error);
        setError(error instanceof Error ? error.message : String(error));
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchClienteDetails();
  }, [clienteId, isOpen]);

  // Efeito para buscar vendas quando a aba vendas for selecionada
  useEffect(() => {
    async function fetchVendas() {
      if (!clienteId || !isOpen || activeTab !== "vendas") return;
      
      setIsLoadingVendas(true);
      setVendasError(null);
      
      try {
        // Em ambiente de desenvolvimento, podemos usar o bypass para testes
        const bypassParam = process.env.NODE_ENV === 'development' ? '&bypass=true' : '';
        const response = await fetch(`/api/gestao-click/clients/${clienteId}/vendas?page=${currentPage}&limit=5${bypassParam}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || errorData.message || 'Erro ao buscar histórico de vendas');
        }
        
        const data: GestaoClickResponse<GestaoClickVenda> = await response.json();
        
        // Garantir que data.data seja sempre um array
        if (!Array.isArray(data.data)) {
          console.warn('API retornou dados em formato inesperado:', data.data);
          setVendas([]);
          setTotalVendas(0);
          setTotalPages(1);
        } else {
          setVendas(data.data);
          setTotalVendas(data.meta.total_registros || 0);
          setTotalPages(Math.ceil((data.meta.total_registros || 0) / 5)); // 5 é o limite que definimos na requisição
        }
      } catch (error) {
        console.error("Erro ao buscar histórico de vendas:", error);
        setVendasError(error instanceof Error ? error.message : String(error));
      } finally {
        setIsLoadingVendas(false);
      }
    }
    
    fetchVendas();
  }, [clienteId, isOpen, activeTab, currentPage]);

  function formatarDocumento(cliente: GestaoClickCliente): string {
    if (cliente.tipo_pessoa === 'PF' && cliente.cpf) {
      return `CPF: ${cliente.cpf}`;
    } else if (cliente.tipo_pessoa === 'PJ' && cliente.cnpj) {
      return `CNPJ: ${cliente.cnpj}`;
    }
    return 'Documento não informado';
  }

  function formatarDataNascimento(data: string | null): string {
    if (!data) return 'Não informada';
    
    try {
      const [ano, mes, dia] = data.split('-');
      return `${dia}/${mes}/${ano}`;
    } catch (e) {
      return data;
    }
  }

  function formatarData(dataString: string): string {
    try {
      const data = new Date(dataString);
      return format(data, 'dd/MM/yyyy', { locale: ptBR });
    } catch (e) {
      return dataString;
    }
  }

  function formatarValor(valorString: string): string {
    try {
      const valor = parseFloat(valorString);
      return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    } catch (e) {
      return valorString;
    }
  }

  // Função para formatar status de venda com cores
  function renderStatusVenda(status: string) {
    const statusMap: Record<string, { label: string, variant: "default" | "secondary" | "destructive" | "outline" }> = {
      "Concluída": { label: "Concluída", variant: "default" },
      "Cancelada": { label: "Cancelada", variant: "destructive" },
      "Em Andamento": { label: "Em Andamento", variant: "secondary" },
      "Orçamento": { label: "Orçamento", variant: "outline" }
    };
    
    const statusInfo = statusMap[status] || { label: status, variant: "outline" };
    
    return (
      <Badge variant={statusInfo.variant}>
        {statusInfo.label}
      </Badge>
    );
  }

  // Função para renderizar paginação na aba de vendas
  const renderPagination = () => {
    if (totalPages <= 1) return null;
    
    const pageNumbers = [];
    const maxPageItems = 5;
    
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + maxPageItems - 1);
    
    if (endPage - startPage + 1 < maxPageItems) {
      startPage = Math.max(1, endPage - maxPageItems + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    
    return (
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious 
              href="#"
              onClick={(e) => {
                e.preventDefault();
                if (currentPage > 1 && !isLoadingVendas) {
                  setCurrentPage(prev => Math.max(1, prev - 1));
                }
              }}
              className={cn(currentPage === 1 || isLoadingVendas ? "pointer-events-none opacity-50" : "")}
            />
          </PaginationItem>
          
          {pageNumbers.map(pageNumber => (
            <PaginationItem key={pageNumber}>
              <PaginationLink 
                href="#"
                isActive={pageNumber === currentPage}
                onClick={(e) => {
                  e.preventDefault();
                  if (!isLoadingVendas) setCurrentPage(pageNumber);
                }}
                className={cn(isLoadingVendas ? "pointer-events-none opacity-50" : "")}
              >
                {pageNumber}
              </PaginationLink>
            </PaginationItem>
          ))}
          
          <PaginationItem>
            <PaginationNext 
              href="#"
              onClick={(e) => {
                e.preventDefault();
                if (currentPage < totalPages && !isLoadingVendas) {
                  setCurrentPage(prev => Math.min(totalPages, prev + 1));
                }
              }}
              className={cn(currentPage === totalPages || isLoadingVendas ? "pointer-events-none opacity-50" : "")}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

  // Função para abrir o modal de detalhes da venda
  const handleVendaClick = (vendaId: string) => {
    setSelectedVendaId(vendaId);
    setIsVendaModalOpen(true);
  };

  // Função para fechar o modal de detalhes da venda
  const handleCloseVendaModal = () => {
    setIsVendaModalOpen(false);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Detalhes do Cliente</DialogTitle>
            <DialogDescription>
              Informações detalhadas do cliente do Gestão Click
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="flex-1 px-1">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin mr-2" />
                <span>Carregando detalhes do cliente...</span>
              </div>
            ) : error ? (
              <Alert variant="destructive">
                <AlertTitle>Erro ao carregar dados</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : cliente ? (
              <Tabs defaultValue="info" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="info">Informações</TabsTrigger>
                  <TabsTrigger value="contatos">Contatos</TabsTrigger>
                  <TabsTrigger value="enderecos">Endereços</TabsTrigger>
                  <TabsTrigger value="vendas">Vendas</TabsTrigger>
                </TabsList>
                
                <TabsContent value="info" className="mt-4 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-2xl font-semibold">{cliente.nome}</h2>
                      {cliente.tipo_pessoa === 'PJ' && cliente.razao_social && (
                        <p className="text-muted-foreground">{cliente.razao_social}</p>
                      )}
                    </div>
                    <Badge variant={cliente.ativo === '1' ? 'default' : 'secondary'}>
                      {cliente.ativo === '1' ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                  
                  <Separator />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <Tag className="h-5 w-5 mr-2 text-primary" />
                        <Label>ID: </Label>
                        <span className="ml-2">{cliente.id}</span>
                      </div>
                      
                      <div className="flex items-center">
                        {cliente.tipo_pessoa === 'PF' ? (
                          <User className="h-5 w-5 mr-2 text-primary" />
                        ) : (
                          <Building2 className="h-5 w-5 mr-2 text-primary" />
                        )}
                        <Label>Tipo: </Label>
                        <span className="ml-2">
                          {cliente.tipo_pessoa === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                        </span>
                      </div>
                      
                      <div className="flex items-center">
                        <Info className="h-5 w-5 mr-2 text-primary" />
                        <Label>Documento: </Label>
                        <span className="ml-2">{formatarDocumento(cliente)}</span>
                      </div>
                      
                      {cliente.tipo_pessoa === 'PJ' && cliente.inscricao_estadual && (
                        <div className="flex items-center">
                          <Info className="h-5 w-5 mr-2 text-primary" />
                          <Label>Inscrição Estadual: </Label>
                          <span className="ml-2">{cliente.inscricao_estadual}</span>
                        </div>
                      )}
                      
                      {cliente.tipo_pessoa === 'PJ' && cliente.inscricao_municipal && (
                        <div className="flex items-center">
                          <Info className="h-5 w-5 mr-2 text-primary" />
                          <Label>Inscrição Municipal: </Label>
                          <span className="ml-2">{cliente.inscricao_municipal}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-3">
                      {cliente.tipo_pessoa === 'PF' && cliente.data_nascimento && (
                        <div className="flex items-center">
                          <Calendar className="h-5 w-5 mr-2 text-primary" />
                          <Label>Data de Nascimento: </Label>
                          <span className="ml-2">
                            {formatarDataNascimento(cliente.data_nascimento)}
                          </span>
                        </div>
                      )}
                      
                      {cliente.telefone && (
                        <div className="flex items-center">
                          <Phone className="h-5 w-5 mr-2 text-primary" />
                          <Label>Telefone: </Label>
                          <span className="ml-2">{cliente.telefone}</span>
                        </div>
                      )}
                      
                      {cliente.celular && (
                        <div className="flex items-center">
                          <Phone className="h-5 w-5 mr-2 text-primary" />
                          <Label>Celular: </Label>
                          <span className="ml-2">{cliente.celular}</span>
                        </div>
                      )}
                      
                      {cliente.email && (
                        <div className="flex items-center">
                          <Mail className="h-5 w-5 mr-2 text-primary" />
                          <Label>E-mail: </Label>
                          <span className="ml-2">{cliente.email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="contatos" className="mt-4">
                  {cliente.contatos && cliente.contatos.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4">
                      {cliente.contatos.map((item, index) => (
                        <Card key={index}>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-lg">{item.contato.nome}</CardTitle>
                            <CardDescription>{item.contato.cargo || 'Cargo não informado'}</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            <div className="flex">
                              <Label className="w-28">Tipo:</Label>
                              <span>{item.contato.nome_tipo || 'Não informado'}</span>
                            </div>
                            <div className="flex">
                              <Label className="w-28">Contato:</Label>
                              <span>{item.contato.contato || 'Não informado'}</span>
                            </div>
                            {item.contato.observacao && (
                              <div className="flex">
                                <Label className="w-28">Observação:</Label>
                                <span>{item.contato.observacao}</span>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhum contato cadastrado para este cliente.
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="enderecos" className="mt-4">
                  {cliente.enderecos && cliente.enderecos.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4">
                      {cliente.enderecos.map((item, index) => (
                        <Card key={index}>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-lg flex items-center">
                              <MapPin className="h-5 w-5 mr-2" />
                              Endereço
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-1">
                              <div>
                                {item.endereco.logradouro}, {item.endereco.numero}
                                {item.endereco.complemento && ` - ${item.endereco.complemento}`}
                              </div>
                              <div>
                                {item.endereco.bairro && `${item.endereco.bairro}, `}
                                {item.endereco.nome_cidade && `${item.endereco.nome_cidade}/`}
                                {item.endereco.estado}
                              </div>
                              {item.endereco.cep && <div>CEP: {item.endereco.cep}</div>}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhum endereço cadastrado para este cliente.
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="vendas" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <ShoppingCart className="h-5 w-5 mr-2" />
                        Histórico de Vendas
                      </CardTitle>
                      <CardDescription>
                        {totalVendas === 0 
                          ? "Nenhuma venda registrada" 
                          : `${totalVendas} ${totalVendas === 1 ? 'venda' : 'vendas'} registradas`}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {isLoadingVendas ? (
                        <div className="flex items-center justify-center h-32">
                          <Loader2 className="h-6 w-6 animate-spin mr-2" />
                          <span>Carregando histórico de vendas...</span>
                        </div>
                      ) : vendasError ? (
                        <Alert variant="destructive">
                          <AlertTitle>Erro ao carregar vendas</AlertTitle>
                          <AlertDescription>{vendasError}</AlertDescription>
                        </Alert>
                      ) : vendas.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          Nenhuma venda registrada para este cliente.
                        </div>
                      ) : (
                        <div className="border rounded-md">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Data</TableHead>
                                <TableHead>Código</TableHead>
                                <TableHead>Valor</TableHead>
                                <TableHead>Situação</TableHead>
                                <TableHead>Vendedor</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {vendas.map((venda) => (
                                <TableRow 
                                  key={venda.id} 
                                  className="cursor-pointer hover:bg-muted/50"
                                  onClick={() => handleVendaClick(venda.id)}
                                >
                                  <TableCell>
                                    <div className="flex items-center">
                                      <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                                      {formatarData(venda.data)}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center">
                                      <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                                      {venda.codigo}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center">
                                      <CreditCard className="h-4 w-4 mr-2 text-muted-foreground" />
                                      {formatarValor(venda.valor_total)}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    {renderStatusVenda(venda.nome_situacao)}
                                  </TableCell>
                                  <TableCell>{venda.nome_vendedor}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </CardContent>
                    {!isLoadingVendas && !vendasError && vendas.length > 0 && (
                      <CardFooter className="flex justify-center">
                        {renderPagination()}
                      </CardFooter>
                    )}
                  </Card>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum cliente selecionado.
              </div>
            )}
          </ScrollArea>
          
          <DialogFooter>
            <Button onClick={onClose}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Modal de detalhes da venda */}
      <VendaDetailModal
        vendaId={selectedVendaId}
        isOpen={isVendaModalOpen}
        onClose={handleCloseVendaModal}
      />
    </>
  );
} 