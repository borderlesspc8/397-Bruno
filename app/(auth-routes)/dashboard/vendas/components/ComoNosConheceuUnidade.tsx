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

interface OrigemData {
  origem: string;
  quantidade: number;
  percentual: number;
}

interface UnidadeData {
  id: string;
  nome: string;
  origens: OrigemData[];
  total: number;
}

interface ComoNosConheceuUnidadeProps {
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

// Componente para os cartões de origens
const OrigemCard = ({ origem, index, color }: { origem: OrigemData, index: number, color: string }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, delay: index * 0.05 }}
    className="p-3 rounded-lg bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow duration-200"
  >
    <div className="flex items-center justify-between mb-2">
      <span className="font-medium">{origem.origem}</span>
      <span className="text-sm font-medium">{origem.quantidade} leads</span>
    </div>
    <AnimatedProgressBar percentual={origem.percentual} color={color} />
    <div className="text-right text-sm text-muted-foreground mt-1">
      {formatPercentCorreto(origem.percentual)}
    </div>
  </motion.div>
);

export function ComoNosConheceuUnidade({ dataInicio, dataFim }: ComoNosConheceuUnidadeProps) {
  const [unidades, setUnidades] = useState<UnidadeData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [unidadeSelecionada, setUnidadeSelecionada] = useState<string | null>(null);
  const [visualizacao, setVisualizacao] = useState<'pizza' | 'tabela'>('pizza');

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      
      try {
        // Formatar datas para string no formato YYYY-MM-DD
        const dataInicioStr = dataInicio.toISOString().split('T')[0];
        const dataFimStr = dataFim.toISOString().split('T')[0];
        
        // Buscar dados de origens por unidade usando o novo endpoint
        const response = await fetch(
          `/api/dashboard/origens?dataInicio=${dataInicioStr}&dataFim=${dataFimStr}`
        );
        
        if (!response.ok) {
          throw new Error(`Erro ao buscar dados: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Processar os dados retornados pelo endpoint
        if (data && data.dashboard && data.dashboard.origemLeadsPorUnidade) {
          const unidadesData: UnidadeData[] = data.dashboard.origemLeadsPorUnidade;
          setUnidades(unidadesData);
          
          // Selecionar a visualização consolidada por padrão
          if (unidadesData.length > 0 && !unidadeSelecionada) {
            setUnidadeSelecionada(unidadesData[0].id);
          }
        } else {
          throw new Error("Formato de dados inválido");
        }
      } catch (err) {
        console.error("Erro ao buscar dados de origens:", err);
        setError("Não foi possível carregar os dados de origem");
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [dataInicio, dataFim, unidadeSelecionada]);

  // Cores para o gráfico
  const COLORS = [
    '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8',
    '#82ca9d', '#ffc658', '#8dd1e1', '#a4de6c', '#d0ed57'
  ];

  // Renderizar informações da unidade selecionada
  const renderUnidadeChart = () => {
    const unidade = unidades.find(u => u.id === unidadeSelecionada);
    
    if (!unidade) return null;
    
    // Verificar se é a visualização consolidada (Todas as Unidades)
    const isConsolidado = unidade.id === "todos";
    
    // Preparar dados para o gráfico de barras quando for visualização consolidada
    const chartData = [...unidade.origens]
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 15) // Limitar a 15 itens para melhor visualização (igual ao componente de Vendas Realizadas)
      .map(origem => ({
        origem: origem.origem,
        quantidade: origem.quantidade,
        percentual: origem.percentual
      }));
    
    return (
      <motion.div 
        className="mt-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Cabeçalho da unidade com contador animado */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">
            {unidade.nome}
            {isConsolidado && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({unidades.length - 1} unidades)
              </span>
            )}
          </h3>
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
                      outerRadius={isConsolidado ? 100 : 80}
                      innerRadius={isConsolidado ? 40 : 0} // Donut chart para consolidado
                      fill="#8884d8"
                      dataKey="quantidade"
                      nameKey="origem"
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
                        `${props.payload.origem}: ${value} (${(props.payload.percentual * 100).toFixed(1)}%)`,
                        
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
                      dataKey="origem" 
                      type="category" 
                      width={100}
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => value.length > 15 ? `${value.substring(0, 15)}...` : value}
                    />
                    <Tooltip
                      formatter={(value) => [`${value} leads`, 'Quantidade']}
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
              <Info size={14} className="mr-1.5" /> Detalhamento por origem
            </h4>
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {chartData.map((origem, index) => (
                <OrigemCard 
                  key={index} 
                  origem={origem} 
                  index={index} 
                  color={COLORS[index % COLORS.length]} 
                />
              ))}
            </div>
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
          <CardTitle>Como nos Conheceu - Por Unidade</CardTitle>
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

  if (unidades.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Como nos Conheceu - Por Unidade</CardTitle>
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

  // Separar a unidade consolidada das demais para destacá-la na interface
  const unidadeConsolidada = unidades.find(u => u.id === "todos");
  const unidadesIndividuais = unidades.filter(u => u.id !== "todos");

  return (
    <Card className="bg-white dark:bg-gray-900 shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100 dark:border-gray-800">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl text-gray-900 dark:text-gray-100">
              Como nos Conheceu - Por Unidade
            </CardTitle>
            <CardDescription className="text-gray-500 dark:text-gray-400">
              Período: {dataInicio.toLocaleDateString()} a {dataFim.toLocaleDateString()}
            </CardDescription>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"
            title="Compartilhar"
          >
            <Share2 size={18} />
          </motion.button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Botão para visualização consolidada com animação */}
          {unidadeConsolidada && (
            <motion.div 
              className="w-full flex justify-center mb-2"
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <motion.button
                onClick={() => setUnidadeSelecionada(unidadeConsolidada.id)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className={`px-6 py-2.5 text-base rounded-full transition-all font-medium shadow-sm ${
                  unidadeSelecionada === unidadeConsolidada.id
                    ? 'bg-primary text-primary-foreground shadow'
                    : 'bg-muted hover:bg-primary/90 hover:text-primary-foreground'
                }`}
              >
                <motion.span
                  animate={{ scale: [1, 1.03, 1] }}
                  transition={{ repeat: unidadeSelecionada === unidadeConsolidada.id ? Infinity : 0, repeatDelay: 3, duration: 0.5 }}
                  className="flex items-center"
                >
                  {unidadeConsolidada.nome} 
                  <motion.span 
                    className="ml-1.5 px-2 py-0.5 text-sm rounded-full bg-white/20 dark:bg-black/20"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    {unidadeConsolidada.total} leads
                  </motion.span>
                </motion.span>
              </motion.button>
            </motion.div>
          )}
          
          {/* Linha separadora com animação */}
          <motion.div 
            className="relative"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-200 dark:border-gray-700" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-gray-900 px-3 py-1 rounded-full text-muted-foreground border border-gray-200 dark:border-gray-700">Por unidade</span>
            </div>
          </motion.div>
          
          {/* Botões para unidades individuais com animação */}
          <motion.div className="flex flex-wrap gap-2 justify-center">
            {unidadesIndividuais.map((unidade, index) => (
              <motion.button
                key={unidade.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + (index * 0.05), duration: 0.3 }}
                whileHover={{ scale: 1.05, backgroundColor: "#f8f8f8" }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setUnidadeSelecionada(unidade.id)}
                className={`px-4 py-2 text-sm rounded-md transition-all flex items-center space-x-1 ${
                  unidadeSelecionada === unidade.id
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'bg-muted hover:shadow-sm'
                }`}
              >
                <span>{unidade.nome}</span>
                <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                  unidadeSelecionada === unidade.id
                    ? 'bg-white/20 dark:bg-black/20'
                    : 'bg-gray-200 dark:bg-gray-700'
                }`}>
                  {unidade.total}
                </span>
              </motion.button>
            ))}
          </motion.div>
        </div>
        
        <AnimatePresence mode="wait">
          <motion.div
            key={unidadeSelecionada}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderUnidadeChart()}
          </motion.div>
        </AnimatePresence>
      </CardContent>
    </Card>
  );
} 