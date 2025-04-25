"use client";

import * as React from "react";
import { 
  addDays, 
  startOfDay, 
  subDays, 
  subMonths, 
  startOfQuarter, 
  startOfYear, 
  startOfMonth 
} from "date-fns";
import { DateRange } from "react-day-picker";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/app/_components/ui/select";

/**
 * Interface do componente PeriodFilter
 * @param onChange Callback executada quando o intervalo de datas muda, retornando o objeto DateRange
 * @param value Valor atual selecionado
 * @param onValueChange Callback opcional executada quando o valor do período muda
 */
export interface PeriodFilterProps {
  onChange: (dateRange: DateRange) => void;
  value?: string;
  onValueChange?: (value: string) => void;
}

/**
 * Tipos de períodos predefinidos suportados pelo componente
 */
export type PredefinedPeriod = 
  | "15dias" 
  | "30dias" 
  | "45dias"
  | "trimestre"
  | "semestre"
  | "ano"
  | "todos"
  | "custom";

/**
 * Componente de filtro de períodos predefinidos
 * 
 * Este componente oferece uma lista de opções de períodos predefinidos que,
 * quando selecionados, calculam automaticamente o intervalo de datas correspondente.
 * 
 * @example
 * ```tsx
 * <PeriodFilter
 *   value={periodoSelecionado}
 *   onChange={(range) => {
 *     // Usar o intervalo de datas
 *     setDateRange(range);
 *   }}
 *   onValueChange={(periodo) => {
 *     // Usar o valor do período
 *     setPeriodoSelecionado(periodo);
 *   }}
 * />
 * ```
 */
export function PeriodFilter({ onChange, value = "30dias", onValueChange }: PeriodFilterProps) {
  const handlePeriodChange = (period: string) => {
    const today = startOfDay(new Date());
    let dateRange: DateRange;

    switch (period) {
      case "15dias":
        dateRange = {
          from: subDays(today, 14),
          to: today
        };
        break;
      case "30dias":
        dateRange = {
          from: subDays(today, 29),
          to: today
        };
        break;
      case "45dias":
        dateRange = {
          from: subDays(today, 44),
          to: today
        };
        break;
      case "trimestre":
        dateRange = {
          from: subMonths(today, 3),
          to: today
        };
        break;
      case "semestre":
        dateRange = {
          from: subMonths(today, 6),
          to: today
        };
        break;
      case "ano":
        dateRange = {
          from: subMonths(today, 12),
          to: today
        };
        break;
      case "todos":
        // Para 'todos', retornamos um objeto especial que será tratado pelo aplicarPeriodoPredefinido
        dateRange = {
          from: undefined,
          to: undefined
        };
        break;
      default:
        // Padrão é 30 dias
        dateRange = {
          from: subDays(today, 29),
          to: today
        };
    }

    // Chamar a callback onChange
    onChange(dateRange);

    // Chamar a callback onValueChange se existir
    if (onValueChange) {
      onValueChange(period);
    }
  };

  return (
    <Select
      value={value}
      onValueChange={handlePeriodChange}
    >
      <SelectTrigger className="w-full sm:w-[200px]">
        <SelectValue placeholder="Selecione o período" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="15dias">Últimos 15 dias</SelectItem>
        <SelectItem value="30dias">Últimos 30 dias</SelectItem>
        <SelectItem value="45dias">Últimos 45 dias</SelectItem>
        <SelectItem value="trimestre">Trimestre atual</SelectItem>
        <SelectItem value="semestre">Semestre atual</SelectItem>
        <SelectItem value="ano">Último ano</SelectItem>
        <SelectItem value="todos">Todo o período (todas as transações)</SelectItem>
      </SelectContent>
    </Select>
  );
} 