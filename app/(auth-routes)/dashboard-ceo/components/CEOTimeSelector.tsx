'use client';

import { Card } from '@/app/_components/ui/card';
import { Calendar, ChevronDown } from 'lucide-react';

interface CEOTimeSelectorProps {
  selectedPeriod: {
    startDate: Date;
    endDate: Date;
  };
  onPeriodChange: (period: { startDate: Date; endDate: Date }) => void;
}

export function CEOTimeSelector({ selectedPeriod, onPeriodChange }: CEOTimeSelectorProps) {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR');
  };

  const handlePresetPeriod = (preset: string) => {
    const now = new Date();
    let startDate: Date;
    let endDate = new Date();

    switch (preset) {
      case 'today':
        startDate = new Date(now);
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = selectedPeriod.startDate;
    }

    onPeriodChange({ startDate, endDate });
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-gray-500" />
            <span className="font-medium text-gray-700">Período:</span>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="date"
              value={selectedPeriod.startDate.toISOString().split('T')[0]}
              onChange={(e) => onPeriodChange({
                ...selectedPeriod,
                startDate: new Date(e.target.value)
              })}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            />
            <span className="text-gray-500">até</span>
            <input
              type="date"
              value={selectedPeriod.endDate.toISOString().split('T')[0]}
              onChange={(e) => onPeriodChange({
                ...selectedPeriod,
                endDate: new Date(e.target.value)
              })}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Períodos rápidos:</span>
          <div className="flex space-x-1">
            {[
              { key: 'today', label: 'Hoje' },
              { key: 'week', label: '7 dias' },
              { key: 'month', label: 'Mês' },
              { key: 'quarter', label: 'Trimestre' },
              { key: 'year', label: 'Ano' }
            ].map((preset) => (
              <button
                key={preset.key}
                onClick={() => handlePresetPeriod(preset.key)}
                className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

