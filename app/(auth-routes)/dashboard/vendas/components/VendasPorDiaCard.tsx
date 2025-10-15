import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/_components/ui/card';
import { VendasPorDiaChart } from './VendasPorDiaChart';
import { VendasPorDia } from './VendasPorDia';
import { Calendar, BarChart2, List, Download } from 'lucide-react';
import { Button } from '@/app/_components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/app/_components/ui/toggle-group';
import { VendaDetalheModal } from './VendaDetalheModal';

interface VendasPorDiaCardProps {
  dataInicio: Date;
  dataFim: Date;
}

export function VendasPorDiaCard({
  dataInicio,
  dataFim
}: VendasPorDiaCardProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [visualizacao, setVisualizacao] = useState<"grafico" | "lista">("grafico");
  const [vendaModalAberta, setVendaModalAberta] = useState(false);
  const [vendasDoDia, setVendasDoDia] = useState<any[]>([]);
  const [dataSelecionada, setDataSelecionada] = useState<string | null>(null);
  
  // Detectar tela mobile
  useEffect(() => {
    const checkIsMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      
      // Em dispositivos móveis, padronizar para visualização em lista
      if (mobile && visualizacao === "grafico") {
        setVisualizacao("lista");
      }
    };
    
    // Verificar na primeira renderização
    checkIsMobile();
    
    // Verificar quando a tela for redimensionada
    window.addEventListener('resize', checkIsMobile);
    
    // Limpar o evento quando o componente for desmontado
    return () => {
      window.removeEventListener('resize', checkIsMobile);
    };
  }, [visualizacao]);
  
  // Manipular clique em um dia específico
  const handleDiaClick = (data: string, vendas: any[]) => {
    setDataSelecionada(data);
    setVendasDoDia(vendas);
    setVendaModalAberta(true);
  };
  
  // Manipular download dos dados
  const handleDownload = () => {
    // Implementação da exportação ficaria aqui
    alert('Função de exportação de dados');
  };

  return (
    <Card className="shadow-md border-gray-200 dark:border-gray-700 overflow-hidden">
      <CardHeader className="px-4 py-4 flex flex-row justify-between items-center">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg font-bold">
            <Calendar className="h-5 w-5 text-blue-500" />
            Vendas por Dia
          </CardTitle>
          <CardDescription>
            Análise diária do período selecionado
          </CardDescription>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Botões de visualização para desktop */}
          {!isMobile && (
            <ToggleGroup type="single" value={visualizacao} onValueChange={(value) => value && setVisualizacao(value as "grafico" | "lista")}>
              <ToggleGroupItem value="grafico" aria-label="Visualizar como gráfico">
                <BarChart2 className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="lista" aria-label="Visualizar como lista">
                <List className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>
          )}
          
          {/* Botão de exportar dados */}
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8"
            onClick={handleDownload}
          >
            <Download className="h-4 w-4 mr-1" />
            <span className="sr-only md:not-sr-only md:inline-block">Exportar</span>
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="px-4 pb-4">
        {/* Visualização de gráfico (apenas desktop) */}
        {!isMobile && visualizacao === "grafico" ? (
          <VendasPorDiaChart 
            dataInicio={dataInicio}
            dataFim={dataFim}
          />
        ) : (
          <VendasPorDia 
            dataInicio={dataInicio}
            dataFim={dataFim}
            onDiaClick={handleDiaClick}
          />
        )}
      </CardContent>
      
      {/* Modal para exibir detalhes das vendas do dia */}
      {vendaModalAberta && vendasDoDia.length > 0 && dataSelecionada && (
        <VendaDetalheModal 
          venda={{
            // Criar um objeto de venda para passar ao modal
            id: dataSelecionada,
            data: dataSelecionada,
            itens: vendasDoDia,
            titulo: `Vendas do dia ${new Date(dataSelecionada).toLocaleDateString('pt-BR')}`
          }}
          aberto={vendaModalAberta}
          onOpenChange={setVendaModalAberta}
          onClose={() => setVendaModalAberta(false)}
        />
      )}
    </Card>
  );
} 
