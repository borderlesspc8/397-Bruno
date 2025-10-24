'use client';

import { useState, useCallback } from 'react';
import { format, subMonths, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DateRangePicker } from '@/app/_components/ui/date-range-picker';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/app/_components/ui/dialog';
import { Label } from '@/app/_components/ui/label';
import { Calendar, ChevronDown } from 'lucide-react';
import { DateRange } from 'react-day-picker';

interface CEOTimeSelectorProps {
  selectedPeriod: {
    startDate: Date;
    endDate: Date;
  };
  onPeriodChange: (period: { startDate: Date; endDate: Date }) => void;
}

export function CEOTimeSelector({ selectedPeriod, onPeriodChange }: CEOTimeSelectorProps) {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  // Converter para o formato DateRange
  const dateRange: DateRange | undefined = {
    from: selectedPeriod.startDate,
    to: selectedPeriod.endDate
  };

  // Aplicar novo período
  const applyDateRange = useCallback((range: DateRange | undefined) => {
    if (!range?.from) return;
    
    const newFrom = range.from;
    const newTo = range.to || range.from;
    
    onPeriodChange({ 
      startDate: newFrom, 
      endDate: newTo
    });
  }, [onPeriodChange]);

  // Opções rápidas de período
  const periodPresets = [
    { 
      name: 'Mês Atual (até hoje)', 
      handler: () => {
        onPeriodChange({
          startDate: new Date(currentYear, currentMonth, 1),
          endDate: today
        });
      }
    },
    { 
      name: 'Mês Completo', 
      handler: () => {
        onPeriodChange({
          startDate: new Date(currentYear, currentMonth, 1),
          endDate: new Date(currentYear, currentMonth + 1, 0)
        });
      }
    },
    { 
      name: 'Mês Anterior', 
      handler: () => {
        const lastMonth = subMonths(today, 1);
        onPeriodChange({
          startDate: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1),
          endDate: endOfMonth(lastMonth)
        });
      }
    },
    { 
      name: 'Último Trimestre', 
      handler: () => {
        const quarter = Math.floor(currentMonth / 3);
        onPeriodChange({
          startDate: new Date(currentYear, quarter * 3, 1),
          endDate: today
        });
      }
    },
    { 
      name: 'Ano Atual', 
      handler: () => {
        onPeriodChange({
          startDate: new Date(currentYear, 0, 1),
          endDate: new Date(currentYear, 11, 31)
        });
      }
    }
  ];

  return (
    <div className="ios26-animate-fade-in">
      <Label className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
        <div className="p-1.5 bg-gradient-to-br from-orange-100 to-yellow-100 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-lg">
          <Calendar className="h-3 w-3 text-[#faba33]" />
        </div>
        Período
      </Label>
      
      <div className="flex flex-wrap items-center gap-3">
        <DateRangePicker
          dateRange={dateRange}
          onDateRangeChange={applyDateRange}
          className="flex-1 min-w-[240px] ios26-card p-3 border-0 transition-all duration-300 hover:shadow-lg"
        />
        
        <Dialog>
          <DialogTrigger asChild>
            <button className="ios26-button flex items-center gap-2 px-4 py-2 text-sm font-semibold">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline-block">Períodos</span>
              <ChevronDown className="h-4 w-4" />
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <div className="p-2 bg-gradient-to-br from-orange-100 to-yellow-100 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-xl">
                  <Calendar className="h-4 w-4 text-[#faba33]" />
                </div>
                Períodos Rápidos
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-2 mt-4">
              {periodPresets.map((preset) => (
                <button
                  key={preset.name}
                  onClick={preset.handler}
                  className="w-full text-left px-3 py-2.5 text-sm rounded-xl hover:bg-muted/50 text-foreground transition-all duration-200 flex items-center gap-3 group"
                >
                  <div className="p-1.5 bg-gradient-to-br from-orange-100 to-yellow-100 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-lg group-hover:scale-110 transition-transform duration-200">
                    <Calendar className="h-3 w-3 text-[#faba33]" />
                  </div>
                  <span className="font-medium">{preset.name}</span>
                </button>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

