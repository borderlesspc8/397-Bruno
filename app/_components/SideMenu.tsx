import { Button } from '@/app/_components/ui/button';
import { cn } from '@/app/_lib/utils';
import { Building2, CreditCard, Home, LogOut, PiggyBank, Wallet } from 'lucide-react';
import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Badge } from '@/app/_components/ui/badge';
import { Database } from 'lucide-react';

export function SideMenu() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <div className="space-y-4 py-4 flex flex-col h-full bg-slate-900 text-slate-50">
      <div className="px-3 py-2">
        <h2 className="mb-2 px-4 text-lg font-semibold">Dashboard</h2>
        <div className="space-y-1">
          <Link href="/">
            <Button
              variant="ghost"
              className={cn('w-full justify-start', {
                'bg-slate-800': isActive('/'),
              })}
            >
              <Home className="mr-2 h-4 w-4" />
              Início
            </Button>
          </Link>
          <Link href="/wallets">
            <Button
              variant="ghost"
              className={cn('w-full justify-start', {
                'bg-slate-800': isActive('/wallets'),
              })}
            >
              <Wallet className="mr-2 h-4 w-4" />
              Carteiras
            </Button>
          </Link>
          <Link href="/banks">
            <Button
              variant="ghost"
              className={cn('w-full justify-start', {
                'bg-slate-800': isActive('/banks'),
              })}
            >
              <Building2 className="mr-2 h-4 w-4" />
              Bancos
            </Button>
          </Link>
          <Link href="/investments">
            <Button
              variant="ghost"
              className={cn('w-full justify-start', {
                'bg-slate-800': isActive('/investments'),
              })}
            >
              <PiggyBank className="mr-2 h-4 w-4" />
              Investimentos
            </Button>
          </Link>
        </div>
      </div>
      <div className="mt-auto px-3 py-2">
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={() => signOut()}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </Button>
      </div>
    </div>
  );
} 