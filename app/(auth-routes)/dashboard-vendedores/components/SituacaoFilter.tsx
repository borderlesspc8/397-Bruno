"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Label } from "@/app/_components/ui/label";
import { Badge } from "@/app/_components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/app/_components/ui/dialog";
import { CheckCircle, Clock, XCircle, AlertCircle, Filter, ChevronDown } from "lucide-react";

// Situações padrão baseadas no sistema
const SITUACOES_PADRAO = [
  { id: "all", nome: "Todas as situações", descricao: "Todas as situações", cor: "default" },
  { id: "concretizada", nome: "Concretizada", descricao: "Vendas concretizadas", cor: "success" },
  { id: "em_andamento", nome: "Em andamento", descricao: "Vendas em andamento", cor: "warning" },
  { id: "cancelada", nome: "Cancelada", descricao: "Vendas canceladas", cor: "destructive" },
  { id: "pendente", nome: "Pendente", descricao: "Vendas pendentes", cor: "secondary" }
];

interface SituacaoFilterProps {
  value: string[];
  onChange: (situacoes: string[]) => void;
  className?: string;
  defaultSelected?: string[]; // Adicionar prop para valores padrão
}

/**
 * Componente para filtrar vendas por situação
 * Similar ao filtro usado no Gestão Click
 */
export const SituacaoFilter: React.FC<SituacaoFilterProps> = ({
  value,
  onChange,
  className = "",
  defaultSelected = ["concretizada"] // Padrão: apenas "Concretizada" selecionada
}) => {
  const [situacoes, setSituacoes] = useState(SITUACOES_PADRAO);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Busca situações de vendas da API - CORRIGIDO PARA EVITAR LOOPS
   */
  const fetchSituacoes = useCallback(async () => {
    // Usar apenas situações padrão sem fazer requisições para evitar loops
    setSituacoes(SITUACOES_PADRAO);
    setIsLoading(false);
  }, []);

  /**
   * Define a cor do badge baseada no nome da situação
   */
  const getSituacaoCor = (nome: string): string => {
    const nomeNormalizado = nome.toLowerCase();
    
    if (nomeNormalizado.includes('concretizada') || nomeNormalizado.includes('confirmada')) {
      return 'success';
    } else if (nomeNormalizado.includes('andamento') || nomeNormalizado.includes('processando')) {
      return 'warning';
    } else if (nomeNormalizado.includes('cancelada') || nomeNormalizado.includes('rejeitada')) {
      return 'destructive';
    } else if (nomeNormalizado.includes('pendente') || nomeNormalizado.includes('aguardando')) {
      return 'secondary';
    }
    
    return 'default';
  };

  /**
   * Retorna o ícone apropriado para a situação
   */
  const getSituacaoIcon = (nome: string) => {
    const nomeNormalizado = nome.toLowerCase();
    
    if (nomeNormalizado.includes('concretizada') || nomeNormalizado.includes('confirmada')) {
      return <CheckCircle className="h-3 w-3" />;
    } else if (nomeNormalizado.includes('andamento') || nomeNormalizado.includes('processando')) {
      return <Clock className="h-3 w-3" />;
    } else if (nomeNormalizado.includes('cancelada') || nomeNormalizado.includes('rejeitada')) {
      return <XCircle className="h-3 w-3" />;
    } else if (nomeNormalizado.includes('pendente') || nomeNormalizado.includes('aguardando')) {
      return <AlertCircle className="h-3 w-3" />;
    }
    
    return null;
  };

  /**
   * Manipula mudança na seleção
   */
  const handleValueChange = (novoValor: string) => {
    if (novoValor === "all") {
      onChange([]);
    } else {
      // Toggle da situação selecionada
      const novasSituacoes = value.includes(novoValor)
        ? value.filter(s => s !== novoValor)
        : [...value, novoValor];
      
      onChange(novasSituacoes);
    }
  };

  /**
   * Texto do placeholder baseado na seleção atual
   */
  const getPlaceholderText = () => {
    if (value.length === 0) return "Todas as situações";
    if (value.length === 1) {
      const situacao = situacoes.find(s => s.id === value[0]);
      return situacao?.nome || "Situação selecionada";
    }
    return `${value.length} situações selecionadas`;
  };

  // Aplicar valor padrão quando o componente for montado
  useEffect(() => {
    if (value.length === 0 && defaultSelected.length > 0) {
      onChange(defaultSelected);
    }
  }, [value.length, defaultSelected, onChange]);

  return (
    <div className={`ios26-animate-fade-in ${className}`}>
      <Label className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
        <div className="p-1.5 bg-gradient-to-br from-orange-100 to-yellow-100 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-lg">
          <Filter className="h-3 w-3 text-orange-600 dark:text-orange-400" />
        </div>
        Situação
      </Label>
      
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[240px] ios26-card p-3 border-0 transition-all duration-300 hover:shadow-lg rounded-lg bg-background">
          <div className="flex items-center gap-2">
            {value.length > 1 && (
              <Badge variant="secondary" className="ios26-badge text-xs">
                {value.length}
              </Badge>
            )}
            <span className="truncate font-medium text-foreground">{getPlaceholderText()}</span>
          </div>
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <button 
              className="ios26-button flex items-center gap-2 px-4 py-2 text-sm font-semibold"
              disabled={isLoading}
            >
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline-block">Filtros</span>
              <ChevronDown className="h-4 w-4" />
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <div className="p-2 bg-gradient-to-br from-orange-100 to-yellow-100 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-xl">
                  <Filter className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                </div>
                Filtrar por Situação
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-2 mt-4">
              {situacoes.map((situacao) => (
                <button
                  key={situacao.id}
                  onClick={() => handleValueChange(situacao.id)}
                  className="w-full text-left px-3 py-2.5 text-sm rounded-xl hover:bg-muted/50 text-foreground transition-all duration-200 flex items-center gap-3 group"
                >
                  <div className="p-1.5 bg-gradient-to-br from-orange-100 to-yellow-100 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-lg group-hover:scale-110 transition-transform duration-200">
                    {situacao.id === "all" ? (
                      <Filter className="h-3 w-3 text-orange-600 dark:text-orange-400" />
                    ) : (
                      getSituacaoIcon(situacao.nome) || <AlertCircle className="h-3 w-3 text-orange-600 dark:text-orange-400" />
                    )}
                  </div>
                  <span className="font-medium flex-1">{situacao.nome}</span>
                  {situacao.id !== "all" && (
                    <Badge 
                      variant={situacao.cor as any}
                      className="ios26-badge text-xs"
                    >
                      {situacao.nome}
                    </Badge>
                  )}
                  {value.includes(situacao.id) && situacao.id !== "all" && (
                    <CheckCircle className="h-3 w-3 text-orange-600 dark:text-orange-400" />
                  )}
                  {value.length === 0 && situacao.id === "all" && (
                    <CheckCircle className="h-3 w-3 text-orange-600 dark:text-orange-400" />
                  )}
                </button>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
     
    
    </div>
  );
};

export default SituacaoFilter;
