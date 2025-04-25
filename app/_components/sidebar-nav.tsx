import Link from "next/link";
import { cn } from "@/app/_lib/utils";
import {
  CircleDollarSign,
  LayoutDashboard,
  Receipt,
  WalletCards,
  Landmark,
  Users,
  Settings,
  FileBarChart,
  BarChart4,
  FileText,
  CreditCard,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { ScrollArea } from "./ui/scroll-area";

export interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
  items?: {
    href: string;
    title: string;
    icon?: React.ReactNode;
  }[];
}

/**
 * Componente de navegação lateral
 */
export function SidebarNav({ className, items, ...props }: SidebarNavProps) {
  const pathname = usePathname();

  // Itens de navegação padrão
  const defaultItems = [
    {
      href: "/painel",
      title: "Dashboard",
      icon: <LayoutDashboard className="mr-2 h-4 w-4" />,
    },
    {
      href: "/transactions",
      title: "Transações",
      icon: <CreditCard className="mr-2 h-4 w-4" />,
    },
    {
      href: "/wallets",
      title: "Carteiras",
      icon: <WalletCards className="mr-2 h-4 w-4" />,
    },
    {
      href: "/categories",
      title: "Categorias",
      icon: <FileText className="mr-2 h-4 w-4" />,
    },
    {
      href: "/cost-centers",
      title: "Centros de Custo",
      icon: <Landmark className="mr-2 h-4 w-4" />,
    },
    {
      href: "/cash-flow",
      title: "Fluxo de Caixa",
      icon: <FileBarChart className="mr-2 h-4 w-4" />,
    },
    {
      href: "/dre",
      title: "DRE",
      icon: <BarChart4 className="mr-2 h-4 w-4" />,
    },
    {
      href: "/invoices",
      title: "Notas Fiscais",
      icon: <Receipt className="mr-2 h-4 w-4" />,
    },
    {
      href: "/users",
      title: "Usuários",
      icon: <Users className="mr-2 h-4 w-4" />,
    },
    {
      href: "/settings",
      title: "Configurações",
      icon: <Settings className="mr-2 h-4 w-4" />,
    },
  ];

  const navItems = items || defaultItems;

  return (
    <ScrollArea className="h-full">
      <nav className={cn("flex w-full flex-col gap-2 p-2", className)} {...props}>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "group flex w-full items-center rounded-md border border-transparent px-2 py-1 hover:bg-muted hover:text-foreground",
              pathname?.startsWith(item.href)
                ? "bg-muted font-medium text-foreground"
                : "text-muted-foreground"
            )}
          >
            {item.icon || <CircleDollarSign className="mr-2 h-4 w-4" />}
            {item.title}
          </Link>
        ))}
      </nav>
    </ScrollArea>
  );
} 