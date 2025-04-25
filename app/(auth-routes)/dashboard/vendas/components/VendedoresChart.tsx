"use client";

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
} from "recharts";

interface VendedorData {
  nome: string;
  faturamento: number;
  vendas: number;
  ticketMedio: number;
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

// Cor amarela dourada padronizada
const AMARELO_DOURADO = "#faba33";

export function VendedoresChart({ vendedores }: VendedoresChartProps) {
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
  const vendedoresOrdenados = [...vendedores].sort((a, b) => b.faturamento - a.faturamento);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Faturamento por Vendedor</CardTitle>
        <CardDescription>
          Faturamento bruto mensal por vendedor em R$
        </CardDescription>
      </CardHeader>
      <CardContent className="h-[500px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={vendedoresOrdenados}
            layout="vertical"
            margin={{ top: 20, right: 30, left: 50, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
            <XAxis 
              type="number" 
              tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`} 
            />
            <YAxis 
              dataKey="nome" 
              type="category" 
              tick={{ fontSize: 11 }}
              width={150}
              tickFormatter={(value) => {
                // Para nomes muito longos, truncar para caber no gráfico
                if (value && value.length > 18) {
                  return value.substring(0, 15) + '...';
                }
                return value;
              }}
            />
            <Tooltip 
              formatter={(value) => formatCurrency(value as number)} 
              contentStyle={{
                border: `1px solid ${AMARELO_DOURADO}`,
                borderRadius: '0.5rem'
              }}
            />
            <Legend />
            <Bar 
              dataKey="faturamento" 
              name="Faturamento" 
              fill={AMARELO_DOURADO}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
} 