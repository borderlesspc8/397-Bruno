"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { useState } from "react";
import { cn } from "../_lib/utils";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

interface PieChartData {
  id: string;
  name: string;
  amount: number;
  color: string;
}

interface TransactionsPieChartProps {
  data: PieChartData[];
  title: string;
  description: string;
  className?: string;
}

export default function TransactionsPieChart({ 
  data, 
  title, 
  description, 
  className 
}: TransactionsPieChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  
  // Formatar percentual
  const formatPercentage = (value: number) => {
    return (value * 100).toFixed(1) + '%';
  };

  // Verificar se não há dados
  if (!data || data.length === 0) {
    return (
      <Card className={cn("shadow-sm hover:shadow transition-shadow duration-200", className)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[260px] w-full flex items-center justify-center text-muted-foreground">
            Sem dados para exibir
          </div>
        </CardContent>
      </Card>
    );
  }

  // Renderizar o tooltip personalizado
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card p-2 shadow-md rounded-md border border-border">
          <p className="font-medium">{payload[0].name}</p>
          <p className="text-sm">{formatPercentage(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  // Handler para clicar em um segmento
  const handlePieClick = (data: any, index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  // Ordenar os dados por valor (maior para menor)
  const sortedData = [...data].sort((a, b) => b.amount - a.amount);

  return (
    <Card className={cn("shadow-sm hover:shadow transition-shadow duration-200", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row items-center justify-between p-4 gap-4">
          <div className="w-full sm:w-2/3 h-[260px] relative group">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sortedData}
                  dataKey="amount"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={40}
                  paddingAngle={2}
                  onClick={handlePieClick}
                  cursor="pointer"
                  isAnimationActive={true}
                  animationDuration={800}
                >
                  {sortedData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color} 
                      strokeWidth={activeIndex === index ? 2 : 1}
                      stroke="var(--background)"
                      opacity={activeIndex === null || activeIndex === index ? 1 : 0.7}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                {activeIndex !== null ? (
                  <>
                    <p className="font-medium text-sm">{sortedData[activeIndex]?.name}</p>
                    <p className="text-xl font-bold">{formatPercentage(sortedData[activeIndex]?.amount)}</p>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    Clique para detalhar
                  </p>
                )}
              </div>
            </div>
          </div>
          
          <div className="w-full sm:w-1/3 space-y-2">
            {sortedData.map((item, index) => (
              <div 
                key={item.id}
                className={cn(
                  "flex items-center justify-between p-2 rounded-md transition-colors duration-200 cursor-pointer",
                  activeIndex === index ? "bg-muted" : "hover:bg-muted/50"
                )}
                onClick={() => setActiveIndex(activeIndex === index ? null : index)}
              >
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm font-medium">{item.name}</span>
                </div>
                <span className="text-sm">{formatPercentage(item.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 