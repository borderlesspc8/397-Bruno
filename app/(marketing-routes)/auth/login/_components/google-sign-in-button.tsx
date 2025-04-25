"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/app/_components/ui/button";
import Image from "next/image";
import { useState } from "react";

export function GoogleSignInButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn("google", { callbackUrl: "/painel" });
    } catch (error) {
      console.error("Erro ao fazer login com Google:", error);
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
        <Image src="/google-logo.svg" alt="Google" width={18} height={18} />
      )}
      Google
    </Button>
  );
} 