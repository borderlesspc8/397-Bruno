"use client";

import { Button } from "@/app/_components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/app/_components/ui/dropdown-menu";
import { formatCurrency } from "@/app/_lib/utils";
import { ChevronDown, FileSpreadsheet, FileDown, FileText, Download } from "lucide-react";
import { toast } from "sonner";
import { useMemo } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DREExportProps {
  data: any;
  period: "month" | "year";
  date: Date;
}

/**
 * Componente para exportação de dados do DRE
 */
export function DREExport({ data, period, date }: DREExportProps) {
  // Formatar o período para o nome do arquivo
  const formattedPeriod = useMemo(() => {
    if (period === "month") {
      return format(date, "MMMM_yyyy", { locale: ptBR });
    } else {
      return format(date, "yyyy", { locale: ptBR });
    }
  }, [period, date]);
  
  // Nome base para os arquivos exportados
  const baseFileName = `DRE_${formattedPeriod}`;
  
  // Função para exportar como CSV
  const exportAsCSV = () => {
    try {
      // Preparar os dados do DRE para formato CSV
      const dreData = data.consolidated || data.contaRapida;
      
      let csvContent = "Categoria,Tipo,Valor\n";
      
      // Adicionar receitas
      if (dreData.revenue && dreData.revenue.byCategory) {
        dreData.revenue.byCategory.forEach((cat: any) => {
          csvContent += `"${cat.name}","Receita","${cat.amount}"\n`;
        });
      }
      
      // Adicionar despesas
      if (dreData.expenses && dreData.expenses.byCategory) {
        dreData.expenses.byCategory.forEach((cat: any) => {
          csvContent += `"${cat.name}","Despesa","${cat.amount}"\n`;
        });
      }
      
      // Adicionar totais
      csvContent += `"Total","Receitas","${dreData.revenue?.total || 0}"\n`;
      csvContent += `"Total","Despesas","${dreData.expenses?.total || 0}"\n`;
      csvContent += `"Total","Lucro Bruto","${dreData.grossProfit || 0}"\n`;
      csvContent += `"Total","Lucro Líquido","${dreData.netProfit || 0}"\n`;
      csvContent += `"Total","Margem","${dreData.margin || 0}"\n`;
      
      // Criar blob e link para download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      
      link.setAttribute("href", url);
      link.setAttribute("download", `${baseFileName}.csv`);
      link.style.visibility = "hidden";
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("Arquivo CSV exportado com sucesso");
    } catch (error) {
      console.error("Erro ao exportar CSV:", error);
      toast.error("Erro ao exportar dados como CSV");
    }
  };
  
  // Função para exportar como Excel (XLSX)
  const exportAsExcel = () => {
    try {
      // Na prática, precisaríamos de uma biblioteca como exceljs ou xlsx
      // para criar arquivos Excel reais. Aqui vamos apenas simular
      toast.info("Exportação para Excel em desenvolvimento");
      
      // Implementação real exigiria algo como:
      // 1. Importar biblioteca: import * as XLSX from 'xlsx';
      // 2. Preparar worksheets com os dados
      // 3. Criar workbook e adicionar worksheets
      // 4. Exportar como arquivo .xlsx
    } catch (error) {
      console.error("Erro ao exportar Excel:", error);
      toast.error("Erro ao exportar dados como Excel");
    }
  };
  
  // Função para exportar como PDF
  const exportAsPDF = () => {
    try {
      // Na prática, precisaríamos de uma biblioteca como jspdf ou
      // react-pdf para criar arquivos PDF reais. Aqui vamos apenas simular
      toast.info("Exportação para PDF em desenvolvimento");
      
      // Implementação real exigiria algo como:
      // 1. Importar biblioteca: import { jsPDF } from 'jspdf';
      // 2. Criar documento PDF
      // 3. Adicionar conteúdo (tabelas, gráficos)
      // 4. Exportar como arquivo .pdf
    } catch (error) {
      console.error("Erro ao exportar PDF:", error);
      toast.error("Erro ao exportar dados como PDF");
    }
  };
  
  // Função para exportar dados brutos como JSON
  const exportAsJSON = () => {
    try {
      // Criar blob e link para download
      const jsonContent = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonContent], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      
      link.setAttribute("href", url);
      link.setAttribute("download", `${baseFileName}.json`);
      link.style.visibility = "hidden";
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("Arquivo JSON exportado com sucesso");
    } catch (error) {
      console.error("Erro ao exportar JSON:", error);
      toast.error("Erro ao exportar dados como JSON");
    }
  };
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Exportar
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportAsCSV} className="gap-2 cursor-pointer">
          <FileText className="h-4 w-4" />
          <span>Exportar como CSV</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportAsExcel} className="gap-2 cursor-pointer">
          <FileSpreadsheet className="h-4 w-4" />
          <span>Exportar como Excel</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportAsPDF} className="gap-2 cursor-pointer">
          <FileDown className="h-4 w-4" />
          <span>Exportar como PDF</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportAsJSON} className="gap-2 cursor-pointer">
          <FileText className="h-4 w-4" />
          <span>Exportar dados brutos (JSON)</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}