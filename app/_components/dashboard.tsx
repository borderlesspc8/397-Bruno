import React from "react";

interface DashboardProps {
  children: React.ReactNode;
}

export default function Dashboard({ children }: DashboardProps) {
  return (
    <div className="min-h-screen bg-background">
      <main className="p-4 md:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
} 