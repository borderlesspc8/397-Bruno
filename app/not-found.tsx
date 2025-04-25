'use client';

import Link from 'next/link';
import { Button } from '@/app/_components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/_components/ui/card';

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">404 - Página não encontrada</CardTitle>
          <CardDescription>
            A página que você está procurando não existe ou foi movida.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center my-6">
            <p className="text-4xl font-bold text-primary">404</p>
            <p className="mt-2 text-gray-600">
              Não conseguimos encontrar a página que você estava procurando.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button asChild>
            <Link href="/">
              Voltar para página inicial
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 