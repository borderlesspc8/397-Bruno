'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/app/components/ui/table';
import { formatCurrency } from '@/app/_utils/format';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Venda, VendasService } from '@/app/_services/vendas';

interface VendasExternasProps {
  dataInicio: Date;
  dataFim: Date;
}

export function VendasExternas({ dataInicio, dataFim }: VendasExternasProps) {
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [totalVendas, setTotalVendas] = useState(0);
  const [totalValor, setTotalValor] = useState(0);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    const buscarVendas = async () => {
      try {
        setLoading(true);
        setErro(null);

        const response = await VendasService.buscarVendasExternas({
          dataInicio,
          dataFim
        });
        
        // Verificar se há erro
        if (response.erro) {
          throw new Error(response.erro);
        }
        
        // Verificar se há mensagem de retorno
        if (response.mensagem) {
          setErro(response.mensagem);
        }
        
        setVendas(response.vendas || []);
        setTotalVendas(response.totalVendas || 0);
        setTotalValor(response.totalValor || 0);
      } catch (error) {
        console.error('Erro ao buscar vendas:', error);
        setErro(error instanceof Error ? error.message : 'Erro ao buscar vendas');
      } finally {
        setLoading(false);
      }
    };

    buscarVendas();
  }, [dataInicio, dataFim]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Vendas Externas - API Betel Tecnologia</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-[300px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#faba33] mx-auto mb-4"></div>
              <p className="text-muted-foreground">Carregando dados de vendas...</p>
            </div>
          </div>
        ) : erro ? (
          <div className="flex items-center justify-center h-[300px]">
            <div className="text-center">
              <div className="text-red-500 text-xl mb-4">⚠️</div>
              <p className="text-muted-foreground">{erro}</p>
            </div>
          </div>
        ) : vendas.length === 0 ? (
          <div className="flex items-center justify-center h-[300px]">
            <div className="text-center">
              <p className="text-muted-foreground">Nenhuma venda encontrada no período selecionado</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between bg-gray-100 p-4 rounded-lg">
              <div>
                <span className="text-sm text-gray-500">Total de vendas:</span>
                <p className="text-2xl font-bold">{totalVendas}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Valor total:</span>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(totalValor)}</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vendas.map((venda) => (
                    <TableRow key={venda.id}>
                      <TableCell className="font-medium">{venda.id}</TableCell>
                      <TableCell>{venda.cliente || 'Cliente não identificado'}</TableCell>
                      <TableCell>
                        {venda.data_inclusao 
                          ? format(new Date(venda.data_inclusao), 'dd/MM/yyyy', { locale: ptBR })
                          : 'Data não disponível'
                        }
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(parseFloat(venda.valor_total || '0'))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 