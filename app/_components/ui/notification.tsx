"use client";

import { useState, useEffect } from "react";
import { X, Check, Info, AlertTriangle, AlertCircle, Bell } from "lucide-react";
import { cn } from "../../_lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

// Definindo os tipos de notificação com variantes
const notificationVariants = cva(
  "fixed flex items-start gap-3 p-4 rounded-lg shadow-lg border transition-all duration-300 transform",
  {
    variants: {
      variant: {
        default: "bg-background/95 backdrop-blur-sm border-border",
        info: "bg-blue-50/95 backdrop-blur-sm border-blue-200 dark:bg-blue-950/80 dark:border-blue-800",
        success: "bg-green-50/95 backdrop-blur-sm border-green-200 dark:bg-green-950/80 dark:border-green-800",
        warning: "bg-amber-50/95 backdrop-blur-sm border-amber-200 dark:bg-amber-950/80 dark:border-amber-800",
        error: "bg-red-50/95 backdrop-blur-sm border-red-200 dark:bg-red-950/80 dark:border-red-800",
      },
      position: {
        topRight: "top-4 right-4",
        topLeft: "top-4 left-4",
        bottomRight: "bottom-4 right-4", 
        bottomLeft: "bottom-4 left-4",
        topCenter: "top-4 left-1/2 -translate-x-1/2",
        bottomCenter: "bottom-4 left-1/2 -translate-x-1/2",
      },
      size: {
        sm: "max-w-xs",
        md: "max-w-sm",
        lg: "max-w-md",
        xl: "max-w-lg",
        full: "w-full max-w-[calc(100%-2rem)]",
      },
    },
    defaultVariants: {
      variant: "default",
      position: "topRight",
      size: "md",
    },
  }
);

// Interface para os dados da notificação
export interface NotificationProps extends VariantProps<typeof notificationVariants> {
  title?: string;
  message: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  onClose?: () => void;
  autoClose?: boolean;
  duration?: number;
  className?: string;
  showIcon?: boolean;
}

/**
 * Componente de Notificação - Exibe notificações temporárias ou persistentes
 */
export function Notification({
  title,
  message,
  icon,
  action,
  variant = "default",
  position = "topRight",
  size = "md",
  onClose,
  autoClose = true,
  duration = 5000,
  className,
  showIcon = true,
}: NotificationProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  // Definir o ícone baseado na variante se não for fornecido
  const getDefaultIcon = () => {
    if (icon) return icon;
    
    switch (variant) {
      case "info":
        return <Info className="h-5 w-5 text-blue-500" />;
      case "success":
        return <Check className="h-5 w-5 text-green-500" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Bell className="h-5 w-5 text-muted-foreground" />;
    }
  };

  // Gerenciar o fechamento automático
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (autoClose && duration > 0) {
      timer = setTimeout(() => {
        handleClose();
      }, duration);
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [autoClose, duration]);

  // Fechar com animação
  const handleClose = () => {
    setIsExiting(true);
    
    // Aguardar a animação de saída
    setTimeout(() => {
      setIsVisible(false);
      if (onClose) onClose();
    }, 300);
  };

  // Se não estiver visível, não renderiza
  if (!isVisible) return null;

  return (
    <div
      className={cn(
        notificationVariants({ variant, position, size }),
        isExiting ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0",
        "z-50 drop-shadow-md",
        className
      )}
      role="alert"
    >
      {/* Ícone */}
      {showIcon && (
        <div className="flex-shrink-0">
          {getDefaultIcon()}
        </div>
      )}
      
      {/* Conteúdo */}
      <div className="flex-1 min-w-0">
        {title && (
          <h5 className="font-medium text-sm mb-1">
            {title}
          </h5>
        )}
        <p className="text-sm text-muted-foreground">
          {message}
        </p>
        
        {/* Ação, se fornecida */}
        {action && (
          <div className="mt-2">
            {action}
          </div>
        )}
      </div>
      
      {/* Botão de fechar */}
      <button
        onClick={handleClose}
        className="flex-shrink-0 rounded-full p-1.5 hover:bg-muted/40 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30"
        aria-label="Fechar notificação"
      >
        <X className="h-4 w-4 text-muted-foreground" />
      </button>
    </div>
  );
}

