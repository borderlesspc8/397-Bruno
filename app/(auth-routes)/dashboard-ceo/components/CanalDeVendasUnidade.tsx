"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/app/_components/ui/card";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from "@/app/_lib/formatters";
import { Skeleton } from "@/app/_components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid
} from 'recharts';
import { Share2, Info, PieChart as PieChartIcon, BarChart as BarChartIcon, TrendingUp } from "lucide-react";

interface CanalVendaData {
  canal: string;
  quantidade: number;
  percentual: number;
}

interface UnidadeData {
  id: string;
  nome: string;
  canais: CanalVendaData[];
  total: number;
}

interface CanalDeVendasUnidadeProps {
  dataInicio: Date;
  dataFim: Date;
  vendas?: any[]; // Receber vendas diretamente do componente pai
}

// Função auxiliar para formatar percentual corretamente (sem divisão adicional por 100)
const formatPercentCorreto = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }).format(value);
};

// Componente para animação das barras de progresso
const AnimatedProgressBar = ({ percentual, color }: { percentual: number, color: string }) => (
  <div className="w-full bg-gray-100 rounded-full h-2.5 dark:bg-gray-700 overflow-hidden">
    <motion.div 
      className="h-2.5 rounded-full" 
      initial={{ width: 0 }}
      animate={{ width: `${percentual * 100}%` }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      style={{ backgroundColor: color }}
    />
  </div>
);

// Componente para os cartões de canais
const CanalCard = ({ canal, index, color }: { canal: CanalVendaData, index: number, color: string }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, delay: index * 0.05 }}
    className="p-3 rounded-lg bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow duration-200"
  >
    <div className="flex items-center justify-between mb-2">
      <span className="font-medium">{canal.canal}</span>
      <span className="text-sm font-medium">{canal.quantidade} vendas</span>
    </div>
    <AnimatedProgressBar percentual={canal.percentual} color={color} />
    <div className="text-right text-sm text-muted-foreground mt-1">
      {formatPercentCorreto(canal.percentual)}
    </div>
  </motion.div>
);

