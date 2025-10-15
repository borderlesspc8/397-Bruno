"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { 
  Calendar, 
  Clock, 
  Monitor, 
  MapPin, 
  Search, 
  Filter, 
  ArrowUpDown,
  Loader2,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

import { Input } from "@/app/_components/ui/input";
import { Button } from "@/app/_components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/_components/ui/select";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/app/_components/ui/pagination";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/app/_components/ui/dropdown-menu";

// Tipos para o histórico de atividades
interface ActivityItem {
  id: string;
  description: string;
  type: "login" | "transaction" | "setting_change" | "account" | "security";
  timestamp: string; // ISO date string
  ipAddress: string;
  device: string;
  location: string;
}

// Dados mockados (em uma aplicação real viriam da API)
const mockActivityHistory: ActivityItem[] = [
  {
    id: "act-1",
    description: "Login bem-sucedido",
    type: "login",
    timestamp: "2023-05-15T14:30:00Z",
    ipAddress: "187.122.45.123",
    device: "Chrome em macOS",
    location: "São Paulo, Brasil"
  },
  {
    id: "act-2",
    description: "Alteração de senha",
    type: "security",
    timestamp: "2023-05-14T18:15:00Z",
    ipAddress: "187.122.45.123",
    device: "Chrome em macOS",
    location: "São Paulo, Brasil"
  },
  {
    id: "act-3",
    description: "Transferência realizada para Conta 4321-X",
    type: "transaction",
    timestamp: "2023-05-14T10:22:00Z",
    ipAddress: "187.122.45.123",
    device: "Safari em iOS",
    location: "São Paulo, Brasil"
  },
  {
    id: "act-4",
    description: "Conexão com Banco do Brasil",
    type: "account",
    timestamp: "2023-05-13T09:15:00Z",
    ipAddress: "187.122.45.123",
    device: "Firefox em Windows",
    location: "Rio de Janeiro, Brasil"
  },
  {
    id: "act-5",
    description: "Alteração nas preferências de notificação",
    type: "setting_change",
    timestamp: "2023-05-12T16:40:00Z",
    ipAddress: "45.188.32.198",
    device: "Chrome em macOS",
    location: "São Paulo, Brasil"
  },
  {
    id: "act-6",
    description: "Login bem-sucedido",
    type: "login",
    timestamp: "2023-05-12T11:05:00Z",
    ipAddress: "45.188.32.198",
    device: "Safari em iOS",
    location: "São Paulo, Brasil"
  },
  {
    id: "act-7",
    description: "Atualização de dados pessoais",
    type: "setting_change",
    timestamp: "2023-05-10T14:32:00Z",
    ipAddress: "45.188.32.198",
    device: "Chrome em macOS",
    location: "São Paulo, Brasil"
  },
  {
    id: "act-8",
    description: "Login bem-sucedido",
    type: "login",
    timestamp: "2023-05-10T14:20:00Z",
    ipAddress: "187.122.45.123",
    device: "Chrome em macOS",
    location: "São Paulo, Brasil"
  },
  {
    id: "act-9",
    description: "Transferência realizada para Conta 7890-Y",
    type: "transaction",
    timestamp: "2023-05-09T09:55:00Z",
    ipAddress: "187.122.45.123",
    device: "Chrome em macOS",
    location: "São Paulo, Brasil"
  },
  {
    id: "act-10",
    description: "Login bem-sucedido",
    type: "login",
    timestamp: "2023-05-08T17:12:00Z",
    ipAddress: "187.122.45.123",
    device: "Chrome em macOS",
    location: "São Paulo, Brasil"
  },
  {
    id: "act-11",
    description: "Ativação de notificações por email",
    type: "setting_change",
    timestamp: "2023-05-07T12:18:00Z",
    ipAddress: "187.122.45.123",
    device: "Chrome em macOS",
    location: "São Paulo, Brasil"
  },
  {
    id: "act-12",
    description: "Login bem-sucedido",
    type: "login",
    timestamp: "2023-05-07T12:15:00Z",
    ipAddress: "45.188.32.198",
    device: "Safari em iOS",
    location: "São Paulo, Brasil"
  },
];

// Funções auxiliares para renderizar o tipo de atividade com ícone
const getActivityTypeIcon = (type: ActivityItem['type']) => {
  switch (type) {
    case "login":
      return <Monitor className="h-4 w-4 text-blue-500" />;
    case "transaction":
      return <Calendar className="h-4 w-4 text-green-500" />;
    case "setting_change":
      return <Filter className="h-4 w-4 text-purple-500" />;
    case "account":
      return <Calendar className="h-4 w-4 text-orange-500" />;
    case "security":
      return <Calendar className="h-4 w-4 text-red-500" />;
    default:
      return <Calendar className="h-4 w-4 text-gray-500" />;
  }
};

