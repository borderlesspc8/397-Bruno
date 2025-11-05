import { useState } from "react";
import { CreditCard } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell, Tooltip } from 'recharts';
import { useProcessarFormasPagamento } from '@/app/_hooks/useProcessarFormasPagamento';
import { CORES_CATEGORIAS, CORES_GRAFICO } from "../constants";
import { SectionHeader } from "./SectionHeader";
import { ChartViewToggle } from "./ChartViewToggle";
import { PieChartWithLegend } from "./PieChartWithLegend";
import { DataTable } from "./DataTable";

interface FormasPagamentoTabProps {
  vendas: any[];
}

export function FormasPagamentoTab({ vendas }: FormasPagamentoTabProps) {
  const [visualizacao, setVisualizacao] = useState<'pizza' | 'tabela'>('pizza');
  const formasPagamento = useProcessarFormasPagamento(vendas);

  if (formasPagamento.length === 0) {
    return (
      <div className="ios26-card p-8 flex items-center justify-center h-[200px]">
        <div className="text-center">
          <p className="text-muted-foreground font-medium">Nenhuma forma de pagamento encontrada</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        icon={CreditCard}
        title="Formas de Pagamento"
        action={<ChartViewToggle view={visualizacao} onViewChange={setVisualizacao} />}
      />
      
      <AnimatePresence mode="wait">
        <motion.div 
          key={visualizacao}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {visualizacao === 'pizza' ? (
            <PieChartWithLegend
              data={formasPagamento}
              dataKey="totalValor"
              nameKey="formaPagamento"
              colors={(item, index) => CORES_CATEGORIAS[item.formaPagamento as keyof typeof CORES_CATEGORIAS] || CORES_GRAFICO[index % CORES_GRAFICO.length]}
              tooltipFormatter={(value: number, name, props) => {
                const total = formasPagamento.reduce((sum, item) => sum + item.totalValor, 0);
                const percent = ((value / total) * 100).toFixed(1);
                return [
                  <div key="tooltip" className="space-y-2">
                    <div className="font-bold text-lg text-[hsl(var(--orange-primary))] ios26-currency">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)}
                    </div>
                    <div className="text-xs font-medium text-muted-foreground">
                      {percent}% do total
                    </div>
                  </div>,
                  <div key="label" className="font-semibold text-sm">
                    {props.payload.formaPagamento}
                  </div>
                ];
              }}
              legendFormatter={(item, index, total) => {
                const percent = ((item.totalValor / total) * 100).toFixed(1);
                return {
                  label: item.formaPagamento,
                  value: `${percent}%`
                };
              }}
              getTotal={(data) => data.reduce((sum, item) => sum + item.totalValor, 0)}
            />
          ) : (
            <div className="ios26-card p-6 h-[450px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={formasPagamento.slice(0, 8)}
                  margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis 
                    type="number" 
                    tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                  />
                  <YAxis 
                    dataKey="formaPagamento" 
                    type="category" 
                    width={100}
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => value.length > 15 ? `${value.substring(0, 15)}...` : value}
                  />
                  <Tooltip
                    formatter={(value) => [
                      `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                      'Valor'
                    ]}
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      borderRadius: '8px',
                      border: 'none',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                      padding: '12px'
                    }}
                  />
                  <Bar 
                    dataKey="totalValor" 
                    animationDuration={1000}
                    animationBegin={0}
                    animationEasing="ease-out"
                  >
                    {formasPagamento.slice(0, 8).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CORES_CATEGORIAS[formasPagamento[index]?.formaPagamento as keyof typeof CORES_CATEGORIAS] || CORES_GRAFICO[index % CORES_GRAFICO.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <DataTable
            data={formasPagamento}
            title="Detalhamento por forma de pagamento"
            columns={[
              {
                key: 'formaPagamento',
                label: 'Forma de Pagamento',
                render: (item, index) => (
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded-full flex-shrink-0 shadow-sm"
                      style={{ backgroundColor: CORES_CATEGORIAS[item.formaPagamento as keyof typeof CORES_CATEGORIAS] || CORES_GRAFICO[index % CORES_GRAFICO.length] }}
                    />
                    <span className="text-sm font-medium truncate">{item.formaPagamento}</span>
                  </div>
                )
              },
              {
                key: 'totalVendas',
                label: 'Vendas',
                align: 'right'
              },
              {
                key: 'totalValor',
                label: 'Valor Total',
                align: 'right',
                render: (item) => (
                  <span className="text-sm font-bold text-[hsl(var(--orange-primary))] ios26-currency-small">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.totalValor)}
                  </span>
                )
              },
              {
                key: 'percentual',
                label: '%',
                align: 'right',
                render: (item) => `${item.percentual.toFixed(1)}%`
              }
            ]}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

