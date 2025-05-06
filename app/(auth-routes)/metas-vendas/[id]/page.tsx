"use client";

import { FormularioMeta } from "../components/formulario-meta";

export default function EditarMetaPage({ params }: { params: { id: string } }) {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Editar Meta de Vendas</h1>
      <FormularioMeta id={params.id} />
    </div>
  );
} 