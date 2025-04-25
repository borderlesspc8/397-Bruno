import React from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/app/_components/ui/button';

interface BackButtonProps {
  href: string;
  label: string;
}

interface PageTitleProps {
  title: string;
  description?: string;
  backButton?: BackButtonProps;
}

export function PageTitle({ title, description, backButton }: PageTitleProps) {
  return (
    <div className="flex flex-col space-y-2">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        
        {backButton && (
          <Button variant="outline" size="sm" asChild>
            <Link href={backButton.href}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              {backButton.label}
            </Link>
          </Button>
        )}
      </div>
      
      {description && (
        <p className="text-muted-foreground">{description}</p>
      )}
    </div>
  );
} 