"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/_components/ui/dialog";
import { Button } from "@/app/_components/ui/button";
import { Code } from "lucide-react";
import { ScrollArea } from "@/app/_components/ui/scroll-area";

interface DebugModalProps {
  title?: string;
  data: any;
}

export function DebugModal({ title = "Informações de Debug", data }: DebugModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  const formatValue = (value: any): string => {
    try {
      return JSON.stringify(value, null, 2);
    } catch (error) {
      return String(value);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1">
          <Code className="h-4 w-4" />
          Debug
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Informações para depuração da aplicação
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] rounded-md border p-4">
          <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
            {formatValue(data)}
          </pre>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
} 
