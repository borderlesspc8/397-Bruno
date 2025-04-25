import * as React from "react";

import { cn } from "@/app/_lib/utils";

/**
 * Componente Card
 */
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-card text-card-foreground shadow-sm",
        className
      )}
      {...props}
    />
  );
}

/**
 * Componente CardHeader
 */
interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

function CardHeader({ className, ...props }: CardHeaderProps) {
  return (
    <div
      className={cn("flex flex-col space-y-1.5 p-6", className)}
      {...props}
    />
  );
}

/**
 * Componente CardTitle
 */
interface CardTitleProps
  extends React.HTMLAttributes<HTMLHeadingElement> {}

function CardTitle({ className, ...props }: CardTitleProps) {
  return (
    <h3
      className={cn(
        "text-lg font-semibold leading-none tracking-tight",
        className
      )}
      {...props}
    />
  );
}

/**
 * Componente CardDescription
 */
interface CardDescriptionProps
  extends React.HTMLAttributes<HTMLParagraphElement> {}

function CardDescription({ className, ...props }: CardDescriptionProps) {
  return (
    <p
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

/**
 * Componente CardContent
 */
interface CardContentProps
  extends React.HTMLAttributes<HTMLDivElement> {}

function CardContent({ className, ...props }: CardContentProps) {
  return <div className={cn("p-6 pt-0", className)} {...props} />;
}

/**
 * Componente CardFooter
 */
interface CardFooterProps
  extends React.HTMLAttributes<HTMLDivElement> {}

function CardFooter({ className, ...props }: CardFooterProps) {
  return (
    <div
      className={cn("flex items-center p-6 pt-0", className)}
      {...props}
    />
  );
}

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
