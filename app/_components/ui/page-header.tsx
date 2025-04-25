import { cn } from "@/app/_lib/utils";
import React from "react";

interface PageHeaderProps {
  className?: string;
  children: React.ReactNode;
}

export function PageHeader({ className, children }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col space-y-2", className)}>
      {children}
    </div>
  );
}

interface PageHeadingProps {
  className?: string;
  children: React.ReactNode;
}

export function PageHeading({ className, children }: PageHeadingProps) {
  return (
    <h1 className={cn("text-3xl font-bold tracking-tight", className)}>
      {children}
    </h1>
  );
}

interface PageDescriptionProps {
  className?: string;
  children: React.ReactNode;
}

export function PageDescription({ className, children }: PageDescriptionProps) {
  return (
    <p className={cn("text-muted-foreground", className)}>
      {children}
    </p>
  );
} 