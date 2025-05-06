import * as React from "react";

import { cn } from "@/app/_lib/utils";

/**
 * Componente Card
 */
const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-xl border bg-card text-card-foreground shadow",
      className
    )}
    {...props}
  />
));
Card.displayName = "Card";

/**
 * Componente CardHeader
 */
const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

/**
 * Componente CardTitle
 */
const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("font-semibold leading-none tracking-tight", className)}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

/**
 * Componente CardDescription
 */
const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

/**
 * Componente CardContent
 */
const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

/**
 * Componente CardFooter
 */
const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

// Novo componente para estatísticas
const CardStat = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    label: string;
    value: string | number;
    trend?: "up" | "down" | "neutral";
    trendValue?: string | number;
  }
>(({ className, label, value, trend, trendValue, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1", className)}
    {...props}
  >
    <p className="text-sm font-medium text-muted-foreground dark:text-slate-400">{label}</p>
    <div className="flex items-center">
      <p className="text-2xl font-bold">{value}</p>
      {trend && (
        <span 
          className={cn(
            "ml-2 text-xs font-medium",
            trend === "up" && "text-emerald-500 dark:text-emerald-400",
            trend === "down" && "text-red-500 dark:text-red-400",
            trend === "neutral" && "text-slate-500 dark:text-slate-400"
          )}
        >
          {trend === "up" && "↑ "}
          {trend === "down" && "↓ "}
          {trendValue}
        </span>
      )}
    </div>
  </div>
));
CardStat.displayName = "CardStat";

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  CardStat,
};
