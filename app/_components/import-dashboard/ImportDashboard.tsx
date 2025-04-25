"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  ArrowUpDown, 
  Calendar, 
  Download, 
  ExternalLink, 
  Filter, 
  RefreshCw, 
  Search, 
  Trash2, 
  X,
  Clock
} from "lucide-react";
import { DateRange } from "react-day-picker";

import { Button } from "@/app/_components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { Input } from "@/app/_components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/_components/ui/select";
import { Skeleton } from "@/app/_components/ui/skeleton";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/app/_components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/_components/ui/dropdown-menu";
import { DatePickerWithRange } from "@/app/_components/ui/date-range-picker";
import { Badge } from "@/app/_components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/app/_components/ui/alert";

import ImportMenu from "./ImportMenu";

// Componente para exibir o status da importação com cores específicas
const StatusBadge = ({ status }: { status: string }) => {
  const getStatusConfig = () => {
    switch (status) {
      case "PENDING":
        return { label: "Pendente", variant: "outline" as const };
      case "IN_PROGRESS":
        return { label: "Em andamento", variant: "secondary" as const };
      case "COMPLETED":
      case "SUCCESS":
        return { label: "Concluído", variant: "default" as const, className: "bg-green-600" };
      case "FAILED":
      case "ERROR":
        return { label: "Falha", variant: "destructive" as const };
      case "CANCELLED":
        return { label: "Cancelado", variant: "outline" as const };
      default:
        return { label: status, variant: "outline" as const };
    }
  };

  const config = getStatusConfig();

  return (
    <Badge variant={config.variant} className={config.className}>
      {config.label}
    </Badge>
  );
};

