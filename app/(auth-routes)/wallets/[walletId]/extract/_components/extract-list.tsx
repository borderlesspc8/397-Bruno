"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/_components/ui/table";
import { BBTransaction } from "@/app/_lib/bb-integration";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  ArrowDownIcon, 
  ArrowUpIcon, 
  DownloadIcon, 
  FileIcon 
} from "lucide-react";
import { Button } from "@/app/_components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { formatCurrency } from "@/app/_lib/utils";

export interface ExtractData {
  wallet: {
    id: string;
    name: string;
    balance: number;
    bank: {
      id: string;
      name: string;
      logo: string;
    } | null;
  };
  transactions: BBTransaction[];
  startDate: Date;
  endDate: Date;
}

interface ExtractListProps {
  data: ExtractData;
}

export function ExtractList({ data }: ExtractListProps) {
  const transactions = data.transactions;
  
  const totalReceived = transactions
    .filter(t => t.indicadorSinalLancamento === "C")
    .reduce((acc, t) => acc + t.lancamentoContaCorrenteCliente.valorLancamentoRemessa, 0);
    
  const totalSpent = transactions
    .filter(t => t.indicadorSinalLancamento === "D")
    .reduce((acc, t) => acc + t.lancamentoContaCorrenteCliente.valorLancamentoRemessa, 0);
    
  const formatDate = (dateString: string | number) => {
    // Converter para string se for number
    const dateValue = typeof dateString === 'number' 
      ? String(dateString) 
      : dateString;
    
    // Verificar o formato da string de data
    if (dateValue.includes('-')) {
      const [year, month, day] = dateValue.split("-");
      return format(new Date(`${year}-${month}-${day}`), "dd/MM/yyyy", { locale: ptBR });
    } else {
      // Assumir que é uma data em formato YYYYMMDD
      const year = dateValue.substring(0, 4);
      const month = dateValue.substring(4, 6);
      const day = dateValue.substring(6, 8);
      return format(new Date(`${year}-${month}-${day}`), "dd/MM/yyyy", { locale: ptBR });
    }
  };
  
  const downloadCsv = () => {
    let csvContent = "Data,Descrição,Valor,Tipo\n";
    
    transactions.forEach(t => {
      const date = formatDate(t.dataMovimento);
      const description = t.lancamentoContaCorrenteCliente.complementoHistorico || 
                          t.lancamentoContaCorrenteCliente.nomeTipoOperacao;
      const value = t.lancamentoContaCorrenteCliente.valorLancamentoRemessa.toFixed(2).replace(".", ",");
      const type = t.indicadorSinalLancamento === "D" ? "Débito" : "Crédito";
      
      csvContent += `${date},"${description}",${value},${type}\n`;
    });
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    
    link.setAttribute("href", url);
    link.setAttribute("download", `extrato_${data.wallet.name}_${format(data.startDate, "dd-MM-yyyy")}_a_${format(data.endDate, "dd-MM-yyyy")}.csv`);
    link.style.visibility = "hidden";
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Período do Extrato
            </CardTitle>
            <CardDescription>
              {format(data.startDate, "dd/MM/yyyy")} até {format(data.endDate, "dd/MM/yyyy")}
            </CardDescription>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600 flex items-center">
              <ArrowUpIcon className="h-4 w-4 mr-1" />
              Total Recebido
            </CardTitle>
            <CardDescription className="text-green-700 text-lg font-bold">
              {formatCurrency(totalReceived)}
            </CardDescription>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600 flex items-center">
              <ArrowDownIcon className="h-4 w-4 mr-1" />
              Total Gasto
            </CardTitle>
            <CardDescription className="text-red-700 text-lg font-bold">
              {formatCurrency(totalSpent)}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
      
      <div className="flex justify-end mb-4">
        <Button variant="outline" onClick={downloadCsv}>
          <DownloadIcon className="h-4 w-4 mr-2" />
          Exportar CSV
        </Button>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead>Tipo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                  <FileIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  Nenhuma transação encontrada neste período
                </TableCell>
              </TableRow>
            ) : (
              transactions.map((transaction, index) => {
                const isDebit = transaction.indicadorSinalLancamento === "D";
                const value = transaction.lancamentoContaCorrenteCliente.valorLancamentoRemessa;
                const description = transaction.lancamentoContaCorrenteCliente.complementoHistorico || 
                                   transaction.lancamentoContaCorrenteCliente.nomeTipoOperacao;
                
                return (
                  <TableRow key={index}>
                    <TableCell>{formatDate(transaction.dataMovimento)}</TableCell>
                    <TableCell className="font-medium">{description}</TableCell>
                    <TableCell className={`text-right font-medium ${isDebit ? "text-red-600" : "text-green-600"}`}>
                      {isDebit ? "- " : "+ "}
                      {formatCurrency(value)}
                    </TableCell>
                    <TableCell>
                      <div className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                        isDebit 
                          ? "bg-red-50 text-red-700 border border-red-200" 
                          : "bg-green-50 text-green-700 border border-green-200"
                      }`}>
                        {isDebit 
                          ? <ArrowDownIcon className="h-3 w-3 mr-1" /> 
                          : <ArrowUpIcon className="h-3 w-3 mr-1" />
                        }
                        {isDebit ? "Saída" : "Entrada"}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
} 