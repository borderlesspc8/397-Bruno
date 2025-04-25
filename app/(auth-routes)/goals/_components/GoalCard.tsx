"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/app/_components/ui/badge";
import { Button } from "@/app/_components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/app/_components/ui/card";
import { Progress } from "@/app/_components/ui/progress";
import { 
  FinancialGoal, 
  GoalCardProps 
} from "../types";
import { 
  calculateProgress, 
  formatCurrency, 
  getCategoryLabel, 
  getStatusColor, 
  getStatusLabel 
} from "../utils";

export function GoalCard({ goal }: GoalCardProps) {
  const progressPercentage = calculateProgress(goal.currentAmount, goal.targetAmount);

  return (
    <Card className="relative overflow-hidden group">
      <div
        className="absolute inset-0 opacity-10 transition-opacity group-hover:opacity-20"
        style={{
          backgroundColor: goal.colorAccent || "#4F46E5",
        }}
      />
      <CardHeader>
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className={getStatusColor(goal.status)}>
            {getStatusLabel(goal.status)}
          </Badge>
          <span className="text-sm text-muted-foreground">
            {format(new Date(goal.targetDate), "PPP", { locale: ptBR })}
          </span>
        </div>
        <CardTitle>{goal.title}</CardTitle>
        {goal.description && <CardDescription>{goal.description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progresso</span>
            <span className="font-medium">
              {formatCurrency(goal.currentAmount)} de{" "}
              {formatCurrency(goal.targetAmount)}
            </span>
          </div>
          <Progress
            value={progressPercentage}
            className="h-2"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>
              {progressPercentage}%
            </span>
            <span>{getCategoryLabel(goal.category)}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          variant="ghost"
          className="w-full gap-2"
          asChild
        >
          <Link href={`/goals/${goal.id}`}>
            Ver Detalhes
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
} 