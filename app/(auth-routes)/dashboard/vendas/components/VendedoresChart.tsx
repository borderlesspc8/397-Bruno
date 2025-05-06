"use client";

import React, { useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/_components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps,
  Cell,
  PieChart,
  Pie,
  Sector,
} from "recharts";
import { Button } from "@/app/_components/ui/button";
import { ChevronDown, ChevronUp, PieChart as PieChartIcon, BarChart3 } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/app/_components/ui/toggle-group";

interface VendedorData {
  nome: string;
  faturamento: number;
  vendas: number;
  ticketMedio: number;
  percentual?: number;
}

interface VendedoresChartProps {
  vendedores: VendedorData[];
}

// Função formatCurrency implementada diretamente para evitar problemas de importação
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

// Cores de alto contraste, distintas e de fácil leitura
const CORES = [
  "#FFD700", // Ouro
  "#FF4500", // Vermelho-laranja
  "#1E90FF", // Azul dodger
  "#32CD32", // Verde limão
  "#FF1493", // Rosa profundo
  "#00FFFF", // Ciano
  "#FF8C00", // Laranja escuro
  "#9400D3", // Violeta escuro
  "#00FF7F", // Verde primavera
  "#FF00FF", // Magenta
  "#4169E1", // Azul royal
  "#FFFF00", // Amarelo
  "#FF6347", // Tomate
  "#7B68EE", // Azul ardósia médio
  "#00FA9A", // Verde primavera médio
  "#FF69B4", // Rosa quente
];

// Componente de tooltip personalizado com mais informações
const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    const vendedor = payload[0].payload as VendedorData;
    const percentual = payload[0].payload.percentual || 0;
    
    return (
      <div className="bg-background/95 backdrop-blur-sm border border-amber-400 rounded-md shadow-md p-4">
        <p className="text-sm font-semibold mb-2 text-foreground">{label}</p>
        <div className="space-y-1">
          <p className="text-lg font-bold text-amber-500">
            {formatCurrency(payload[0].value as number)}
          </p>
          <p className="text-xs text-muted-foreground">
            {vendedor.vendas} venda{vendedor.vendas !== 1 ? 's' : ''} • 
            Ticket Médio: {formatCurrency(vendedor.ticketMedio)}
          </p>
          <p className="text-xs text-muted-foreground">
            {percentual.toFixed(2)}% do faturamento total
          </p>
        </div>
      </div>
    );
  }

  return null;
};

// Componente para renderizar o setor ativo no gráfico de pizza
const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;

  return (
    <g>
      <text x={cx} y={cy - 10} dy={8} textAnchor="middle" fill={fill} className="font-bold" fontSize={18}>
        {formatCurrency(value)}
      </text>
      <text x={cx} y={cy + 15} dy={8} textAnchor="middle" fill="#fff" fontSize={14}>
        {(percent * 100).toFixed(2)}%
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 8}
        outerRadius={outerRadius + 12}
        fill={fill}
      />
    </g>
  );
};

