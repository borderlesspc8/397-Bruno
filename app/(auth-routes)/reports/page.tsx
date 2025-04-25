import { redirect } from 'next/navigation';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Relatórios | ContaRápida',
  description: 'Análise e visualização detalhada de seus dados financeiros',
};

export default function ReportsPage() {
  // Redirecionamento para o relatório de despesas como página padrão
  redirect('/reports/expenses');
} 