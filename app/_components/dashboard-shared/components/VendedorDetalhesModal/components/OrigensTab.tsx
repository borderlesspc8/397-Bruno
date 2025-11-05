import { useState } from "react";
import { Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell, Tooltip } from 'recharts';
import { OrigemData } from "../types";
import { CORES_ORIGENS } from "../constants";
import { SectionHeader } from "./SectionHeader";
import { ChartViewToggle } from "./ChartViewToggle";
import { PieChartWithLegend } from "./PieChartWithLegend";
import { DataTable } from "./DataTable";

interface OrigensTabProps {
  origensData: OrigemData[];
}

export function OrigensTab({ origensData }: OrigensTabProps) {
  const [visualizacao, setVisualizacao] = useState<'pizza' | 'tabela'>('pizza');

  if (origensData.length === 0) {
    return (
      <div className="ios26-card p-8 flex items-center justify-center h-[200px]">
        <div className="text-center">
          <p className="text-muted-foreground font-medium">Nenhuma origem encontrada</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        icon={Users}
        title="Como nos Conheceu"
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
              data={origensData}
              dataKey="quantidade"
              nameKey="origem"
              colors={(item, index) => CORES_ORIGENS[index % CORES_ORIGENS.length]}
              tooltipFormatter={(value: number, name, props) => {
                const total = origensData.reduce((sum, item) => sum + item.quantidade, 0);
                const percent = ((value / total) * 100).toFixed(1);
                return [
                  <div key="tooltip" className="space-y-2">
                    <div className="font-bold text-lg text-[hsl(var(--orange-primary))]">
                      {value} {value === 1 ? 'cliente' : 'clientes'}
                    </div>
                    <div className="text-xs font-medium text-muted-foreground">
                      {percent}% do total
                    </div>
                  </div>,
                  <div key="label" className="font-semibold text-sm">
                    {props.payload.origem}
                  </div>
                ];
              }}
              legendFormatter={(item, index, total) => {
                const percent = ((item.quantidade / total) * 100).toFixed(1);
                return {
                  label: item.origem,
                  value: `${item.quantidade} ${item.quantidade === 1 ? 'cliente' : 'clientes'} • ${percent}%`
                };
              }}
              getTotal={(data) => data.reduce((sum, item) => sum + item.quantidade, 0)}
            />
          ) : (
            <div className="ios26-card p-6 h-[450px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={origensData.slice(0, 8)}
                  margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis 
                    type="number" 
                    tickFormatter={(value) => value > 1000 ? `${(value / 1000).toFixed(1)}k` : value}
                  />
                  <YAxis 
                    dataKey="origem" 
                    type="category" 
                    width={100}
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => value.length > 15 ? `${value.substring(0, 15)}...` : value}
                  />
                  <Tooltip
                    formatter={(value) => [`${value} ${value === 1 ? 'cliente' : 'clientes'}`, 'Quantidade']}
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
                    {origensData.slice(0, 8).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CORES_ORIGENS[index % CORES_ORIGENS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <DataTable
            data={origensData}
            title="Detalhamento por origem"
            columns={[
              {
                key: 'origem',
                label: 'Origem',
                render: (item, index) => (
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded-full flex-shrink-0 shadow-sm"
                      style={{ backgroundColor: CORES_ORIGENS[index % CORES_ORIGENS.length] }}
                    />
                    <span className="text-sm font-medium truncate">{item.origem}</span>
                  </div>
                )
              },
              {
                key: 'quantidade',
                label: 'Clientes',
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