export default function ImportDashboard() {
  const router = useRouter();
  
  // Estados
  const [imports, setImports] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Paginação e filtros
  const [filters, setFilters] = useState({
    source: "GESTAO_CLICK",
    status: "all",
    search: "",
    dateRange: undefined as DateRange | undefined,
    page: 1,
    limit: 10
  });
  
  const [totalImports, setTotalImports] = useState(0);
  
  // Carregar importações ao inicializar e quando filtros mudam
  useEffect(() => {
    loadDashboardData();
  }, [filters.page, filters.limit, filters.source, filters.status]);
  
  // Função para carregar dados do dashboard
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Construir queryString para filtros
      const queryParams = new URLSearchParams();
      queryParams.append("limit", filters.limit.toString());
      queryParams.append("offset", ((filters.page - 1) * filters.limit).toString());
      
      if (filters.source && filters.source !== "all") {
        queryParams.append("source", filters.source);
      }
      
      if (filters.status && filters.status !== "all") {
        queryParams.append("status", filters.status);
      }
      
      if (filters.dateRange?.from) {
        queryParams.append("startDate", filters.dateRange.from.toISOString());
      }
      
      if (filters.dateRange?.to) {
        queryParams.append("endDate", filters.dateRange.to.toISOString());
      }
      
      // Buscar importações
      const response = await fetch(`/api/import-history?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Erro ao buscar importações: ${response.statusText}`);
      }
      
      const data = await response.json();
      setImports(data.imports || []);
      setTotalImports(data.total || 0);
      
      // Buscar resumo
      const summaryResponse = await fetch("/api/import-history/summary");
      
      if (summaryResponse.ok) {
        const summaryData = await summaryResponse.json();
        setSummary(summaryData);
      }
    } catch (err: any) {
      console.error("Erro ao carregar dashboard:", err);
      setError(`Erro ao carregar dashboard: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Resetar filtros
  const resetFilters = () => {
    setFilters({
      source: "GESTAO_CLICK",
      status: "all",
      search: "",
      dateRange: undefined,
      page: 1,
      limit: 10
    });
  };
  
  // Atualizar filtros
  const updateFilters = (newFilters: Partial<typeof filters>) => {
    // Resetar página ao aplicar novos filtros
    if (Object.keys(newFilters).some(key => key !== 'page')) {
      setFilters({ ...filters, ...newFilters, page: 1 });
    } else {
      setFilters({ ...filters, ...newFilters });
    }
  };
  
  // Cancelar importação
  const cancelImport = async (id: string) => {
    try {
      const response = await fetch(`/api/import-history/${id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ action: "cancel" })
      });
      
      if (!response.ok) {
        throw new Error(`Falha ao cancelar: ${response.statusText}`);
      }
      
      // Recarregar dados
      loadDashboardData();
    } catch (err: any) {
      console.error("Erro ao cancelar importação:", err);
      setError(`Erro ao cancelar importação: ${err.message}`);
    }
  };
  
  // Funções auxiliares
  const formatDuration = (seconds?: number) => {
    if (!seconds) return "-";
    
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    
    if (mins === 0) {
      return `${secs}s`;
    }
    
    return `${mins}m ${secs}s`;
  };
  
  // Cálculo de páginas
  const totalPages = Math.ceil(totalImports / filters.limit);
  
  return (
    <div>
      <ImportMenu />
      
      <div className="grid gap-6">
        {/* Título e botões de ação */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard de Importações</h1>
            <p className="text-muted-foreground">
              Gerencie e visualize o histórico de importações de dados do Gestão Click
            </p>
          </div>
          <Button onClick={() => router.push("/wallets/import")}>
            Nova Importação
          </Button>
        </div>
        
        {/* Cards de resumo */}
        {summary && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total de Importações</CardTitle>
                <Download className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.total}</div>
                <p className="text-xs text-muted-foreground">
                  {summary.lastWeekCount} importações nos últimos 7 dias
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Importações Concluídas</CardTitle>
                <Download className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.completed}</div>
                <p className="text-xs text-muted-foreground">
                  {Math.round((summary.completed / (summary.total || 1)) * 100)}% de taxa de sucesso
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Importações Falhas</CardTitle>
                <Trash2 className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.failed}</div>
                <p className="text-xs text-muted-foreground">
                  {Math.round((summary.failed / (summary.total || 1)) * 100)}% de taxa de falha
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
                <Clock className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.inProgress}</div>
                <p className="text-xs text-muted-foreground">
                  {summary.pending} pendentes para execução
                </p>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
            <CardDescription>Filtre as importações por período, status ou fonte</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Fonte</label>
                <Select 
                  value={filters.source} 
                  onValueChange={(value) => updateFilters({ source: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a fonte" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GESTAO_CLICK">Gestão Click</SelectItem>
                    <SelectItem value="EXCEL">Excel</SelectItem>
                    <SelectItem value="MANUAL">Manual</SelectItem>
                    <SelectItem value="all">Todas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Status</label>
                <Select 
                  value={filters.status} 
                  onValueChange={(value) => updateFilters({ status: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">Pendente</SelectItem>
                    <SelectItem value="IN_PROGRESS">Em andamento</SelectItem>
                    <SelectItem value="COMPLETED">Concluído</SelectItem>
                    <SelectItem value="FAILED">Falha</SelectItem>
                    <SelectItem value="CANCELLED">Cancelado</SelectItem>
                    <SelectItem value="all">Todos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Período</label>
                <DatePickerWithRange
                  dateRange={filters.dateRange}
                  onChange={(range) => updateFilters({ dateRange: range })}
                />
              </div>
              
              <div className="flex flex-col justify-end">
                <div className="flex space-x-2">
                  <Button variant="outline" onClick={resetFilters}>
                    Limpar Filtros
                  </Button>
                  <Button onClick={loadDashboardData}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Atualizar
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Exibir erro se houver */}
        {error && (
          <Alert variant="destructive">
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {/* Tabela de importações */}
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Importações</CardTitle>
            <CardDescription>
              {totalImports} importações encontradas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Fonte</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Itens</TableHead>
                  <TableHead>Início</TableHead>
                  <TableHead>Duração</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  // Esqueletos durante o carregamento
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={`skeleton-${index}`}>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-20" /></TableCell>
                    </TableRow>
                  ))
                ) : imports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6">
                      Nenhuma importação encontrada com os filtros selecionados
                    </TableCell>
                  </TableRow>
                ) : (
                  // Lista de importações
                  imports.map((importItem) => (
                    <TableRow key={importItem.id}>
                      <TableCell className="font-mono text-xs">
                        {importItem.id.substring(0, 8)}...
                      </TableCell>
                      <TableCell>{importItem.source}</TableCell>
                      <TableCell>
                        <StatusBadge status={importItem.status} />
                      </TableCell>
                      <TableCell>{importItem.totalItems}</TableCell>
                      <TableCell>
                        {importItem.startTime 
                          ? format(new Date(importItem.startTime), "dd/MM/yyyy HH:mm", { locale: ptBR })
                          : "-"
                        }
                      </TableCell>
                      <TableCell>{formatDuration(importItem.duration)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <ArrowUpDown className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuItem asChild>
                              <Link href={`/wallets/import-details/${importItem.id}`}>
                                <ExternalLink className="mr-2 h-4 w-4" />
                                Ver Detalhes
                              </Link>
                            </DropdownMenuItem>
                            {(importItem.status === "IN_PROGRESS" || importItem.status === "PENDING") && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => cancelImport(importItem.id)}>
                                  <X className="mr-2 h-4 w-4" />
                                  Cancelar
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter className="flex items-center justify-between border-t p-4">
            <div className="text-sm text-muted-foreground">
              Mostrando {imports.length} de {totalImports} importações
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateFilters({ page: Math.max(1, filters.page - 1) })}
                disabled={filters.page <= 1}
              >
                Anterior
              </Button>
              <div className="text-sm">
                Página {filters.page} de {totalPages || 1}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateFilters({ page: Math.min(totalPages, filters.page + 1) })}
                disabled={filters.page >= totalPages}
              >
                Próxima
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
} 