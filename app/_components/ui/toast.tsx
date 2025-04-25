"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/app/_lib/utils";
import { useToast } from "./use-toast";

const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const { toasts } = useToast();

  return (
    <>
      {children}
      <div className="fixed top-0 z-[100] flex flex-col gap-2 p-4 max-h-screen w-full pointer-events-none sm:top-auto sm:bottom-0 sm:right-0 sm:flex-col-reverse sm:max-w-[420px]">
        {toasts.map(({ id, title, description, variant, visible }) => (
          <Toast
            key={id}
            id={id}
            title={title}
            description={description}
            variant={variant}
            visible={visible}
          />
        ))}
      </div>
    </>
  );
};

const Toast = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    id: string;
    title?: string;
    description?: string;
    variant?: "default" | "destructive" | "success";
    visible?: boolean;
  }
>(({ className, id, title, description, variant = "default", visible, ...props }, ref) => {
  const { dismiss } = useToast();

  return (
    <div
      ref={ref}
      className={cn(
        "group pointer-events-auto relative flex w-full items-start gap-4 overflow-hidden rounded-md border p-4 shadow-md transition-all data-[visible=false]:animate-hide data-[visible=true]:animate-enter",
        variant === "default" && "bg-background",
        variant === "destructive" && "destructive border-destructive bg-destructive text-destructive-foreground",
        variant === "success" && "border-green-500 bg-green-500 text-white",
        !visible && "hidden",
        className
      )}
      data-visible={visible}
      {...props}
    >
      <div className="grid flex-1 gap-1">
        {title && <div className="font-medium">{title}</div>}
        {description && <div className="text-sm opacity-90">{description}</div>}
      </div>
      <button
        onClick={() => dismiss(id)}
        className={cn(
          "h-6 w-6 shrink-0 flex items-center justify-center rounded-md",
          variant === "default" && "text-muted-foreground hover:text-foreground",
          variant === "destructive" && "text-destructive-foreground/80 hover:text-destructive-foreground",
          variant === "success" && "text-white/80 hover:text-white"
        )}
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Fechar</span>
      </button>
    </div>
  );
});

Toast.displayName = "Toast";

export { ToastProvider, Toast }; 