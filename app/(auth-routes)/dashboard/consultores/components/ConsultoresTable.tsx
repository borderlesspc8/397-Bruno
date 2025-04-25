import { ConsultorIndicadores } from "@/app/types/consultores";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/_components/ui/table";
import { formatCurrency, formatPercent } from "@/app/lib/utils";

interface ConsultoresTableProps {
  consultores: ConsultorIndicadores[];
}

export function ConsultoresTable({ consultores }: ConsultoresTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Consultor</TableHead>
            <TableHead className="text-right">Faturamento</TableHead>
            <TableHead className="text-right">Ticket Médio</TableHead>
            <TableHead className="text-right">Taxa de Conversão</TableHead>
            <TableHead className="text-right">Meta Realizada</TableHead>
            <TableHead className="text-right">Atendimentos</TableHead>
            <TableHead className="text-right">Vendas</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {consultores.map((consultor) => (
            <TableRow key={consultor.id}>
              <TableCell>{consultor.nome}</TableCell>
              <TableCell className="text-right">{formatCurrency(consultor.faturamento)}</TableCell>
              <TableCell className="text-right">{formatCurrency(consultor.ticketMedio)}</TableCell>
              <TableCell className="text-right">{formatPercent(consultor.taxaConversao)}</TableCell>
              <TableCell className="text-right">{formatPercent(consultor.metaRealizado)}</TableCell>
              <TableCell className="text-right">{consultor.atendimentosRealizados}</TableCell>
              <TableCell className="text-right">{consultor.vendasRealizadas}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
} 