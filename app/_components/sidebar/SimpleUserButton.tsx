"use client";

import React from "react";
import { useSession } from "next-auth/react";
import { UserButton } from "../user-button";

interface SimpleUserButtonProps {
  collapsed: boolean;
}

export function SimpleUserButton({ collapsed }: SimpleUserButtonProps) {
  const { data: session } = useSession();
  const name = session?.user?.name || '';
  const email = session?.user?.email || '';
  
  // Gerar iniciais do nome ou email
  const getInitials = () => {
    if (name) {
      const nameParts = name.split(' ');
      if (nameParts.length > 1) {
        return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
    } else if (email) {
      return email.substring(0, 2).toUpperCase();
    }
    return 'U';
  };
  
  if (collapsed) {
    return (
      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
        {getInitials()}
      </div>
    );
  }
  
  return <UserButton />;
} 