// Criando o contexto e provider para gerenciar múltiplas notificações
import React, { createContext, useContext } from "react";

// Interface para o contexto
interface NotificationContextType {
  showNotification: (props: Omit<NotificationProps, "onClose">) => string;
  closeNotification: (id: string) => void;
  closeAllNotifications: () => void;
}

// Criando o contexto
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Interface para o provedor
interface NotificationProviderProps {
  children: React.ReactNode;
  defaultPosition?: NotificationProps["position"];
  defaultDuration?: number;
  maxNotifications?: number;
}

// Interface para armazenar notificações internas
interface NotificationItem extends NotificationProps {
  id: string;
}

/**
 * Provider para gerenciar múltiplas notificações
 */
export function NotificationProvider({
  children,
  defaultPosition = "topRight",
  defaultDuration = 5000,
  maxNotifications = 5,
}: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Mostrar uma nova notificação
  const showNotification = (props: Omit<NotificationProps, "onClose">) => {
    const id = Math.random().toString(36).substring(2, 9);
    
    // Criar nova notificação
    const newNotification: NotificationItem = {
      ...props,
      id,
      position: props.position || defaultPosition,
      duration: props.duration || defaultDuration,
      onClose: () => closeNotification(id),
    };
    
    // Adicionar à lista, removendo as mais antigas se exceder o máximo
    setNotifications(current => {
      const updated = [newNotification, ...current];
      return updated.slice(0, maxNotifications);
    });
    
    return id;
  };

  // Fechar uma notificação específica
  const closeNotification = (id: string) => {
    setNotifications(current => 
      current.filter(notification => notification.id !== id)
    );
  };

  // Fechar todas as notificações
  const closeAllNotifications = () => {
    setNotifications([]);
  };

  // Valor do contexto
  const contextValue: NotificationContextType = {
    showNotification,
    closeNotification,
    closeAllNotifications,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      
      {/* Renderizar todas as notificações ativas */}
      {notifications.map(notification => (
        <Notification
          key={notification.id}
          {...notification}
        />
      ))}
    </NotificationContext.Provider>
  );
}

/**
 * Hook para usar o sistema de notificações
 */
export function useNotification() {
  const context = useContext(NotificationContext);
  
  if (context === undefined) {
    throw new Error("useNotification deve ser usado dentro de um NotificationProvider");
  }
  
  return context;
}

// Funções de atalho para tipos comuns de notificações
export function useNotifications() {
  const { showNotification, closeNotification, closeAllNotifications } = useNotification();
  
  return {
    showNotification,
    closeNotification,
    closeAllNotifications,
    info: (message: string, props?: Omit<NotificationProps, "message" | "variant">) => 
      showNotification({ message, variant: "info", ...props }),
    success: (message: string, props?: Omit<NotificationProps, "message" | "variant">) => 
      showNotification({ message, variant: "success", ...props }),
    warning: (message: string, props?: Omit<NotificationProps, "message" | "variant">) => 
      showNotification({ message, variant: "warning", ...props }),
    error: (message: string, props?: Omit<NotificationProps, "message" | "variant">) => 
      showNotification({ message, variant: "error", ...props }),
  };
}

// Componente para exibir o estado vazio de notificações
export function EmptyNotificationState({
  title = "Sem notificações",
  message = "As notificações aparecerão aqui quando você recebê-las.",
  className,
}: {
  title?: string;
  message?: string;
  className?: string;
}) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center p-8 text-center",
      className
    )}>
      <div className="relative w-16 h-16 mb-4">
        <div className="absolute inset-0 bg-muted/30 rounded-full flex items-center justify-center animate-pulse"></div>
        <Bell className="absolute inset-0 h-10 w-10 m-auto text-muted-foreground/60" strokeWidth={1.5} />
      </div>
      <h3 className="text-base font-medium text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-xs">{message}</p>
    </div>
  );
} 
