import { ConsultorIndicadores } from "@/app/types/consultores";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { formatCurrency, formatPercent } from "@/app/lib/utils";

interface IndicadoresConsultorProps {
  consultor: ConsultorIndicadores;
}

export function IndicadoresConsultor({ consultor }: IndicadoresConsultorProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Faturamento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(consultor.faturamento)}</div>
          <p className="text-xs text-muted-foreground">
            {formatPercent(consultor.variacaoMesAnterior)} vs mês anterior
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(consultor.ticketMedio)}</div>
          <p className="text-xs text-muted-foreground">
            {consultor.vendasRealizadas} vendas realizadas
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatPercent(consultor.taxaConversao)}</div>
          <p className="text-xs text-muted-foreground">
            {consultor.atendimentosRealizados} atendimentos
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Meta Realizada</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatPercent(consultor.metaRealizado)}</div>
          <p className="text-xs text-muted-foreground">
            {formatCurrency(consultor.metaMensal)} meta mensal
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tempo Médio de Fechamento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{consultor.tempoMedioFechamento} dias</div>
          <p className="text-xs text-muted-foreground">
            {consultor.followUpsRealizados} follow-ups
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tempo Médio de Resposta</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{consultor.tempoMedioResposta} min</div>
          <p className="text-xs text-muted-foreground">
            Média de tempo de resposta
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Taxa de Recompra</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{consultor.clientesRecompra}</div>
          <p className="text-xs text-muted-foreground">
            {formatPercent(consultor.taxaAbandono)} taxa de abandono
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Posição no Ranking</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">#{consultor.posicaoRanking}</div>
          <p className="text-xs text-muted-foreground">
            {formatCurrency(consultor.bonificacaoEstimada)} em bonificação
          </p>
        </CardContent>
      </Card>
    </div>
  );
} 