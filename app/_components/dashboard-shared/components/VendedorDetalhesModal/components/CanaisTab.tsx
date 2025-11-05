import { useState } from "react";
import { TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell, Tooltip } from 'recharts';
import { CanalVendaData } from "../types";
import { CORES_ORIGENS } from "../constants";
import { SectionHeader } from "./SectionHeader";
import { ChartViewToggle } from "./ChartViewToggle";
import { PieChartWithLegend } from "./PieChartWithLegend";
import { DataTable } from "./DataTable";

interface CanaisTabProps {
  canaisData: CanalVendaData[];
}

export function CanaisTab({ canaisData }: CanaisTabProps) {
  const [visualizacao, setVisualizacao] = useState<'pizza' | 'tabela'>('pizza');

  if (canaisData.length === 0) {
    return (
      <div className="ios26-card p-8 flex items-center justify-center h-[200px]">
        <div className="text-center">
          <p className="text-muted-foreground font-medium">Nenhum canal encontrado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        icon={TrendingUp}
        title="Canal de Vendas"
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
              data={canaisData}
              dataKey="quantidade"
              nameKey="canal"
              colors={(item, index) => CORES_ORIGENS[index % CORES_ORIGENS.length]}
              tooltipFormatter={(value: number, name, props) => {
                const total = canaisData.reduce((sum, item) => sum + item.quantidade, 0);
                const percent = ((value / total) * 100).toFixed(1);
                return [
                  <div key="tooltip" className="space-y-2">
                    <div className="font-bold text-lg text-[hsl(var(--orange-primary))]">
                      {value} {value === 1 ? 'venda' : 'vendas'}
                    </div>
                    <div className="text-xs font-medium text-muted-foreground">
                      {percent}% do total
                    </div>
                  </div>,
                  <div key="label" className="font-semibold text-sm">
                    {props.payload.canal}
                  </div>
                ];
              }}
              legendFormatter={(item, index, total) => {
                const percent = ((item.quantidade / total) * 100).toFixed(1);
                return {
                  label: item.canal,
                  value: `${item.quantidade} ${item.quantidade === 1 ? 'venda' : 'vendas'} • ${percent}%`
                };
              }}
              getTotal={(data) => data.reduce((sum, item) => sum + item.quantidade, 0)}
            />
          ) : (
            <div className="ios26-card p-6 h-[450px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={canaisData.slice(0, 8)}
                  margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis 
                    type="number" 
                    tickFormatter={(value) => value > 1000 ? `${(value / 1000).toFixed(1)}k` : value}
                  />
                  <YAxis 
                    dataKey="canal" 
                    type="category" 
                    width={100}
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => value.length > 15 ? `${value.substring(0, 15)}...` : value}
                  />
                  <Tooltip
                    formatter={(value) => [`${value} vendas`, 'Quantidade']}
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      borderRadius: '8px',
                      border: 'none',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                      padding: '12px'
                    }}
                  />
                  <Bar 
                    dataKey="quantidade" 
                    animationDuration={1000}
                    animationBegin={0}
                    animationEasing="ease-out"
                  >
                    {canaisData.slice(0, 8).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CORES_ORIGENS[index % CORES_ORIGENS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <DataTable
            data={canaisData}
            title="Detalhamento por canal"
            columns={[
              {
                key: 'canal',
                label: 'Canal',
                render: (item, index) => (
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded-full flex-shrink-0 shadow-sm"
                      style={{ backgroundColor: CORES_ORIGENS[index % CORES_ORIGENS.length] }}
                    />
                    <span className="text-sm font-medium truncate">{item.canal}</span>
                  </div>
                )
              },
              {
                key: 'quantidade',
                label: 'Vendas',
                align: 'right'
              },
              {
                key: 'percentual',
                label: '%',
                align: 'right',
                render: (item) => `${(item.percentual * 100).toFixed(1)}%`
              }
            ]}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

