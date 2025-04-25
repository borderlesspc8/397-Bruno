"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useSession } from "next-auth/react";

interface DashboardHeaderProps {
  title: string;
  description?: string;
}

export function DashboardHeader({ title, description }: DashboardHeaderProps) {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const { data: session } = useSession();
  const userName = session?.user?.name || "Usuário";

  // Atualizar a data a cada minuto
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDate(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const formattedDate = format(currentDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR });
  const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  return (
    <div className="flex flex-col gap-1 mb-6 lg:mb-8">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-2">
        <h1 className="text-2xl lg:text-3xl font-bold">{title}</h1>
        <div className="text-sm text-muted-foreground">
          <span className="hidden sm:inline">Olá, {userName} • </span>
          {capitalizedDate}
        </div>
      </div>
      {description && <p className="text-muted-foreground">{description}</p>}
    </div>
  );
} 