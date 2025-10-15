"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { useHistoricoVendas } from "../hooks/useHistoricoVendas";
import { formatCurrency, formatPercent, getVariationColor } from "@/app/lib/utils";
import { Skeleton } from "@/app/_components/ui/skeleton";
import { ScrollArea } from "@/app/_components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/_components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/_components/ui/select";

interface HistoricoVendasProps {
  dateRange: { from: Date; to: Date };
  consultorId?: string | null;
  onConsultorChange: (consultorId: string | null) => void;
}

export function HistoricoVendas({ dateRange, consultorId, onConsultorChange }: HistoricoVendasProps) {
  const [tipoPeriodo, setTipoPeriodo] = useState<'diario' | 'semanal' | 'mensal'>('mensal');
  
  const { data, isLoading, error } = useHistoricoVendas({ 
    dateRange, 
    consultorId,
    tipoPeriodo
  });

  if (error) {
    return (
      <div className="p-4 text-red-500">
        <p>{error}</p>
      </div>
    );
  }

  if (isLoading) {
    return <CarregandoHistorico />;
  }

  if (!data) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Comparativo de Períodos */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Período Atual</CardTitle>
            <CardDescription>
              {data.comparativo.atual.inicio} a {data.comparativo.atual.fim}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Faturamento Total</p>
              <p className="text-2xl font-bold">
                {formatCurrency(data.comparativo.atual.faturamentoTotal)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Vendas Totais</p>
              <p className="text-2xl font-bold">{data.comparativo.atual.vendasTotal}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Variação</CardTitle>
            <CardDescription>Comparativo com período anterior</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Variação Faturamento</p>
              <p className={`text-2xl font-bold ${getVariationColor(data.comparativo.variacao.faturamento)}`}>
                {formatPercent(data.comparativo.variacao.faturamento)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Variação Vendas</p>
              <p className={`text-2xl font-bold ${getVariationColor(data.comparativo.variacao.vendas)}`}>
                {formatPercent(data.comparativo.variacao.vendas)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Histórico por Período */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-lg">Histórico por Período</CardTitle>
              <CardDescription>Evolução de vendas e faturamento</CardDescription>
            </div>
            <Select 
              value={tipoPeriodo}
              onValueChange={(value) => setTipoPeriodo(value as 'diario' | 'semanal' | 'mensal')}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Selecione o período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="diario">Diário</SelectItem>
                <SelectItem value="semanal">Semanal</SelectItem>
                <SelectItem value="mensal">Mensal</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Período</TableHead>
                  <TableHead>Vendas</TableHead>
                  <TableHead>Faturamento</TableHead>
                  <TableHead>Atendimentos</TableHead>
                  <TableHead>Conversão</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.historico.map((periodo) => (
                  <TableRow key={periodo.data}>
                    <TableCell className="font-medium">{periodo.periodo}</TableCell>
                    <TableCell>
                      {periodo.consultores.reduce((total, c) => total + c.vendas, 0)}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(
                        periodo.consultores.reduce((total, c) => total + c.faturamento, 0)
                      )}
                    </TableCell>
                    <TableCell>
                      {periodo.consultores.reduce((total, c) => total + c.atendimentos, 0)}
                    </TableCell>
                    <TableCell>
                      {formatPercent(
                        periodo.consultores.reduce((total, c) => total + c.conversao, 0) /
                          periodo.consultores.length
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Comparativo por Consultor */}
      {!consultorId && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Comparativo por Consultor</CardTitle>
            <CardDescription>Performance individual no período</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Consultor</TableHead>
                    <TableHead>Faturamento Atual</TableHead>
                    <TableHead>Vendas Atual</TableHead>
                    <TableHead>Variação Faturamento</TableHead>
                    <TableHead>Variação Vendas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.comparativo.porConsultor.map((consultor) => (
                    <TableRow 
                      key={consultor.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => onConsultorChange(consultor.id)}
                    >
                      <TableCell className="font-medium">{consultor.nome}</TableCell>
                      <TableCell>{formatCurrency(consultor.atual.faturamento)}</TableCell>
                      <TableCell>{consultor.atual.vendas}</TableCell>
                      <TableCell className={getVariationColor(consultor.variacao.faturamento)}>
                        {formatPercent(consultor.variacao.faturamento)}
                      </TableCell>
                      <TableCell className={getVariationColor(consultor.variacao.vendas)}>
                        {formatPercent(consultor.variacao.vendas)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function CarregandoHistorico() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        {[...Array(2)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-[150px]" />
              <Skeleton className="h-3 w-[100px]" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[...Array(2)].map((_, j) => (
                <div key={j}>
                  <Skeleton className="h-3 w-[100px] mb-1" />
                  <Skeleton className="h-6 w-[120px]" />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-4 w-[200px]" />
          <Skeleton className="h-3 w-[150px]" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
