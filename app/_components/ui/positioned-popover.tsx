"use client";

import * as React from "react";
import { type Placement } from "@floating-ui/react";
import { useFloating, offset, flip, shift, autoUpdate } from "@floating-ui/react";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { cn } from "@/app/_lib/utils";

interface PositionedPopoverProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  className?: string;
  sideOffset?: number;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function PositionedPopover({
  trigger,
  children,
  side = "bottom",
  align = "center", 
  className,
  sideOffset = 4,
  open,
  onOpenChange,
}: PositionedPopoverProps) {
  const placement = `${side}-${align}` as Placement;
  const [localOpen, setLocalOpen] = React.useState(false);
  
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : localOpen;
  
  const handleOpenChange = React.useCallback((state: boolean) => {
    if (!isControlled) {
      setLocalOpen(state);
    }
    onOpenChange?.(state);
  }, [isControlled, onOpenChange]);

  const { refs, floatingStyles } = useFloating({
    placement,
    open: isOpen,
    onOpenChange: handleOpenChange,
    middleware: [
      offset(sideOffset),
      flip({
        fallbackPlacements: ['top', 'bottom']
      }),
      shift()
    ],
    whileElementsMounted: autoUpdate
  });

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild ref={refs.setReference as any}>
        {trigger}
      </PopoverTrigger>
      <PopoverContent 
        ref={refs.setFloating as any}
        style={{
          ...floatingStyles,
          position: "fixed",
          width: "var(--radix-popover-content-width)",
          zIndex: 999999,
        }}
        className={cn(
          "p-0 shadow-lg border border-border/40 rounded-lg",
          className
        )}
      >
        {children}
      </PopoverContent>
    </Popover>
  );
} 