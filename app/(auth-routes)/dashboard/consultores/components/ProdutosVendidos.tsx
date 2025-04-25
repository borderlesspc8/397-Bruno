"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { useProdutosVendidos } from "../hooks/useProdutosVendidos";
import { formatCurrency, formatPercent } from "@/app/lib/utils";
import { Skeleton } from "@/app/_components/ui/skeleton";
import { ScrollArea } from "@/app/_components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/_components/ui/table";

interface ProdutosVendidosProps {
  dateRange: { from: Date; to: Date };
  consultorId?: string | null;
  onConsultorChange: (consultorId: string | null) => void;
}

export function ProdutosVendidos({ dateRange, consultorId, onConsultorChange }: ProdutosVendidosProps) {
  const { data, isLoading, error } = useProdutosVendidos({ dateRange, consultorId });

  if (error) {
    return (
      <div className="p-4 text-red-500">
        <p>{error}</p>
      </div>
    );
  }

  if (isLoading) {
    return <CarregandoProdutos />;
  }

  if (!data) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Resumo por Categoria */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Análise por Categoria</CardTitle>
          <CardDescription>Desempenho de vendas por categoria de produtos</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead>% do Total</TableHead>
                  <TableHead>Faturamento</TableHead>
                  <TableHead>Margem</TableHead>
                  <TableHead>Giro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.categorias.map((categoria) => (
                  <TableRow key={categoria.categoria}>
                    <TableCell className="font-medium">{categoria.categoria}</TableCell>
                    <TableCell>{categoria.quantidade}</TableCell>
                    <TableCell>{formatPercent(categoria.percentual)}</TableCell>
                    <TableCell>{formatCurrency(categoria.faturamento)}</TableCell>
                    <TableCell>{formatCurrency(categoria.margem)}</TableCell>
                    <TableCell>{categoria.giro}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Detalhes por Consultor */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Produtos por Consultor</CardTitle>
          <CardDescription>Detalhamento de produtos vendidos por consultor</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <div className="space-y-8">
              {data.consultores.map((consultor) => (
                <div key={consultor.id} className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-semibold">{consultor.nome}</h3>
                      <p className="text-sm text-muted-foreground">
                        Total de produtos: {consultor.totalProdutosVendidos} | 
                        Faturamento: {formatCurrency(consultor.faturamentoTotal)} | 
                        Margem média: {formatPercent(consultor.margemMediaPercentual)}
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
                        <TableHead>Produto</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Quantidade</TableHead>
                        <TableHead>Preço Unit.</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Margem</TableHead>
                        <TableHead>% Margem</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {consultor.produtos.map((produto) => (
                        <TableRow key={produto.id}>
                          <TableCell className="font-medium">{produto.nome}</TableCell>
                          <TableCell>{produto.categoria}</TableCell>
                          <TableCell>{produto.quantidade}</TableCell>
                          <TableCell>{formatCurrency(produto.preco)}</TableCell>
                          <TableCell>{formatCurrency(produto.totalVendido)}</TableCell>
                          <TableCell>{formatCurrency(produto.margem)}</TableCell>
                          <TableCell>{formatPercent(produto.margemPercentual)}</TableCell>
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

function CarregandoProdutos() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-4 w-[200px]" />
          <Skeleton className="h-3 w-[300px]" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
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