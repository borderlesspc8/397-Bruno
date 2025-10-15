"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/app/_components/ui/button";
import { AppleIcon } from "lucide-react";
import { useState } from "react";

export function AppleSignInButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn("apple", { callbackUrl: "/" });
    } catch (error) {
      console.error("Erro ao fazer login com Apple:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleSignIn}
      disabled={isLoading}
      className="flex items-center gap-2"
    >
      {isLoading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></span>
      ) : (
        <AppleIcon size={18} />
      )}
      Apple
    </Button>
  );
} 
