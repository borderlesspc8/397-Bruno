import { Suspense } from 'react';
import { ReconciliationPageClient } from './_components/reconciliation-page-client';

export default function ReconciliationPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Conciliação de Transações</h1>
      <Suspense fallback={<div>Carregando...</div>}>
        <ReconciliationPageClient />
      </Suspense>
    </div>
  );
} 