export function CanalDeVendasUnidade({ dataInicio, dataFim, vendas }: CanalDeVendasUnidadeProps) {
  const [visualizacao, setVisualizacao] = useState<'pizza' | 'tabela'>('pizza');

  // Processar dados de canais a partir das vendas recebidas
  const canaisData = useMemo(() => {
    if (!vendas || !Array.isArray(vendas)) {
      return [];
    }

    console.log('📊 [CanalDeVendas] Processando canais localmente:', {
      totalVendas: vendas.length,
      primeirasVendas: vendas.slice(0, 3).map(v => ({
        id: v.id,
        canal_venda: v.canal_venda,
        origem: v.origem
      }))
    });

    const canaisMap = new Map<string, { quantidade: number; valor: number }>();

    vendas.forEach((venda: any) => {
      // Tentar extrair canal de diferentes campos possíveis
      let canal = venda.canal_venda || 
                  venda.metadata?.nome_canal_venda ||
                  venda.metadata?.canal_venda ||
                  venda.origem || 
                  venda.canal || 
                  venda.metadata?.canal ||
                  venda.metadata?.origem_venda ||
                  venda.metadata?.fonte ||
                  venda.metadata?.meio ||
                  'Não informado';
      
      // Normalizar nome do canal
      if (canal && typeof canal === 'string') {
        canal = canal.trim();
        if (canal === '' || canal.toLowerCase() === 'null') {
          canal = 'Não informado';
        }
      } else {
        canal = 'Não informado';
      }

      const valor = parseFloat(venda.valor_total || venda.valor || '0');

      if (canaisMap.has(canal)) {
        const existente = canaisMap.get(canal)!;
        existente.quantidade += 1;
        existente.valor += valor;
      } else {
        canaisMap.set(canal, { quantidade: 1, valor });
      }
    });

    const totalVendas = vendas.length;
    const canaisProcessados: CanalVendaData[] = Array.from(canaisMap.entries()).map(([canal, dados]) => ({
      canal,
      quantidade: dados.quantidade,
      percentual: totalVendas > 0 ? dados.quantidade / totalVendas : 0
    }));

    console.log('📊 [CanalDeVendas] Canais processados:', {
      totalCanais: canaisProcessados.length,
      totalVendas,
      canais: canaisProcessados.map(c => ({ canal: c.canal, quantidade: c.quantidade, percentual: c.percentual }))
    });

    return canaisProcessados.sort((a, b) => b.quantidade - a.quantidade);
  }, [vendas]);

  // Cores seguindo o padrão ios26-badge da aplicação
  const COLORS = [
    'hsl(var(--orange-primary))',     // Laranja principal
    'hsl(var(--yellow-primary))',     // Amarelo principal
    'hsl(var(--orange-dark))',        // Laranja escuro
    'hsl(25 95% 70%)',                // Laranja claro
    'hsl(45 100% 60%)',               // Amarelo vibrante
    'hsl(25 95% 45%)',                // Laranja médio
    'hsl(45 100% 70%)',               // Amarelo claro
    'hsl(25 95% 35%)',                // Laranja escuro
    'hsl(45 100% 50%)',               // Amarelo médio
    'hsl(25 95% 60%)'                 // Laranja vibrante
  ];

  // Renderizar gráfico e tabela com dados consolidados
  const renderChart = () => {
    if (!canaisData || canaisData.length === 0) return null;
    
    // Preparar dados para o gráfico
    const chartData = [...canaisData]
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 15) // Limitar a 15 itens para melhor visualização
      .map(canal => ({
        canal: canal.canal,
        quantidade: canal.quantidade,
        percentual: canal.percentual
      }));
    
    // Calcular total de vendas
    const totalVendas = chartData.reduce((sum, canal) => sum + canal.quantidade, 0);
    
    return (
      <motion.div 
        className="mt-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Cabeçalho com total de vendas */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-semibold">
              Dados Gerais - Canal de Vendas
            </h3>
            <p className="text-sm text-muted-foreground">
              Total de {totalVendas} vendas no período
            </p>
          </div>
          <div className="flex space-x-2">
            <button 
              onClick={() => setVisualizacao('pizza')}
              className={`p-2 rounded-full transition-all duration-200 ${
                visualizacao === 'pizza' 
                  ? 'ios26-badge' 
                  : 'text-muted-foreground hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20'
              }`}
              title="Visualizar como gráfico de pizza"
            >
              <PieChartIcon size={16} />
            </button>
            <button 
              onClick={() => setVisualizacao('tabela')}
              className={`p-2 rounded-full transition-all duration-200 ${
                visualizacao === 'tabela' 
                  ? 'ios26-badge' 
                  : 'text-muted-foreground hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20'
              }`}
              title="Visualizar como tabela"
            >
              <BarChartIcon size={16} />
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnimatePresence mode="wait">
            <motion.div 
              key={visualizacao}
              initial={{ opacity: 0, x: visualizacao === 'pizza' ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: visualizacao === 'pizza' ? -20 : 20 }}
              transition={{ duration: 0.3 }}
              className="h-[300px]"
            >
              {visualizacao === 'pizza' ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      innerRadius={40} // Donut chart
                      fill="#8884d8"
                      dataKey="quantidade"
                      nameKey="canal"
                      label={({ name, percent }) => {
                        const shortName = name.length > 8 ? name.substring(0, 8) + '...' : name;
                        // Formatar o percentual com uma casa decimal
                        return `${shortName}: ${(percent * 100).toFixed(1)}%`;
                      }}
                      labelLine={true}
                      animationDuration={800}
                      animationBegin={0}
                      animationEasing="ease-out"
                    >
                      {chartData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={COLORS[index % COLORS.length]} 
                          stroke="rgba(255, 255, 255, 0.5)"
                          strokeWidth={1}
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name, props) => [
                        `${props.payload.canal}: ${value} vendas (${(props.payload.percentual * 100).toFixed(1)}%)`
                      ]}
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        borderRadius: '8px',
                        border: 'none',
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                        padding: '12px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
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
                      {chartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </motion.div>
          </AnimatePresence>
          
          <div>
            <h4 className="text-sm font-medium mb-4 text-muted-foreground flex items-center">
              <Info size={14} className="mr-1.5" /> 
              {visualizacao === 'pizza' ? 'Detalhamento por canal' : 'Tabela de dados'}
            </h4>
            {visualizacao === 'pizza' ? (
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {chartData.map((canal, index) => (
                  <CanalCard 
                    key={index} 
                    canal={canal} 
                    index={index} 
                    color={COLORS[index % COLORS.length]} 
                  />
                ))}
              </div>
            ) : (
              <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-2 font-medium text-gray-700 dark:text-gray-300">Canal</th>
                      <th className="text-right py-2 font-medium text-gray-700 dark:text-gray-300">Vendas</th>
                      <th className="text-right py-2 font-medium text-gray-700 dark:text-gray-300">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chartData.map((canal, index) => (
                      <motion.tr
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      >
                        <td className="py-2">
                          <div className="flex items-center">
                            <div 
                              className="w-3 h-3 rounded-full mr-2"
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <span className="font-medium">{canal.canal}</span>
                          </div>
                        </td>
                        <td className="text-right py-2 font-medium">
                          {canal.quantidade.toLocaleString()}
                        </td>
                        <td className="text-right py-2">
                          <span className="text-muted-foreground">
                            {formatPercentCorreto(canal.percentual)}
                          </span>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  // Se não há vendas, mostrar estado vazio
  if (!vendas || vendas.length === 0) {
    return (
      <Card className="shadow-lg bg-card/95 backdrop-blur-sm border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            Canal de Vendas
          </CardTitle>
          <CardDescription>Análise de canais de vendas por período</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px]">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-gray-400" />
          </div>
              <p className="text-muted-foreground">
                Nenhum dado de canal de vendas disponível para o período selecionado.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (canaisData.length === 0) {
    return (
      <Card className="shadow-lg bg-card/95 backdrop-blur-sm border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            Canal de Vendas
          </CardTitle>
          <CardDescription>Análise de canais de vendas por período</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px]">
            <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-muted-foreground">
                Nenhum canal de vendas identificado no período selecionado.
                </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg bg-card/95 backdrop-blur-sm border-0">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              Canal de Vendas
            </CardTitle>
            <CardDescription>
              Análise de canais de vendas por período
            </CardDescription>
          </div>
          <div className="flex space-x-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                console.log('📊 [Debug] Dados atuais:', {
                  canaisData,
                  totalCanais: canaisData.length,
                  totalVendas: canaisData.reduce((sum, c) => sum + c.quantidade, 0)
                });
              }}
                className="p-2 rounded-full hover:bg-orange-50 dark:hover:bg-orange-900/20 text-muted-foreground hover:text-orange-600 transition-all duration-200"
              title="Debug - Ver dados no console"
            >
                <Info size={16} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
                className="p-2 rounded-full hover:bg-orange-50 dark:hover:bg-orange-900/20 text-muted-foreground hover:text-orange-600 transition-all duration-200"
              title="Compartilhar"
            >
                <Share2 size={16} />
            </motion.button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderChart()}
          </motion.div>
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
