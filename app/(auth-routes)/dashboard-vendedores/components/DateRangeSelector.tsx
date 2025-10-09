import { DatePickerWithRange } from "@/app/_components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { isEqual } from "date-fns";

interface DateRangeSelectorProps {
  dateRange: DateRange | undefined;
  onChange: (dateRange: DateRange | undefined) => void;
}

export function DateRangeSelector({ dateRange, onChange }: DateRangeSelectorProps) {
  console.log("DateRangeSelector renderizando com:", 
    dateRange?.from ? dateRange.from.toISOString().substring(0, 10) : 'null',
    dateRange?.to ? dateRange.to.toISOString().substring(0, 10) : 'null'
  );
  
  return (
    <div className="flex justify-end mb-4">
      <DatePickerWithRange
        dateRange={dateRange}
        onChange={(newDateRange) => {
          // Verificar se o intervalo realmente mudou para evitar re-renderizações desnecessárias
          const fromChanged = dateRange?.from && newDateRange?.from 
            ? !isEqual(dateRange.from, newDateRange.from) 
            : dateRange?.from !== newDateRange?.from;
          
          const toChanged = dateRange?.to && newDateRange?.to
            ? !isEqual(dateRange.to, newDateRange.to)
            : dateRange?.to !== newDateRange?.to;
            
          if (fromChanged || toChanged) {
            onChange(newDateRange);
          }
        }}
        placeholder="Selecione o período"
        className="w-full md:w-auto"
      />
    </div>
  );
} 