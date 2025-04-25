"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/app/_components/ui/button";
import { Input } from "@/app/_components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/app/_components/ui/select";
import { Calendar } from "@/app/_components/ui/calendar";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/app/_components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Search, RefreshCw } from "lucide-react";
import { DateRange } from "react-day-picker";

interface TransactionFiltersProps {
  startDate: Date;
  endDate: Date;
  searchQuery: string;
  transactionType: string;
  walletId?: string;
  wallets?: { id: string; name: string }[];
}

export function TransactionFilters({
  startDate,
  endDate,
  searchQuery,
  transactionType,
  walletId = '',
  wallets = []
}: TransactionFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [search, setSearch] = useState(searchQuery);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startDate,
    to: endDate
  });
  const [type, setType] = useState(transactionType || "ALL");
  const [selectedWalletId, setSelectedWalletId] = useState(walletId || "all");

  console.log('[FILTERS] Valores iniciais:', {
    search,
    dateRange,
    type,
    selectedWalletId
  });

  // Função para atualizar a URL com os filtros
  const applyFilters = () => {
    const params = new URLSearchParams();
    
    if (dateRange?.from) {
      params.set("startDate", dateRange.from.toISOString());
    }
    
    if (dateRange?.to) {
      params.set("endDate", dateRange.to.toISOString());
    }
    
    if (search) {
      params.set("query", search);
    }
    
    // Adicionar tipo somente se não for ALL (todos)
    if (type && type !== "ALL") {
      params.set("type", type);
    }
    
    // Adicionar carteira se selecionada e não for "all"
    if (selectedWalletId && selectedWalletId !== "all") {
      params.set("walletId", selectedWalletId);
    }
    
    const newUrl = `${pathname}?${params.toString()}`;
    console.log('[FILTERS] Aplicando filtros. Nova URL:', newUrl);
    router.push(newUrl);
  };

  // Aplicar filtros quando o usuário pressionar Enter na busca
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      applyFilters();
    }
  };

  // Limpar todos os filtros
  const clearFilters = () => {
    const today = new Date();
    // Definir para o mês atual em vez de limpar completamente
    setDateRange({
      from: new Date(today.getFullYear(), today.getMonth(), 1),
      to: new Date(today.getFullYear(), today.getMonth() + 1, 0)
    });
    setSearch("");
    setType("ALL");
    setSelectedWalletId("all");
    
    // Aplicar os filtros com o mês atual
    const params = new URLSearchParams();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    params.set("startDate", firstDay.toISOString());
    params.set("endDate", lastDay.toISOString());
    
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Filtro de data */}
        <div className="flex-1">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from && dateRange?.to ? (
                  <>
                    {format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })} - {format(dateRange.to, "dd/MM/yyyy", { locale: ptBR })}
                  </>
                ) : (
                  <span>Selecione um período</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={(range) => setDateRange(range)}
                locale={ptBR}
                initialFocus
              />
              <div className="flex justify-end gap-2 p-3">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    const today = new Date();
                    setDateRange({
                      from: new Date(today.getFullYear(), today.getMonth(), 1),
                      to: new Date(today.getFullYear(), today.getMonth() + 1, 0)
                    });
                  }}
                >
                  Mês Atual
                </Button>
                <Button 
                  size="sm"
                  onClick={() => {
                    applyFilters();
                    document.body.click(); // Fechar o popover
                  }}
                >
                  Aplicar
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Campo de busca */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar transações..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className="pl-10"
          />
        </div>

        {/* Filtro de tipo */}
        <div className="w-full md:w-48">
          <Select
            value={type}
            onValueChange={(value) => {
              setType(value);
              setTimeout(() => applyFilters(), 100);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos</SelectItem>
              <SelectItem value="INCOME">Receitas</SelectItem>
              <SelectItem value="DEPOSIT">Depósitos</SelectItem>
              <SelectItem value="EXPENSE">Despesas</SelectItem>
              <SelectItem value="INVESTMENT">Investimentos</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Filtro de carteiras */}
        {wallets.length > 0 && (
          <div className="w-full md:w-48">
            <Select
              value={selectedWalletId}
              onValueChange={(value) => {
                setSelectedWalletId(value);
                setTimeout(() => applyFilters(), 100);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas carteiras" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas carteiras</SelectItem>
                {wallets.map(wallet => (
                  <SelectItem key={wallet.id} value={wallet.id}>
                    {wallet.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Botões de ação */}
      <div className="flex justify-between">
        <Button 
          variant="outline" 
          size="sm"
          onClick={clearFilters}
          className="text-muted-foreground"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Limpar filtros
        </Button>
        
        <div className="flex gap-2">
          <Button 
            variant="outline"
            size="sm"
            onClick={applyFilters}
          >
            <Search className="mr-2 h-4 w-4" />
            Buscar
          </Button>
          
          <Button 
            size="sm"
            onClick={() => {
              // Adicionar parâmetro especial para forçar busca no extrato
              const params = new URLSearchParams();
              
              if (dateRange?.from) {
                params.set("startDate", dateRange.from.toISOString());
              }
              
              if (dateRange?.to) {
                params.set("endDate", dateRange.to.toISOString());
              }
              
              if (search) {
                params.set("query", search);
              }
              
              // Adicionar tipo somente se não for ALL (todos)
              if (type && type !== "ALL") {
                params.set("type", type);
              }
              
              // Adicionar carteira se selecionada e não for "all"
              if (selectedWalletId && selectedWalletId !== "all") {
                params.set("walletId", selectedWalletId);
              }
              
              // Adicionar parâmetro para forçar busca no extrato
              params.set("forceExtract", "true");
              
              const newUrl = `${pathname}?${params.toString()}`;
              console.log('[FILTERS] Buscando no extrato. Nova URL:', newUrl);
              router.push(newUrl);
            }}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Search className="mr-2 h-4 w-4" />
            Buscar no Extrato Bancário
          </Button>
        </div>
      </div>
    </div>
  );
} 