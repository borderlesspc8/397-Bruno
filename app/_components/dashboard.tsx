import React from "react";

interface DashboardProps {
  children: React.ReactNode;
}

export default function Dashboard({ children }: DashboardProps) {
  return (
    <div className="min-h-screen bg-background transition-all duration-300">
      <main className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 md:py-6 lg:py-8">
        <div className="grid gap-3 sm:gap-4 md:gap-6 lg:gap-8">
          {children}
        </div>
      </main>
    </div>
  );
} 
