import { Wallet } from "@prisma/client";
import { Building2, CreditCard, Wallet as WalletIcon, Receipt } from "lucide-react";
import { Button } from "@/app/_components/ui/button";
import Link from "next/link";

export interface WalletCardProps {
  wallet: Wallet & {
    bank?: {
      name: string;
      logo?: string | null;
    } | null;
    balance: number;
  };
  onClick?: (wallet: any) => void;
}

export function WalletCard({ wallet, onClick }: WalletCardProps) {
  // Formatar o saldo como moeda brasileira
  const formattedBalance = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(wallet.balance || 0);
  
  // Determinar a cor do saldo com base no valor
  const getBalanceColorClass = () => {
    if ((wallet.balance || 0) > 0) {
      return "text-green-600 dark:text-green-400";
    } else if ((wallet.balance || 0) < 0) {
      return "text-red-600 dark:text-red-400";
    }
    return "text-muted-foreground";
  };
  
  // Renderizar o tipo da carteira
  const renderWalletType = () => {
    if ((wallet.type as string) === "BANK" || (wallet.type as string) === "BANK_INTEGRATION") {
      return wallet.bank?.name || "Conta bancária";
    } else if ((wallet.type as string) === "CASH") {
      return "Dinheiro";
    } else if ((wallet.type as string) === "CREDIT_CARD") {
      return "Cartão de crédito";
    } else if ((wallet.type as string) === "INVESTMENT") {
      return "Investimento";
    }
    return "Outros";
  };
  
  // Renderizar o ícone da carteira
  const renderWalletIcon = () => {
    let iconStyle = `h-8 w-8 p-1.5 rounded-md bg-primary/10 text-primary`;
    
    if ((wallet.type as string) === "BANK" || (wallet.type as string) === "BANK_INTEGRATION") {
      if (wallet.bank?.logo) {
        return (
          <div className="h-8 w-8 rounded-md overflow-hidden">
            <img src={wallet.bank.logo} alt={wallet.bank.name} className="h-full w-full object-cover" />
          </div>
        );
      }
      return <Building2 className={iconStyle} />;
    } else if ((wallet.type as string) === "CREDIT_CARD") {
      return <CreditCard className={iconStyle} />;
    }
    
    return <WalletIcon className={iconStyle} />;
  };
  
  // Manipular o clique no cartão vs. clique no botão de transações
  const handleCardClick = (e: React.MouseEvent) => {
    // Se temos um manipulador de clique e o clique não foi no botão de transações
    if (onClick && !e.defaultPrevented) {
      onClick(wallet);
    }
  };
  
  return (
    <div 
      className="p-4 rounded-lg border cursor-pointer transition-all hover:bg-accent/50"
      onClick={handleCardClick}
    >
      <div className="flex items-center gap-3 mb-2">
        {/* Ícone da carteira ou do banco */}
        {renderWalletIcon()}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold truncate">{wallet.name}</h3>
          <p className="text-xs text-muted-foreground">{renderWalletType()}</p>
        </div>
      </div>
      
      <div className="flex justify-between items-center mt-3">
        <Link
          href={`/transactions?carteira=${wallet.id}`}
          passHref
          onClick={(e) => e.stopPropagation()} // Evitar que o clique propague para o cartão
        >
          <Button 
            variant="ghost" 
            size="sm"
            className="px-2 h-8 text-xs"
          >
            <Receipt className="h-3.5 w-3.5 mr-1" />
            Ver transações
          </Button>
        </Link>
        
        <div className={`font-medium ${getBalanceColorClass()}`}>
          {formattedBalance}
        </div>
      </div>
    </div>
  );
} 