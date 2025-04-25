"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "./ui/card";
import { Transaction } from "@/app/(auth-routes)/transactions/_columns";
import { Info } from "lucide-react";
import { 
  formatarData, 
  formatarMoeda, 
  isDebitoTransaction,
  getValorFormatado,
  getValorColorClass
} from "@/app/_utils/transaction-utils";

interface TransactionDetailsProps {
  transaction: Transaction;
}

export function TransactionDetails({ transaction }: TransactionDetailsProps) {
  const isBankTransaction = transaction.metadata && transaction.metadata.source === "bank_import";
  const metadata = transaction.metadata || {};
  
  // Determinar informações para exibição
  let descricao = transaction.name;
  let informacaoComplementar = "";
  let categoria = transaction.category || "Não categorizado";
  
  if (isBankTransaction) {
    // A descrição já é o textoDescricaoHistorico (foi atribuído ao name)
    descricao = transaction.name;
    
    // Usar textoInformacaoComplementar como informação complementar
    informacaoComplementar = metadata.textoInformacaoComplementar || "";
  } else {
    // Para transações manuais, usar a categoria como informação complementar
    informacaoComplementar = categoria;
  }

  // Determinar a classe de cor com base no indicadorSinalLancamento ou tipo de transação
  const ehDebito = isBankTransaction 
    ? isDebitoTransaction(metadata) 
    : transaction.type === "EXPENSE";
  
  const valorClass = getValorColorClass(ehDebito);
  
  // Verificar se é um lançamento de saldo
  const isSaldoTransaction = isBankTransaction && metadata.isSaldoTransaction;
  
  // Valor formatado com sinal
  const valorFormatado = getValorFormatado(transaction.amount, ehDebito);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Info className="h-4 w-4" />
          <span className="sr-only">Ver detalhes</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Detalhes da Transação</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Cabeçalho de detalhes */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">{descricao}</h3>
              <span className={`font-bold ${valorClass}`}>
                {valorFormatado}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground">{informacaoComplementar}</p>
              {categoria && (
                <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                  {categoria}
                </span>
              )}
            </div>
          </div>
          
          {/* Tabela de detalhes no estilo do extrato */}
          <div className="border rounded-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Data
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Descrição
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Categoria
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                    Valor
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-4 py-2 text-blue-600">
                    {formatarData(transaction.date)}
                  </td>
                  <td className="px-4 py-2 text-blue-600">
                    {descricao}
                  </td>
                  <td className="px-4 py-2">
                    <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                      {categoria}
                    </span>
                  </td>
                  <td className={`px-4 py-2 text-right font-medium ${valorClass}`}>
                    {valorFormatado}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          {/* Informações adicionais para transações bancárias */}
          {isBankTransaction && (
            <div className="border-t pt-4">
              <h4 className="font-medium mb-2">Detalhes do Lançamento</h4>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                {metadata.indicadorTipoLancamento && (
                  <>
                    <span className="text-muted-foreground">Tipo de Lançamento:</span>
                    <span>{metadata.indicadorTipoLancamento}</span>
                  </>
                )}
                
                {metadata.indicadorSinalLancamento && (
                  <>
                    <span className="text-muted-foreground">Sinal:</span>
                    <span>{metadata.indicadorSinalLancamento === "C" ? "Crédito" : "Débito"}</span>
                  </>
                )}
                
                {metadata.codigoHistorico > 0 && (
                  <>
                    <span className="text-muted-foreground">Código Histórico:</span>
                    <span>{metadata.codigoHistorico}</span>
                  </>
                )}
                
                {metadata.numeroLote > 0 && (
                  <>
                    <span className="text-muted-foreground">Número do Lote:</span>
                    <span>{metadata.numeroLote}</span>
                  </>
                )}
                
                {metadata.numeroDocumento > 0 && (
                  <>
                    <span className="text-muted-foreground">Número do Documento:</span>
                    <span>{metadata.numeroDocumento}</span>
                  </>
                )}
                
                {/* CPF/CNPJ Mascarado no lugar do número completo */}
                {metadata.numeroCpfCnpjMascarado && (
                  <>
                    <span className="text-muted-foreground">CPF/CNPJ Contrapartida:</span>
                    <span>{metadata.numeroCpfCnpjMascarado}</span>
                  </>
                )}
                
                {metadata.indicadorTipoPessoaContrapartida && (
                  <>
                    <span className="text-muted-foreground">Tipo Pessoa:</span>
                    <span>{metadata.indicadorTipoPessoaContrapartida === "F" ? "Física" : "Jurídica"}</span>
                  </>
                )}
                
                {metadata.textoInformacaoComplementar && (
                  <>
                    <span className="text-muted-foreground">Informação Complementar:</span>
                    <span>{metadata.textoInformacaoComplementar}</span>
                  </>
                )}
              </div>
            </div>
          )}
          
          {/* Informações da carteira */}
          {transaction.wallet && (
            <div className="border-t pt-4">
              <h4 className="font-medium mb-2">Carteira</h4>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Nome:</span>
                <span>{transaction.wallet.name}</span>
              </div>
            </div>
          )}
          
          {/* ID de referência */}
          <div className="border-t pt-4 text-xs text-muted-foreground">
            <span>ID: {transaction.id}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 