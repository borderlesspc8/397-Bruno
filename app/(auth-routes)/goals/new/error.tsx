"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";

import { Button } from "@/app/_components/ui/button";
import { Card, CardContent } from "@/app/_components/ui/card";

export default function NewGoalError() {
  return (
    <div className="container py-6">
      <Card>
        <CardContent className="flex min-h-[400px] flex-col items-center justify-center gap-4 text-center">
          <AlertTriangle className="h-12 w-12 text-destructive" />
          <div className="max-w-[420px] space-y-2">
            <h2 className="text-xl font-semibold">Erro ao criar meta</h2>
            <p className="text-sm text-muted-foreground">
              Ocorreu um erro ao tentar criar uma nova meta. Por favor, tente
              novamente mais tarde.
            </p>
          </div>
          <Button asChild>
            <Link href="/goals">Voltar para Metas</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
} 