export function VendedoresChart({ vendedores }: VendedoresChartProps) {
  // Estados para controlar a visualização
  const [tipoGrafico, setTipoGrafico] = useState<"barra" | "pizza">("barra");
  const [limite, setLimite] = useState<number>(5);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  
  // Handler para setor ativo no gráfico de pizza
  const onPieEnter = useCallback((_: any, index: number) => {
    setActiveIndex(index);
  }, []);

  // Se não houver dados, mostrar mensagem
  if (!vendedores || vendedores.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Faturamento por Vendedor</CardTitle>
          <CardDescription>
            Faturamento bruto mensal por vendedor em R$
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[500px]">
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Nenhum dado disponível para o período</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Ordenar por faturamento (do maior para o menor)
  const vendedoresOrdenados = useMemo(() => {
    // Calcular total para percentuais
    const totalFaturamento = vendedores.reduce((sum, v) => sum + v.faturamento, 0);
    
    // Adicionar percentual a cada vendedor
    return [...vendedores]
      .sort((a, b) => b.faturamento - a.faturamento)
      .map(v => ({
        ...v,
        percentual: (v.faturamento / totalFaturamento) * 100
      }));
  }, [vendedores]);
  
  // Limitar número de vendedores exibidos
  const vendedoresLimitados = useMemo(() => {
    const limitados = vendedoresOrdenados.slice(0, limite);
    
    // Se houver mais vendedores além do limite, criar uma categoria "Outros"
    if (vendedoresOrdenados.length > limite) {
      const outrosFaturamento = vendedoresOrdenados
        .slice(limite)
        .reduce((sum, v) => sum + v.faturamento, 0);
      
      const outrosVendas = vendedoresOrdenados
        .slice(limite)
        .reduce((sum, v) => sum + v.vendas, 0);
      
      const outrosTicketMedio = outrosVendas > 0 ? outrosFaturamento / outrosVendas : 0;
      
      const totalFaturamento = vendedoresOrdenados.reduce((sum, v) => sum + v.faturamento, 0);
      
      limitados.push({
        nome: `Outros (${vendedoresOrdenados.length - limite})`,
        faturamento: outrosFaturamento,
        vendas: outrosVendas,
        ticketMedio: outrosTicketMedio,
        percentual: (outrosFaturamento / totalFaturamento) * 100
      });
    }
    
    return limitados;
  }, [vendedoresOrdenados, limite]);
  
  // Alternar exibição de mais ou menos vendedores
  const toggleLimite = () => {
    setLimite(limite === 5 ? 10 : 5);
  };
  
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Faturamento por Vendedor</CardTitle>
            <CardDescription>
              Faturamento bruto mensal por vendedor em R$
            </CardDescription>
          </div>
          <div className="flex space-x-2">
            <ToggleGroup type="single" value={tipoGrafico} onValueChange={(value: string) => value && setTipoGrafico(value as "barra" | "pizza")}>
              <ToggleGroupItem value="barra" aria-label="Gráfico de Barras">
                <BarChart3 className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="pizza" aria-label="Gráfico de Pizza">
                <PieChartIcon className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={toggleLimite}
              className="text-xs"
            >
              {limite === 5 ? <ChevronDown className="h-4 w-4 mr-1" /> : <ChevronUp className="h-4 w-4 mr-1" />}
              {limite === 5 ? "Ver mais" : "Ver menos"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="h-[500px]">
        <ResponsiveContainer width="100%" height="100%">
          {tipoGrafico === "barra" ? (
            <BarChart
              data={vendedoresLimitados}
              layout="horizontal"
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={true} horizontal={true} />
              <XAxis 
                dataKey="nome" 
                type="category" 
                tick={{ fontSize: 11, fill: "#ffffff" }}
                height={60}
                angle={-45}
                textAnchor="end"
                tickFormatter={(value) => {
                  // Para nomes muito longos, truncar para caber no gráfico
                  if (value && value.length > 18) {
                    return value.substring(0, 15) + '...';
                  }
                  return value;
                }}
              />
              <YAxis 
                type="number" 
                tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                tick={{ fill: "#ffffff" }}
              />
              <Tooltip 
                content={<CustomTooltip />}
              />
              <Legend 
                formatter={() => ""} // Remove o texto "Faturamento (R$)"
                wrapperStyle={{ color: "#ffffff" }}
              />
              <Bar 
                dataKey="faturamento" 
                name="" 
                barSize={30} // Barras mais finas
              >
                {vendedoresLimitados.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CORES[index % CORES.length]} />
                ))}
              </Bar>
            </BarChart>
          ) : (
            <PieChart>
              <Pie
                activeIndex={activeIndex}
                activeShape={renderActiveShape}
                data={vendedoresLimitados}
                cx="50%"
                cy="50%"
                innerRadius={80}
                outerRadius={120}
                dataKey="faturamento"
                onMouseEnter={onPieEnter}
                paddingAngle={2}
                nameKey="nome"
                label={(entry) => `${entry.percentual.toFixed(1)}%`}
                labelLine={false}
              >
                {vendedoresLimitados.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CORES[index % CORES.length]} />
                ))}
              </Pie>
              <Tooltip 
                content={<CustomTooltip />}
              />
              <Legend 
                layout="vertical" 
                verticalAlign="middle" 
                align="right"
                formatter={(value: string, entry: any, index: number) => {
                  // Usar o nome do vendedor e percentual
                  const vendedor = entry.payload;
                  return `${vendedor.nome} (${vendedor.percentual.toFixed(1)}%)`;
                }}
                wrapperStyle={{ color: "#ffffff" }}
              />
            </PieChart>
          )}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
} 