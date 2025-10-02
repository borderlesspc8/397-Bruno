"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/_hooks/useAuth";
import { Loader2 } from "lucide-react";

interface AuthRedirectProps {
  redirectTo?: string;
  children?: React.ReactNode;
}

export function AuthRedirect({ redirectTo = "/dashboard/vendas", children }: AuthRedirectProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push(redirectTo);
    }
  }, [user, loading, router, redirectTo]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (user) {
    return null; // Será redirecionado pelo useEffect
  }

  return <>{children}</>;
}
