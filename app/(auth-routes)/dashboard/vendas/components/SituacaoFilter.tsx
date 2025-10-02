"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/_components/ui/select";
import { Label } from "@/app/_components/ui/label";
import { Badge } from "@/app/_components/ui/badge";
import { CheckCircle, Clock, XCircle, AlertCircle, Filter } from "lucide-react";

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
}

/**
 * Componente para filtrar vendas por situação
 * Similar ao filtro usado no Gestão Click
 */
export const SituacaoFilter: React.FC<SituacaoFilterProps> = ({
  value,
  onChange,
  className = ""
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
   * Valor atual do select baseado nas situações selecionadas
   */
  const selectValue = useMemo(() => {
    if (value.length === 0) return "all";
    if (value.length === 1) return value[0];
    return "multiple";
  }, [value]);

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

  // REMOVIDO: useEffect que causava loop infinito
  // As situações padrão já são definidas no useState inicial

  return (
    <div className={`ios26-animate-fade-in ${className}`}>
      <Label htmlFor="situacao-filter" className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
        <div className="p-1.5 bg-gradient-to-br from-orange-100 to-yellow-100 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-lg">
          <Filter className="h-3 w-3 text-orange-600 dark:text-orange-400" />
        </div>
        Situação
      </Label>
      <Select 
        value={selectValue} 
        onValueChange={handleValueChange}
        disabled={isLoading}
      >
        <SelectTrigger 
          id="situacao-filter" 
          className="w-full ios26-card p-3 border-0 transition-all duration-300 hover:shadow-lg"
        >
          <SelectValue placeholder={getPlaceholderText()}>
            <div className="flex items-center gap-2">
              {value.length > 1 && (
                <Badge variant="secondary" className="ios26-badge text-xs">
                  {value.length}
                </Badge>
              )}
              <span className="truncate font-medium">{getPlaceholderText()}</span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="ios26-card border-0 shadow-xl">
          <SelectItem 
            value="all"
            className="rounded-xl hover:bg-muted/50 transition-all duration-200 my-1"
          >
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-gradient-to-br from-orange-100 to-yellow-100 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-lg">
                <Filter className="h-3 w-3 text-orange-600 dark:text-orange-400" />
              </div>
              <span className="font-medium">Todas as situações</span>
            </div>
          </SelectItem>
          
          {situacoes.slice(1).map((situacao) => (
            <SelectItem 
              key={situacao.id} 
              value={situacao.id}
              className="rounded-xl hover:bg-muted/50 transition-all duration-200 my-1 group"
            >
              <div className="flex items-center gap-3 w-full">
                <div className="p-1.5 bg-gradient-to-br from-orange-100 to-yellow-100 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-lg group-hover:scale-110 transition-transform duration-200">
                  {getSituacaoIcon(situacao.nome) || <AlertCircle className="h-3 w-3 text-orange-600 dark:text-orange-400" />}
                </div>
                <span className="flex-1 font-medium">{situacao.nome}</span>
                <Badge 
                  variant={situacao.cor as any}
                  className="ios26-badge text-xs ml-auto"
                >
                  {situacao.nome}
                </Badge>
                {value.includes(situacao.id) && (
                  <CheckCircle className="h-3 w-3 text-orange-600 dark:text-orange-400 ml-1" />
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {/* Exibir badges das situações selecionadas */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3 ios26-animate-scale-in">
          {value.map(situacaoId => {
            const situacao = situacoes.find(s => s.id === situacaoId);
            if (!situacao) return null;
            
            return (
              <Badge 
                key={situacaoId}
                variant={situacao.cor as any}
                className="ios26-badge cursor-pointer hover:opacity-80 transition-all duration-200 hover:scale-105 group"
                onClick={() => handleValueChange(situacaoId)}
              >
                <span className="flex items-center gap-1.5">
                  <div className="p-0.5 bg-gradient-to-br from-orange-100 to-yellow-100 dark:from-orange-900/20 dark:to-yellow-900/20 rounded group-hover:scale-110 transition-transform duration-200">
                    {getSituacaoIcon(situacao.nome) || <AlertCircle className="h-2.5 w-2.5 text-orange-600 dark:text-orange-400" />}
                  </div>
                  <span className="font-medium">{situacao.nome}</span>
                  <XCircle className="h-3 w-3 ml-1 hover:text-destructive transition-colors duration-200" />
                </span>
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SituacaoFilter;
