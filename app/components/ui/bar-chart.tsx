'use client';

import { BarChart as Chart } from '@tremor/react';

interface BarChartProps {
  data: any[];
  index: string;
  categories: string[];
  colors: string[];
  valueFormatter?: (value: number) => string;
}

export function BarChart({
  data,
  index,
  categories,
  colors,
  valueFormatter = (value) => value.toString(),
}: BarChartProps) {
  return (
    <Chart
      data={data}
      index={index}
      categories={categories}
      colors={colors}
      valueFormatter={valueFormatter}
      yAxisWidth={48}
      showAnimation
    />
  );
} 