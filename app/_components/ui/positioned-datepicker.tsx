"use client";

import * as React from "react";
import { Calendar } from "./calendar";
import { Button } from "./button";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/app/_lib/utils";
import { useFloating, offset, flip, shift, autoUpdate } from "@floating-ui/react";
import { Card } from "./card";

interface PositionedDatePickerProps {
  date: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
}

export function PositionedDatePicker({
  date,
  onDateChange,
  placeholder = "Selecionar data",
  className,
}: PositionedDatePickerProps) {
  const [open, setOpen] = React.useState(false);

  const { refs, floatingStyles } = useFloating({
    placement: "bottom-start",
    open,
    onOpenChange: setOpen,
    middleware: [
      offset(4),
      flip({
        fallbackPlacements: ['top-start']
      }),
      shift()
    ],
    whileElementsMounted: autoUpdate
  });

  return (
    <div className={cn("relative", className)}>
      <Button
        ref={refs.setReference as any}
        variant="outline"
        className={cn(
          "justify-start text-left w-full font-normal",
          !date && "text-muted-foreground",
          className
        )}
        onClick={() => setOpen(!open)}
      >
        <CalendarIcon className="mr-2 h-4 w-4" />
        {date ? format(date, "PPP", { locale: ptBR }) : placeholder}
      </Button>
      
      {open && (
        <Card
          ref={refs.setFloating as any}
          style={{
            ...floatingStyles,
            zIndex: 50,
            position: "fixed",
          }}
          className="p-3 shadow-md border border-[#faba33]/20 rounded-lg"
        >
          <Calendar
            mode="single"
            selected={date}
            onSelect={(day) => {
              onDateChange(day);
              setOpen(false);
            }}
            initialFocus
            locale={ptBR}
          />
        </Card>
      )}
    </div>
  );
} 
