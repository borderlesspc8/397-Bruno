"use client";

import { UserData } from "../types";
import { formatRelativeTime } from "../utils/formatters";
import { CheckCircle, AlertCircle, Clock } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../ui/tooltip";

interface AccountStatusProps {
  userData: UserData | null;
  isLoading: boolean;
}

export const AccountStatus = ({ userData, isLoading }: AccountStatusProps) => {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-1 animate-pulse">
        <div className="h-4 w-20 bg-muted rounded"></div>
        <div className="h-4 w-32 bg-muted rounded"></div>
      </div>
    );
  }
  
  if (!userData) return null;
  
  const { emailVerified, lastActivity } = userData;
  
  return (
    <div className="flex flex-col gap-0.5 mt-1">
      {/* Status de verificação de email */}
      <div className="flex items-center text-xs">
        {emailVerified ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center text-green-500">
                  <CheckCircle className="h-3.5 w-3.5 mr-1" />
                  <span>Email verificado</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Sua conta está verificada e segura</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center text-amber-500">
                  <AlertCircle className="h-3.5 w-3.5 mr-1" />
                  <span>Email não verificado</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Verifique seu email para maior segurança</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      
      {/* Última atividade */}
      <div className="flex items-center text-xs text-muted-foreground">
        <Clock className="h-3 w-3 mr-1 opacity-70" />
        <span>Última atividade: {formatRelativeTime(lastActivity)}</span>
      </div>
    </div>
  );
}; 