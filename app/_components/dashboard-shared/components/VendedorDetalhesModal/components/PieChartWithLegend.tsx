import { motion } from "framer-motion";
import { ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, Tooltip } from 'recharts';

interface PieChartWithLegendProps<T> {
  data: T[];
  dataKey: string;
  nameKey: string;
  colors: string[] | ((item: T, index: number) => string);
  tooltipFormatter?: (value: number, name: string, props: any) => [React.ReactNode, React.ReactNode] | React.ReactNode;
  legendFormatter?: (item: T, index: number, total: number) => { label: string; value: string };
  getTotal?: (data: T[]) => number;
}

export function PieChartWithLegend<T extends Record<string, any>>({
  data,
  dataKey,
  nameKey,
  colors,
  tooltipFormatter,
  legendFormatter,
  getTotal
}: PieChartWithLegendProps<T>) {
  const getColor = (item: T, index: number): string => {
    if (typeof colors === 'function') {
      return colors(item, index);
    }
    return colors[index % colors.length];
  };

  const total = getTotal ? getTotal(data) : data.reduce((sum, item) => sum + (item[dataKey] || 0), 0);

  return (
    <div className="ios26-card p-6 h-[450px] flex flex-col gap-4">
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsPieChart>
            <Pie
              data={data.slice(0, 8)}
              cx="50%"
              cy="45%"
              outerRadius={110}
              innerRadius={60}
              fill="#8884d8"
              dataKey={dataKey}
              nameKey={nameKey}
              label={false}
              animationDuration={1200}
              animationBegin={0}
              animationEasing="ease-out"
            >
              {data.slice(0, 8).map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={getColor(entry, index)} 
                  stroke="rgba(255, 255, 255, 0.9)"
                  strokeWidth={4}
                  style={{
                    filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.15))',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                />
              ))}
            </Pie>
            <Tooltip 
              formatter={tooltipFormatter}
              contentStyle={{ 
                backgroundColor: 'hsl(var(--popover))',
                borderRadius: '16px',
                border: '1px solid hsl(var(--border))',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)',
                padding: '16px 20px'
              }}
              labelStyle={{
                color: 'hsl(var(--popover-foreground))',
                fontWeight: 600,
                fontSize: '13px'
              }}
            />
          </RechartsPieChart>
        </ResponsiveContainer>
      </div>
      
      {/* Legenda Customizada iOS26 */}
      {legendFormatter && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-border/50">
          {data.slice(0, 8).map((item, index) => {
            const legend = legendFormatter(item, index, total);
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-2 p-2 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer group"
              >
                <div 
                  className="w-4 h-4 rounded-full flex-shrink-0 shadow-sm group-hover:scale-110 transition-transform"
                  style={{ 
                    backgroundColor: getColor(item, index)
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-foreground truncate">
                    {legend.label}
                  </div>
                  <div className="text-xs text-muted-foreground font-medium">
                    {legend.value}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

