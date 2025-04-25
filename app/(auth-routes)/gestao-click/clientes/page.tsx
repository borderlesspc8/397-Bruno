"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import type { MouseEvent } from "react";
import { Button } from "@/app/_components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { Input } from "@/app/_components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/_components/ui/table";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/app/_components/ui/pagination";
import { Alert, AlertTitle, AlertDescription } from "@/app/_components/ui/alert";
import { Loader2, UserPlus, RefreshCw, Search } from "lucide-react";
import { GestaoClickCliente, GestaoClickResponse } from "@/app/_types/gestao-click";
import { Badge } from "@/app/_components/ui/badge";
import { useToast } from "@/app/_components/ui/use-toast";
import { cn } from "@/app/_lib/utils";
import ClienteDetailModal from "@/app/_components/gestao-click/ClienteDetailModal";

// No início do arquivo, adicione a constante de ambiente
const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Página de listagem e importação de clientes do Gestão Click
 */
export default function ClientesGestaoClickPage() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [clientes, setClientes] = useState<GestaoClickCliente[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [pageSize] = useState<number>(20);
  const [totalRegistros, setTotalRegistros] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Estados para controlar o modal de detalhes
  const [selectedClienteId, setSelectedClienteId] = useState<string | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);

  /**
   * Busca clientes do Gestão Click
   */
  const fetchClientes = useCallback(async (page: number = 1) => {
    setIsLoading(true);
    setError(null);

    try {
      // Em ambiente de desenvolvimento, podemos usar o bypass para testes
      const bypassParam = isDevelopment ? '&bypass=true&test=true' : '';
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
      });

      if (searchTerm) {
        params.append("search", searchTerm);
      }

      const response = await fetch(`/api/gestao-click/clients?${params.toString()}${bypassParam}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || 'Erro ao buscar clientes');
      }

      const data: GestaoClickResponse<GestaoClickCliente> = await response.json();
      
      // Aviso para dados de teste apenas em desenvolvimento
      if (data._debug && isDevelopment) {
        console.log('Aviso: Usando dados de exemplo para desenvolvimento');
      }
      
      setClientes(data.data);
      setTotalRegistros(data.meta.total_registros);
      setTotalPages(Math.ceil(data.meta.total_registros / pageSize));
      setCurrentPage(data.meta.pagina_atual);
    } catch (error) {
      console.error("Erro ao buscar clientes:", error);
      setError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, pageSize]);

  /**
   * Busca clientes ao carregar a página
   */
  useEffect(() => {
    fetchClientes(currentPage);
  }, [fetchClientes, currentPage]);

  /**
   * Importa clientes do Gestão Click
   */
  const handleImportClientes = async () => {
    setIsImporting(true);
    setError(null);

    try {
      // Em ambiente de desenvolvimento, podemos usar o bypass para testes
      const bypassOption = isDevelopment ? { bypass: true, test: true } : {};
      const response = await fetch("/api/gestao-click/clients/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bypassOption),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || "Erro na importação");
      }

      const result = await response.json();
      
      // Aviso para dados de teste apenas em desenvolvimento
      if (result._debug && isDevelopment) {
        console.log('Aviso: Resultado de importação simulado para desenvolvimento');
      }
      
      toast({
        title: "Importação concluída",
        description: `${result.result.imported} clientes importados, ${result.result.skipped} já existentes.`,
        variant: "success",
      });

      // Recarregar lista após importação
      fetchClientes(1);
    } catch (error) {
      console.error("Erro ao importar clientes:", error);
      setError(error instanceof Error ? error.message : String(error));
      toast({
        title: "Erro na importação",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  /**
   * Renderiza paginação
   */
  const renderPagination = () => {
    const pageNumbers = [];
    const maxPageItems = 7;
    
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
              onClick={(e: MouseEvent<HTMLAnchorElement>) => {
                e.preventDefault();
                if (currentPage > 1 && !isLoading) {
                  setCurrentPage(prev => Math.max(1, prev - 1));
                }
              }}
              className={cn(currentPage === 1 || isLoading ? "pointer-events-none opacity-50" : "")}
            />
          </PaginationItem>
          
          {startPage > 1 && (
            <>
              <PaginationItem>
                <PaginationLink 
                  href="#"
                  onClick={(e: MouseEvent<HTMLAnchorElement>) => {
                    e.preventDefault();
                    if (!isLoading) setCurrentPage(1);
                  }}
                  className={cn(isLoading ? "pointer-events-none opacity-50" : "")}
                >
                  1
                </PaginationLink>
              </PaginationItem>
              {startPage > 2 && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}
            </>
          )}
          
          {pageNumbers.map(pageNumber => (
            <PaginationItem key={pageNumber}>
              <PaginationLink 
                href="#"
                isActive={pageNumber === currentPage}
                onClick={(e: MouseEvent<HTMLAnchorElement>) => {
                  e.preventDefault();
                  if (!isLoading) setCurrentPage(pageNumber);
                }}
                className={cn(isLoading ? "pointer-events-none opacity-50" : "")}
              >
                {pageNumber}
              </PaginationLink>
            </PaginationItem>
          ))}
          
          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}
              <PaginationItem>
                <PaginationLink 
                  href="#"
                  onClick={(e: MouseEvent<HTMLAnchorElement>) => {
                    e.preventDefault();
                    if (!isLoading) setCurrentPage(totalPages);
                  }}
                  className={cn(isLoading ? "pointer-events-none opacity-50" : "")}
                >
                  {totalPages}
                </PaginationLink>
              </PaginationItem>
            </>
          )}
          
          <PaginationItem>
            <PaginationNext 
              href="#"
              onClick={(e: MouseEvent<HTMLAnchorElement>) => {
                e.preventDefault();
                if (currentPage < totalPages && !isLoading) {
                  setCurrentPage(prev => Math.min(totalPages, prev + 1));
                }
              }}
              className={cn(currentPage === totalPages || isLoading ? "pointer-events-none opacity-50" : "")}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

  // Abre o modal de detalhes para um cliente específico
  const handleClienteClick = (clienteId: string) => {
    setSelectedClienteId(clienteId);
    setIsDetailModalOpen(true);
  };

  // Fecha o modal de detalhes
  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Clientes do Gestão Click</h1>
          <p className="text-muted-foreground">
            Visualize e importe clientes do sistema Gestão Click
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Link href="/gestao-click">
            <Button variant="outline">Voltar</Button>
          </Link>
          
          <Button 
            onClick={handleImportClientes} 
            disabled={isImporting}
            className="flex items-center gap-2"
          >
            {isImporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <UserPlus className="h-4 w-4" />
            )}
            Importar Clientes
          </Button>
        </div>
      </div>
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Lista de Clientes</CardTitle>
          <CardDescription>
            {totalRegistros} 
            {totalRegistros === 1 ? 'cliente encontrado' : 'clientes encontrados'}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center gap-2 flex-1">
              <Input
                placeholder="Buscar clientes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-md"
              />
              <Button 
                variant="outline" 
                onClick={() => fetchClientes(1)} 
                disabled={isLoading}
              >
                <Search className="h-4 w-4 mr-2" />
                Buscar
              </Button>
            </div>
            
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => fetchClientes(currentPage)} 
              disabled={isLoading}
              title="Atualizar lista"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">ID</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex justify-center items-center">
                        <Loader2 className="h-6 w-6 animate-spin mr-2" />
                        <span>Carregando clientes...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : clientes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Nenhum cliente encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  clientes.map((cliente) => (
                    <TableRow key={cliente.id}>
                      <TableCell className="font-medium">{cliente.id}</TableCell>
                      <TableCell>
                        <button 
                          onClick={() => handleClienteClick(cliente.id)} 
                          className="text-primary hover:underline"
                        >
                          {cliente.nome}
                        </button>
                      </TableCell>
                      <TableCell>
                        {cliente.tipo_pessoa === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                      </TableCell>
                      <TableCell>
                        {cliente.tipo_pessoa === 'PF' ? cliente.cpf : cliente.cnpj}
                      </TableCell>
                      <TableCell>
                        {cliente.email || cliente.telefone || cliente.celular || 'Não informado'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={cliente.ativo === '1' ? 'default' : 'secondary'}>
                          {cliente.ativo === '1' ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <div className="text-sm text-muted-foreground">
            Exibindo {clientes.length} de {totalRegistros} clientes
          </div>
          
          {totalPages > 1 && renderPagination()}
        </CardFooter>
      </Card>
      
      {/* Modal de detalhes do cliente */}
      <ClienteDetailModal 
        clienteId={selectedClienteId}
        isOpen={isDetailModalOpen}
        onClose={handleCloseDetailModal}
      />
    </div>
  );
} 