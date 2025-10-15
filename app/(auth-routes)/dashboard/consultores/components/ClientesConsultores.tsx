"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { useClientesConsultores } from "../hooks/useClientesConsultores";
import { formatCurrency, formatPercent, formatDateBR } from "@/app/lib/utils";
import { Skeleton } from "@/app/_components/ui/skeleton";
import { ScrollArea } from "@/app/_components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/_components/ui/table";
import { Badge } from "@/app/_components/ui/badge";

interface ClientesConsultoresProps {
  dateRange: { from: Date; to: Date };
  consultorId?: string | null;
  onConsultorChange: (consultorId: string | null) => void;
}

export function ClientesConsultores({ dateRange, consultorId, onConsultorChange }: ClientesConsultoresProps) {
  const { data, isLoading, error } = useClientesConsultores({ dateRange, consultorId });

  if (error) {
    return (
      <div className="p-4 text-red-500">
        <p>{error}</p>
      </div>
    );
  }

  if (isLoading) {
    return <CarregandoClientes />;
  }

  if (!data) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Segmentação de Clientes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Segmentação de Clientes</CardTitle>
          <CardDescription>Análise por perfil de cliente</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {data.segmentacao.map((segmento) => (
              <Card key={segmento.segmento}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{segmento.segmento}</CardTitle>
                  <CardDescription className="text-xs">{segmento.descricao}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    <p className="text-2xl font-bold">{segmento.quantidade}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatPercent(segmento.percentual)} do total
                    </p>
                    <p className="text-sm font-medium">
                      {formatCurrency(segmento.valorTotal)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detalhes por Consultor */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Clientes por Consultor</CardTitle>
          <CardDescription>Detalhamento de clientes por consultor</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            <div className="space-y-8">
              {data.consultores.map((consultor) => (
                <div key={consultor.id} className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-semibold">{consultor.nome}</h3>
                      <p className="text-sm text-muted-foreground">
                        Total de clientes: {consultor.totalClientes} | 
                        Ativos: {consultor.clientesAtivos} ({formatPercent(consultor.taxaRetencao)}) | 
                        Taxa de recompra: {formatPercent(consultor.taxaRecompra)}
                      </p>
                    </div>
                    {!consultorId && (
                      <button
                        onClick={() => onConsultorChange(consultor.id)}
                        className="text-sm text-primary hover:underline"
                      >
                        Ver detalhes
                      </button>
                    )}
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Última Compra</TableHead>
                        <TableHead>Compras</TableHead>
                        <TableHead>Valor Total</TableHead>
                        <TableHead>Ticket Médio</TableHead>
                        <TableHead>Inadimplência</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {consultor.clientes.map((cliente) => (
                        <TableRow key={cliente.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{cliente.nome}</p>
                              <p className="text-xs text-muted-foreground">{cliente.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                cliente.statusAtual === 'Ativo'
                                  ? 'default'
                                  : cliente.statusAtual === 'Inadimplente'
                                  ? 'destructive'
                                  : cliente.statusAtual === 'Lead'
                                  ? 'secondary'
                                  : 'outline'
                              }
                            >
                              {cliente.statusAtual}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDateBR(cliente.dataUltimaCompra)}</TableCell>
                          <TableCell>{cliente.comprasRealizadas}</TableCell>
                          <TableCell>{formatCurrency(cliente.valorCompras)}</TableCell>
                          <TableCell>{formatCurrency(cliente.ticketMedio)}</TableCell>
                          <TableCell>
                            {cliente.inadimplencia > 0 ? (
                              <span className="text-destructive font-medium">
                                {formatCurrency(cliente.inadimplencia)}
                              </span>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

function CarregandoClientes() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-4 w-[200px]" />
          <Skeleton className="h-3 w-[300px]" />
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {[...Array(5)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-[100px]" />
                  <Skeleton className="h-3 w-[150px]" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    <Skeleton className="h-8 w-[80px]" />
                    <Skeleton className="h-3 w-[100px]" />
                    <Skeleton className="h-4 w-[120px]" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <Skeleton className="h-4 w-[200px]" />
          <Skeleton className="h-3 w-[300px]" />
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <Skeleton className="h-6 w-[200px]" />
                    <Skeleton className="h-4 w-[300px]" />
                  </div>
                </div>
                <div className="space-y-2">
                  {[...Array(3)].map((_, j) => (
                    <Skeleton key={j} className="h-12 w-full" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
