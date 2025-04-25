"use client";

import React, { useState, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "../ui/input";
import { cn } from "../../_lib/utils";

export const SearchBar = () => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    startTransition(() => {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    });
  }, [searchQuery, router]);

  return (
    <form 
      onSubmit={handleSearch}
      className="flex flex-1 items-center justify-center max-w-md mx-4"
    >
      <div className="relative w-full group">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <Search className={cn(
            "h-4 w-4 transition-colors duration-200",
            isPending ? "text-muted-foreground/50" : "text-muted-foreground group-focus-within:text-primary"
          )} />
        </div>
        <Input 
          type="search" 
          placeholder="Buscar transações..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          disabled={isPending}
          className={cn(
            "w-full pl-10 pr-4",
            "bg-secondary/50",
            "border-none",
            "rounded-full",
            "focus-visible:ring-1 focus-visible:ring-ring",
            "placeholder:text-muted-foreground",
            isPending && "opacity-50"
          )}
        />
      </div>
    </form>
  );
}; 