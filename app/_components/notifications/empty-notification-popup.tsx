"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { NotificationCenterPopup } from "../ui/notification-center-popup";

export default function EmptyNotificationPopupDemo() {
  const [mounted, setMounted] = useState(false);
  const portalRef = useRef<HTMLDivElement | null>(null);
  
  // Montar somente no cliente
  useEffect(() => {
    setMounted(true);
    
    // Criar div para o portal se não existir
    if (!portalRef.current) {
      const div = document.createElement("div");
      div.id = "notification-center-portal";
      document.body.appendChild(div);
      portalRef.current = div;
    }
    
    // Limpar ao desmontar
    return () => {
      if (portalRef.current) {
        document.body.removeChild(portalRef.current);
        portalRef.current = null;
      }
    };
  }, []);
  
  // Não renderizar no servidor
  if (!mounted) return null;
  
  return createPortal(
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40">
      <NotificationCenterPopup />
    </div>,
    portalRef.current || document.body
  );
} 