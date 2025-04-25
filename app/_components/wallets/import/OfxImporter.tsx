"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/app/_components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/app/_components/ui/card";
import { 
  ArrowUpIcon, 
  FileUpIcon, 
  CheckIcon, 
  AlertCircle, 
  ArrowDownIcon, 
  RefreshCw, 
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Import,
  BotIcon
} from "lucide-react";
import { toast } from "sonner";
import { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/app/_components/ui/table";
import { Wallet } from "@prisma/client";
import { Alert, AlertDescription, AlertTitle } from "@/app/_components/ui/alert";
import { formatCurrency } from "@/app/_lib/utils";
import { 
  Pagination, 
  PaginationContent, 
  PaginationEllipsis, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "@/app/_components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/_components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/app/_components/ui/dialog";
import { useRealtimeUpdates } from "@/app/_hooks/use-realtime-updates";
import { useRouter } from "next/navigation";
import { CategorySuggestions } from "@/app/_components/finance-assistant";

interface OfxImporterProps {
  wallet: Wallet;
  onImportComplete?: (wallet: Wallet) => void;
}

interface OfxTransaction {
  id: string;
  date: Date | string;
  description: string;
  amount: number;
  type: 'DEPOSIT' | 'EXPENSE';
}

// Função para limpar e normalizar descrições com caracteres especiais
function normalizeDescription(description: string): string {
  if (!description) return '';
  
  // Substituir caracteres de codificação problemáticos comuns em arquivos OFX
  let normalized = description
    .replace(/[\u0080-\u00FF]/g, (char) => '?') // Substitui caracteres de codificação inválidos
    .replace(/\s+/g, ' ') // Remove espaços extras
    .trim();
    
  // Normalizar caracteres acentuados quando possível
  try {
    normalized = normalized.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  } catch (e) {
    // Se a normalização falhar, apenas continua com o que temos
  }
  
  return normalized;
}

export function OfxImporter({ wallet, onImportComplete }: OfxImporterProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parsedTransactions, setParsedTransactions] = useState<OfxTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileIdentifier, setFileIdentifier] = useState<string | null>(null);
  
  // Estados para paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [showCategorySuggestions, setShowCategorySuggestions] = useState(false);
  
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { emitWalletUpdate } = useRealtimeUpdates();

  // Valores calculados
  const totalIncome = parsedTransactions
    .filter(t => t.type === 'DEPOSIT')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const totalExpense = parsedTransactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
  const balance = totalIncome - totalExpense;
  
  // Cálculos para paginação
  const totalPages = Math.ceil(parsedTransactions.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTransactions = parsedTransactions.slice(indexOfFirstItem, indexOfLastItem);
  
  // Navegar para a página específica
  const paginate = (pageNumber: number) => {
    if (pageNumber < 1) pageNumber = 1;
    if (pageNumber > totalPages) pageNumber = totalPages;
    setCurrentPage(pageNumber);
  };

  // Resetar paginação quando as transações mudarem
  useEffect(() => {
    setCurrentPage(1);
  }, [parsedTransactions.length]);

  const handleFileSelect = async (selectedFile: File) => {
    if (!selectedFile) return;
    
    // Verificar tipo de arquivo
    if (!selectedFile.name.toLowerCase().endsWith('.ofx')) {
      toast.error("Por favor, selecione um arquivo OFX válido");
      return;
    }
    
    // Tamanho máximo (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      toast.error("O arquivo excede o tamanho máximo permitido (10MB)");
      return;
    }
    
    setFile(selectedFile);
    setError(null);
    setIsLoading(true);
    
    try {
      // Ler o arquivo
      const reader = new FileReader();
      reader.onload = async (e) => {
        const content = e.target?.result as string;
        
        // Enviar para o backend para parsear
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('walletId', wallet.id);
        
        try {
          const response = await fetch('/api/wallets/import/ofx/parse', {
            method: 'POST',
            body: formData,
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Falha ao analisar o arquivo OFX');
          }
          
          const data = await response.json();
          setParsedTransactions(data.transactions);
          setFileIdentifier(data.fileIdentifier || null);
          toast.success(`${data.transactions.length} transações encontradas no arquivo OFX`);
        } catch (error) {
          console.error('Erro ao analisar OFX:', error);
          setError(error instanceof Error ? error.message : 'Erro ao processar o arquivo OFX');
          toast.error('Não foi possível processar o arquivo OFX');
        } finally {
          setIsLoading(false);
        }
      };
      
      reader.onerror = () => {
        setError('Erro ao ler o arquivo');
        setIsLoading(false);
      };
      
      reader.readAsText(selectedFile);
    } catch (error) {
      setError('Erro ao processar o arquivo');
      setIsLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleImport = async () => {
    if (parsedTransactions.length === 0) {
      toast.error('Não há transações para importar');
      return;
    }
    
    setIsImporting(true);
    
    try {
      const response = await fetch('/api/wallets/import/ofx/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletId: wallet.id,
          transactions: parsedTransactions,
          fileIdentifier: fileIdentifier
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        
        // Verificar se é um erro de importação duplicada
        if (errorData.alreadyImported) {
          toast.error("Este extrato já foi importado anteriormente");
        } else {
          throw new Error(errorData.error || 'Falha ao importar transações');
        }
        
        // Resetar o estado mesmo em caso de erro
        setFile(null);
        setParsedTransactions([]);
        setFileIdentifier(null);
        return;
      }
      
      const data = await response.json();
      toast.success(`${data.imported} transações importadas com sucesso!`);
      
      // Mostrar aviso se alguma transação falhou
      if (data.failedCount > 0) {
        toast.warning(`${data.failedCount} transações não puderam ser importadas. Verifique o console para mais detalhes.`);
      }
      
      // Resetar o estado
      setFile(null);
      setParsedTransactions([]);
      setFileIdentifier(null);
      
      // Emitir evento de atualização para todos os componentes que usam carteiras
      if (data.wallet) {
        emitWalletUpdate({
          walletId: wallet.id,
          wallet: data.wallet
        });
        
        // Atualizar a rota atual
        router.refresh();
      }
      
      // Notificar o componente pai com os dados atualizados da carteira
      if (onImportComplete) {
        onImportComplete(data.wallet);
      }
    } catch (error) {
      console.error('Erro ao importar transações:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao importar transações');
    } finally {
      setIsImporting(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setParsedTransactions([]);
    setError(null);
    setFileIdentifier(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setCurrentPage(1);
    setShowCategorySuggestions(false);
  };

  // Função para preparar transações para sugestões de categorias
  const handleShowCategorySuggestions = () => {
    if (parsedTransactions.length === 0) {
      toast.error("Importe transações antes de solicitar sugestões de categorias.");
      return;
    }
    
    setShowCategorySuggestions(true);
  };
  
  // Função para aplicar as categorizações sugeridas
  const handleApplySuggestions = (categorizedTransactions: any[]) => {
    setParsedTransactions(categorizedTransactions);
    setShowCategorySuggestions(false);
    
    toast.success("As categorias sugeridas foram aplicadas às transações.");
  };

  // Renderizar controles de paginação
  const renderPagination = () => {
    if (totalPages <= 1) return null;

    return (
      <div className="mt-2 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-2">
          <span className="text-muted-foreground">
            Mostrar
          </span>
          <Select 
            value={String(itemsPerPage)} 
            onValueChange={(value) => {
              setItemsPerPage(Number(value));
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="h-6 w-[60px] text-xs">
              <SelectValue placeholder={itemsPerPage} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="15">15</SelectItem>
              <SelectItem value="20">20</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-muted-foreground">
            por página
          </span>
        </div>

        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <Button 
                variant="outline" 
                size="icon" 
                className="h-6 w-6" 
                onClick={() => paginate(1)}
                disabled={currentPage === 1}
              >
                <ChevronsLeft className="h-3 w-3" />
              </Button>
            </PaginationItem>
            
            <PaginationItem>
              <Button 
                variant="outline" 
                size="icon" 
                className="h-6 w-6" 
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-3 w-3" />
              </Button>
            </PaginationItem>
            
            <PaginationItem>
              <span className="text-xs px-1">
                {currentPage} de {totalPages}
              </span>
            </PaginationItem>
            
            <PaginationItem>
              <Button 
                variant="outline" 
                size="icon" 
                className="h-6 w-6" 
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-3 w-3" />
              </Button>
            </PaginationItem>
            
            <PaginationItem>
              <Button 
                variant="outline" 
                size="icon" 
                className="h-6 w-6" 
                onClick={() => paginate(totalPages)}
                disabled={currentPage === totalPages}
              >
                <ChevronsRight className="h-3 w-3" />
              </Button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>

        <div className="text-muted-foreground">
          Total: {parsedTransactions.length} transações
        </div>
      </div>
    );
  };

  return (
    <Card className="shadow-sm border">
      <CardHeader className="px-4 py-3 space-y-1">
        <CardTitle className="text-base">Importar transações via OFX</CardTitle>
        <CardDescription className="text-xs">
          Selecione um arquivo OFX exportado do seu banco para importar transações para esta carteira.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="px-4 py-2 space-y-2">
        {!file && (
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center ${
              isDragging ? 'border-primary bg-primary/5' : 'border-gray-300'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <FileUpIcon className="h-8 w-8 mx-auto text-gray-400 mb-2" />
            <h3 className="text-sm font-medium text-gray-900 mb-1">
              Arraste e solte um arquivo OFX
            </h3>
            <p className="text-xs text-gray-500 mb-3">
              ou clique para selecionar um arquivo
            </p>
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".ofx"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileSelect(e.target.files[0]);
                }
              }}
            />
            
            <Button 
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              Selecionar Arquivo
            </Button>
          </div>
        )}
        
        {isLoading && (
          <div className="py-6 text-center">
            <Loader2 className="h-6 w-6 mx-auto animate-spin text-primary mb-2" />
            <p className="text-xs text-gray-500">Analisando o arquivo OFX...</p>
          </div>
        )}
        
        {error && (
          <Alert variant="destructive" className="mt-2 py-2">
            <AlertCircle className="h-3 w-3" />
            <AlertTitle className="text-xs font-medium">Erro ao processar o arquivo</AlertTitle>
            <AlertDescription className="text-xs">{error}</AlertDescription>
          </Alert>
        )}
        
        {file && parsedTransactions.length > 0 && (
          <>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium">Arquivo analisado</h3>
                <p className="text-xs text-gray-500">{file.name}</p>
              </div>
              
              <Button variant="ghost" size="sm" onClick={resetForm} className="h-7 text-xs">
                Selecionar outro arquivo
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-2 mb-2">
              <Card className="shadow-sm border">
                <CardContent className="p-3">
                  <div className="text-xs text-gray-500 mb-1">Total de transações</div>
                  <div className="text-sm font-medium">{parsedTransactions.length}</div>
                </CardContent>
              </Card>
              <Card className="shadow-sm border">
                <CardContent className="p-3">
                  <div className="text-xs text-gray-500 mb-1">Valor Total</div>
                  <div className="text-sm font-medium">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(
                      parsedTransactions.reduce(
                        (total, transaction) => total + parseFloat(String(transaction.amount)),
                        0
                      )
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="rounded-md border shadow-sm overflow-hidden">
              <Table className="w-full">
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="w-[100px] py-2 text-xs">Data</TableHead>
                    <TableHead className="w-[180px] py-2 text-xs">Descrição</TableHead>
                    <TableHead className="w-[80px] text-right py-2 text-xs">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="text-xs">
                  {currentTransactions.map((transaction, index) => (
                    <TableRow key={index} className="hover:bg-muted/30">
                      <TableCell className="py-1.5 font-medium">
                        {new Date(transaction.date as string).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="py-1.5">
                        {normalizeDescription(transaction.description as string || '')}
                      </TableCell>
                      <TableCell className="text-right py-1.5">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(parseFloat(String(transaction.amount)))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            <div className="flex items-center justify-between mt-2">
              <div className="text-xs text-gray-500">
                Mostrando {indexOfFirstItem + 1} a {Math.min(indexOfLastItem, parsedTransactions.length)} de {parsedTransactions.length}
              </div>
              
              <div className="flex space-x-1 items-center">
                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={(value) => {
                    setItemsPerPage(parseInt(value));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-[80px] h-7 text-xs">
                    <SelectValue placeholder="5" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5" className="text-xs">5 itens</SelectItem>
                    <SelectItem value="10" className="text-xs">10 itens</SelectItem>
                    <SelectItem value="20" className="text-xs">20 itens</SelectItem>
                  </SelectContent>
                </Select>
                
                <div className="flex space-x-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    disabled={currentPage === 1}
                    onClick={() => paginate(1)}
                  >
                    <ChevronsLeft className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    disabled={currentPage === 1}
                    onClick={() => paginate(currentPage - 1)}
                  >
                    <ChevronLeft className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    disabled={currentPage >= totalPages}
                    onClick={() => paginate(currentPage + 1)}
                  >
                    <ChevronRight className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    disabled={currentPage >= totalPages}
                    onClick={() => paginate(totalPages)}
                  >
                    <ChevronsRight className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
      
      {showCategorySuggestions ? (
        <div className="mb-6 px-4">
          <CategorySuggestions 
            transactions={parsedTransactions.map(t => ({
              id: t.id,
              description: t.description,
              amount: t.amount,
              date: typeof t.date === 'string' ? t.date : t.date.toISOString(),
              category: t.type === 'DEPOSIT' ? 'Receita' : '' // Categoria padrão básica
            }))}
            onApplySuggestions={handleApplySuggestions}
            onCancel={() => setShowCategorySuggestions(false)}
          />
        </div>
      ) : null}
      
      <CardFooter className="flex justify-end gap-2 pt-0 px-4 pb-3">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={resetForm} 
          disabled={isImporting}
          className="h-7 text-xs"
        >
          Cancelar
        </Button>
        <Button 
          onClick={handleImport} 
          disabled={isImporting}
          size="sm" 
          className="h-7 text-xs gap-1"
        >
          {isImporting ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              Importando...
            </>
          ) : (
            <>
              <CheckIcon className="h-3 w-3" />
              Importar {parsedTransactions.length} transações
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
} 