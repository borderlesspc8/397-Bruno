import Link from "next/link";
import { Target } from "lucide-react";

import { Button } from "@/app/_components/ui/button";
import { Card, CardContent } from "@/app/_components/ui/card";

export default function GoalsNotFound() {
  return (
    <div className="container py-6">
      <Card>
        <CardContent className="flex min-h-[400px] flex-col items-center justify-center gap-4 text-center">
          <Target className="h-12 w-12 text-muted-foreground" />
          <div className="max-w-[420px] space-y-2">
            <h2 className="text-xl font-semibold">Página não encontrada</h2>
            <p className="text-sm text-muted-foreground">
              A página que você está procurando não existe ou foi removida.
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
