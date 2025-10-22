/**
 * 📈 CEO DASHBOARD - SIMPLE LINE CHART
 * Gráfico de linhas simples usando SVG nativo
 */

'use client';

interface DataPoint {
  label: string;
  value: number;
}

interface SimpleLineChartProps {
  data: DataPoint[];
  title?: string;
  color?: string;
  height?: number;
  showGrid?: boolean;
  formatValue?: (value: number) => string;
}

export function SimpleLineChart({
  data,
  title,
  color = '#3b82f6',
  height = 200,
  showGrid = true,
  formatValue = (v) => v.toLocaleString('pt-BR'),
}: SimpleLineChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400">
        <p>Sem dados para exibir</p>
      </div>
    );
  }
  
  // Calcular dimensões e escalas
  const padding = 40;
  const width = 600;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  
  const values = data.map(d => d.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const valueRange = maxValue - minValue || 1;
  
  // Criar pontos do gráfico
  const points = data.map((d, i) => {
    const x = padding + (i / (data.length - 1 || 1)) * chartWidth;
    const y = padding + chartHeight - ((d.value - minValue) / valueRange) * chartHeight;
    return { x, y, ...d };
  });
  
  // Criar path do gráfico
  const pathData = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');
  
  // Criar área preenchida
  const areaPath = `${pathData} L ${points[points.length - 1].x} ${padding + chartHeight} L ${padding} ${padding + chartHeight} Z`;
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      {title && <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>}
      
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height: height }}>
        {/* Grid horizontal */}
        {showGrid && [0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
          const y = padding + chartHeight * (1 - ratio);
          const value = minValue + valueRange * ratio;
          return (
            <g key={i}>
              <line
                x1={padding}
                y1={y}
                x2={width - padding}
                y2={y}
                stroke="#e5e7eb"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <text
                x={padding - 10}
                y={y + 4}
                textAnchor="end"
                fontSize="10"
                fill="#6b7280"
              >
                {formatValue(value)}
              </text>
            </g>
          );
        })}
        
        {/* Área preenchida */}
        <path
          d={areaPath}
          fill={color}
          fillOpacity="0.1"
        />
        
        {/* Linha principal */}
        <path
          d={pathData}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Pontos */}
        {points.map((p, i) => (
          <g key={i}>
            <circle
              cx={p.x}
              cy={p.y}
              r="4"
              fill="white"
              stroke={color}
              strokeWidth="2"
            />
            {/* Label do eixo X */}
            <text
              x={p.x}
              y={height - padding + 20}
              textAnchor="middle"
              fontSize="10"
              fill="#6b7280"
            >
              {p.label}
            </text>
          </g>
        ))}
      </svg>
      
      {/* Legenda */}
      <div className="mt-4 flex items-center justify-center gap-6 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>
          <span>Tendência</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-semibold">Máx:</span>
          <span>{formatValue(maxValue)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-semibold">Mín:</span>
          <span>{formatValue(minValue)}</span>
        </div>
      </div>
    </div>
  );
}



