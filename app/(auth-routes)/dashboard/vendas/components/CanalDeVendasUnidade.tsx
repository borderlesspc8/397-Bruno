"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/app/_components/ui/card";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatPercent } from "@/app/_utils/format";
import { Skeleton } from "@/app/_components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/_components/ui/tabs";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid,
  PieChart as RechartsStaticPieChart
} from 'recharts';
import { Tooltip as UITooltip } from "@/app/_components/ui/tooltip";
import { Share2, Info, PieChart as PieChartIcon, BarChart as BarChartIcon } from "lucide-react";

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

export function CanalDeVendasUnidade({ dataInicio, dataFim }: CanalDeVendasUnidadeProps) {
  const [canaisData, setCanaisData] = useState<CanalVendaData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [visualizacao, setVisualizacao] = useState<'pizza' | 'tabela'>('pizza');

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      
      try {
        // Formatar datas para string no formato YYYY-MM-DD
        const dataInicioStr = dataInicio.toISOString().split('T')[0];
        const dataFimStr = dataFim.toISOString().split('T')[0];
        
        // Buscar dados de canais consolidados usando o endpoint existente
        let response = await fetch(
          `/api/dashboard/canais-vendas?dataInicio=${dataInicioStr}&dataFim=${dataFimStr}`
        );
        
        // Se o endpoint principal falhar, tentar o endpoint direto
        if (!response.ok) {
          console.log('📊 [CanalDeVendas] Endpoint principal falhou, tentando endpoint direto...');
          response = await fetch(
            `/api/dashboard/canais-vendas/direct?dataInicio=${dataInicioStr}&dataFim=${dataFimStr}`
          );
        }
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Erro na resposta da API:', {
            status: response.status,
            statusText: response.statusText,
            error: errorText
          });
          throw new Error(`Erro ao buscar dados: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        
        console.log('📊 [CanalDeVendas] Dados recebidos da API:', {
          temDashboard: !!data.dashboard,
          temCanalVendasPorUnidade: !!data.dashboard?.canalVendasPorUnidade,
          quantidadeUnidades: data.dashboard?.canalVendasPorUnidade?.length || 0
        });
        
        // Processar os dados retornados pelo endpoint - pegar apenas os dados consolidados
        if (data && data.dashboard && data.dashboard.canalVendasPorUnidade) {
          const unidadesData: UnidadeData[] = data.dashboard.canalVendasPorUnidade;
          
          // Buscar a unidade consolidada (Todas as Unidades)
          const unidadeConsolidada = unidadesData.find(u => u.id === "todos");
          
          console.log('📊 [CanalDeVendas] Unidade consolidada encontrada:', {
            existe: !!unidadeConsolidada,
            totalCanais: unidadeConsolidada?.canais?.length || 0,
            totalVendas: unidadeConsolidada?.total || 0
          });
          
          if (unidadeConsolidada && unidadeConsolidada.canais) {
            setCanaisData(unidadeConsolidada.canais);
          } else {
            // Se não houver dados consolidados, usar os dados da primeira unidade
            if (unidadesData.length > 0 && unidadesData[0].canais) {
              console.log('📊 [CanalDeVendas] Usando dados da primeira unidade como fallback');
              setCanaisData(unidadesData[0].canais);
            } else {
              console.log('📊 [CanalDeVendas] Nenhum dado de canal encontrado');
              setCanaisData([]);
            }
          }
        } else {
          console.error('📊 [CanalDeVendas] Formato de dados inválido:', data);
          throw new Error("Formato de dados inválido - verifique os logs do console");
        }
      } catch (err) {
        console.error("Erro ao buscar dados de canais:", err);
        setError("Não foi possível carregar os dados de canal de vendas");
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [dataInicio, dataFim]);

  // Cores para o gráfico
  const COLORS = [
    '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8',
    '#82ca9d', '#ffc658', '#8dd1e1', '#a4de6c', '#d0ed57'
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
              className={`p-1.5 rounded-md transition-colors ${
                visualizacao === 'pizza' 
                  ? 'bg-primary/10 text-primary' 
                  : 'text-muted-foreground hover:text-primary hover:bg-muted'
              }`}
              title="Visualizar como gráfico de pizza"
            >
              <PieChartIcon size={18} />
            </button>
            <button 
              onClick={() => setVisualizacao('tabela')}
              className={`p-1.5 rounded-md transition-colors ${
                visualizacao === 'tabela' 
                  ? 'bg-primary/10 text-primary' 
                  : 'text-muted-foreground hover:text-primary hover:bg-muted'
              }`}
              title="Visualizar como tabela"
            >
              <BarChartIcon size={18} />
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

  if (loading) {
    return (
      <Card className="shadow-lg border border-gray-100 dark:border-gray-800">
        <CardHeader>
          <CardTitle><Skeleton className="h-6 w-52" /></CardTitle>
          <CardDescription><Skeleton className="h-4 w-72" /></CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] w-full flex items-center justify-center">
            <motion.div 
              className="flex flex-col items-center"
              animate={{ 
                opacity: [0.5, 1, 0.5],
                scale: [0.98, 1, 0.98]
              }}
              transition={{ 
                repeat: Infinity,
                duration: 1.5
              }}
            >
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
              <p className="text-sm text-muted-foreground">Carregando dados...</p>
            </motion.div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-gray-100 dark:border-gray-800">
        <CardHeader>
          <CardTitle>Canal de Vendas - Por Unidade</CardTitle>
          <CardDescription>Período: {dataInicio.toLocaleDateString()} a {dataFim.toLocaleDateString()}</CardDescription>
        </CardHeader>
        <CardContent>
          <motion.div 
            className="h-[400px] w-full flex items-center justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-red-500 text-center">
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ 
                  type: "spring",
                  stiffness: 260,
                  damping: 20 
                }}
                className="flex justify-center mb-4"
              >
                <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </motion.div>
              <p className="text-lg font-semibold">{error}</p>
              <p className="text-sm text-muted-foreground mt-2">
                Verifique sua conexão ou tente novamente mais tarde.
              </p>
            </div>
          </motion.div>
        </CardContent>
      </Card>
    );
  }

  if (canaisData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Canal de Vendas - Dados Gerais</CardTitle>
          <CardDescription>Período: {dataInicio.toLocaleDateString()} a {dataFim.toLocaleDateString()}</CardDescription>
        </CardHeader>
        <CardContent>
          <motion.div 
            className="h-[400px] w-full flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-center">
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-muted-foreground">
                  Nenhum dado disponível para o período selecionado.
                </p>
              </motion.div>
            </div>
          </motion.div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white dark:bg-gray-900 shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100 dark:border-gray-800">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl text-gray-900 dark:text-gray-100">
              Canal de Vendas - Dados Gerais
            </CardTitle>
            <CardDescription className="text-gray-500 dark:text-gray-400">
              Período: {dataInicio.toLocaleDateString()} a {dataFim.toLocaleDateString()}
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
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"
              title="Debug - Ver dados no console"
            >
              <Info size={18} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"
              title="Compartilhar"
            >
              <Share2 size={18} />
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
