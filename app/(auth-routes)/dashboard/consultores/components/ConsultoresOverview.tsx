"use client";

import { useCallback, useMemo } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale/pt-BR'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/_components/ui/table'
import { Card } from '@/app/_components/ui/card'
import { formatCurrency, formatPercent } from '@/app/lib/utils'
import { ConsultorIndicadores } from '@/app/types/consultores'

interface ConsultoresOverviewProps {
  data?: ConsultorIndicadores[]
  isLoading?: boolean
}

export function ConsultoresOverview({ data = [], isLoading = false }: ConsultoresOverviewProps) {
  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => b.faturamento - a.faturamento)
  }, [data])

  const getVariationColor = useCallback((variation: number) => {
    if (variation > 0) return 'text-green-600'
    if (variation < 0) return 'text-red-600'
    return 'text-gray-600'
  }, [])

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="h-[400px] w-full animate-pulse bg-gray-200 rounded-lg" />
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Consultor</TableHead>
            <TableHead className="text-right">Faturamento</TableHead>
            <TableHead className="text-right">Vendas</TableHead>
            <TableHead className="text-right">Ticket Médio</TableHead>
            <TableHead className="text-right">Taxa de Conversão</TableHead>
            <TableHead className="text-right">Var. Faturamento</TableHead>
            <TableHead className="text-right">Var. Vendas</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.map((consultor) => (
            <TableRow key={consultor.id}>
              <TableCell className="font-medium">{consultor.nome}</TableCell>
              <TableCell className="text-right">
                {formatCurrency(consultor.faturamento)}
              </TableCell>
              <TableCell className="text-right">
                {consultor.vendasRealizadas}
              </TableCell>
              <TableCell className="text-right">
                {formatCurrency(consultor.ticketMedio)}
              </TableCell>
              <TableCell className="text-right">
                {formatPercent(consultor.taxaConversao)}
              </TableCell>
              <TableCell className={`text-right ${getVariationColor(consultor.variacaoMesAnterior)}`}>
                {formatPercent(consultor.variacaoMesAnterior)}
              </TableCell>
              <TableCell className={`text-right ${getVariationColor(consultor.variacaoAnoAnterior)}`}>
                {formatPercent(consultor.variacaoAnoAnterior)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  )
} 