const getActivityTypeName = (type: ActivityItem['type']) => {
  switch (type) {
    case "login":
      return "Acesso";
    case "transaction":
      return "Transação";
    case "setting_change":
      return "Configuração";
    case "account":
      return "Conta";
    case "security":
      return "Segurança";
    default:
      return "Outros";
  }
};

interface ActivityHistoryProps {
  user: any;
}

export default function ActivityHistory({ user }: ActivityHistoryProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  
  const itemsPerPage = 5;
  
  // Simula o carregamento de dados da API
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        // Em uma aplicação real, buscar da API:
        // const response = await fetch('/api/user/activities');
        // const data = await response.json();
        
        // Usando dados mockados para simulação
        await new Promise(resolve => setTimeout(resolve, 1000));
        setActivities(mockActivityHistory);
      } catch (error) {
        console.error("Erro ao buscar histórico de atividades:", error);
        toast.error("Erro ao carregar histórico de atividades");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchActivities();
  }, []);
  
  // Filtra e ordena as atividades
  useEffect(() => {
    let result = [...activities];
    
    // Filtrar por tipo
    if (selectedType !== "all") {
      result = result.filter(item => item.type === selectedType);
    }
    
    // Filtrar por texto de busca
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        item => 
          item.description.toLowerCase().includes(query) ||
          item.location.toLowerCase().includes(query) ||
          item.device.toLowerCase().includes(query)
      );
    }
    
    // Ordenar por data
    result.sort((a, b) => {
      const dateA = new Date(a.timestamp).getTime();
      const dateB = new Date(b.timestamp).getTime();
      return sortDirection === "asc" ? dateA - dateB : dateB - dateA;
    });
    
    setFilteredActivities(result);
    setCurrentPage(1); // Reset para a primeira página ao filtrar
  }, [activities, searchQuery, selectedType, sortDirection]);
  
  // Calcula a paginação
  const totalPages = Math.ceil(filteredActivities.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedActivities = filteredActivities.slice(startIndex, startIndex + itemsPerPage);
  
  // Formatação de data/hora
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  return (
    <div className="space-y-4">
      {/* Filtros e busca */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar atividades..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <Select 
          value={selectedType} 
          onValueChange={setSelectedType}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Tipo de Atividade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas Atividades</SelectItem>
            <SelectItem value="login">Acessos</SelectItem>
            <SelectItem value="transaction">Transações</SelectItem>
            <SelectItem value="setting_change">Configurações</SelectItem>
            <SelectItem value="account">Conta</SelectItem>
            <SelectItem value="security">Segurança</SelectItem>
          </SelectContent>
        </Select>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full sm:w-auto">
              <ArrowUpDown className="mr-2 h-4 w-4" />
              {sortDirection === "desc" ? "Mais Recentes" : "Mais Antigas"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setSortDirection("desc")}>
              Mais Recentes
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortDirection("asc")}>
              Mais Antigas
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Lista de atividades */}
      {isLoading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : paginatedActivities.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <p className="text-muted-foreground mb-2">Nenhuma atividade encontrada</p>
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchQuery("");
                setSelectedType("all");
              }}
            >
              Limpar Filtros
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {paginatedActivities.map((activity) => (
            <Card key={activity.id} className="overflow-hidden">
              <CardHeader className="p-4 pb-2 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getActivityTypeIcon(activity.type)}
                    <CardTitle className="text-base">
                      {activity.description}
                    </CardTitle>
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <span className="rounded-full px-2 py-1 bg-muted">
                      {getActivityTypeName(activity.type)}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{formatDateTime(activity.timestamp)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Monitor className="h-4 w-4 text-muted-foreground" />
                  <span>{activity.device}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <span>IP: {activity.ipAddress}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{activity.location}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* Paginação */}
      {!isLoading && totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              {currentPage === 1 ? (
                <span className="flex items-center gap-1 pl-2.5 opacity-50 cursor-not-allowed">
                  <ChevronLeft className="h-4 w-4" />
                  <span>Anterior</span>
                </span>
              ) : (
                <PaginationPrevious 
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentPage(prev => Math.max(1, prev - 1));
                  }}
                />
              )}
            </PaginationItem>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <PaginationItem key={page}>
                <PaginationLink
                  href="#"
                  isActive={page === currentPage}
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentPage(page);
                  }}
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            ))}
            
            <PaginationItem>
              {currentPage === totalPages ? (
                <span className="flex items-center gap-1 pr-2.5 opacity-50 cursor-not-allowed">
                  <span>Próxima</span>
                  <ChevronRight className="h-4 w-4" />
                </span>
              ) : (
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentPage(prev => Math.min(totalPages, prev + 1));
                  }}
                />
              )}
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
} 
