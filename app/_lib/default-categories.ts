import { Category, Wallet, TransactionPaymentMethod } from "../_components/transactions/transaction-schema";
import { 
  ShoppingCart, 
  CreditCard, 
  Utensils, 
  Home, 
  Building, 
  Briefcase, 
  ShoppingBag, 
  HeartPulse,
  Dog,
  Gift,
  Shirt,
  Car,
  Plane,
  GraduationCap,
  Baby,
  Receipt,
  PiggyBank,
  Film,
  DollarSign,
  Wallet as WalletIcon,
  RefreshCw,
  FileText,
  Coffee,
  Users,
  ScrollText,
  LucideIcon
} from "lucide-react";
import React, { ReactNode } from "react";

// Cria um wrapper para o ícone com tamanho e cor determinados
const iconComponent = (Icon: LucideIcon, color?: string): ReactNode => {
  return React.createElement(Icon, { size: 16, color: color || undefined });
};

// Categorias padrão para despesas (baseado no modelo fornecido)
export const DEFAULT_EXPENSE_CATEGORIES: Category[] = [
  { 
    id: "98173dc4157783e0206ab018a742eafde339a318", 
    name: "Alimentação", 
    type: "expense", 
    icon: iconComponent(ShoppingCart), 
    color: "#EC61A2" 
  },
  { 
    id: "f4dbd43cc5c6f18f311667910325702568f6c95b", 
    name: "Assinaturas e serviços", 
    type: "expense", 
    icon: iconComponent(CreditCard), 
    color: "#7253C8" 
  },
  { 
    id: "b4c59c695c751783ddb20fd66f9bc3e62c5cc7e8", 
    name: "Bares e restaurantes", 
    type: "expense", 
    icon: iconComponent(Utensils), 
    color: "#4B20C0" 
  },
  { 
    id: "74182621b2e18bf17b3bbc08f2ac1cc0daba00c0", 
    name: "Casa", 
    type: "expense", 
    icon: iconComponent(Home), 
    color: "#5096DC" 
  },
  { 
    id: "570c0af75cd2f481db3e6360eeb3179a0c1a6b95", 
    name: "Compras", 
    type: "expense", 
    icon: iconComponent(ShoppingBag), 
    color: "#C13E7C" 
  },
  { 
    id: "e7184fee95111c4b00941ff7375eea3f60b74a08", 
    name: "Cuidados pessoais", 
    type: "expense", 
    icon: iconComponent(HeartPulse), 
    color: "#FF6669" 
  },
  { 
    id: "a9ed38472841f053e57ed7bb70098ba15148da74", 
    name: "Dívidas e empréstimos", 
    type: "expense", 
    icon: iconComponent(FileText), 
    color: "#FF9696" 
  },
  { 
    id: "0ea21fce058cffff20de650f38b5cc0e54201b91", 
    name: "Educação", 
    type: "expense", 
    icon: iconComponent(GraduationCap), 
    color: "#4255BD" 
  },
  { 
    id: "ff3dd34ed21f3aa9863b7aae8c58a59b1728e995", 
    name: "Família e filhos", 
    type: "expense", 
    icon: iconComponent(Baby), 
    color: "#64D877" 
  },
  { 
    id: "bf01c743370d1c16e0dd3fc11bafd5c30126272e", 
    name: "Impostos e Taxas", 
    type: "expense", 
    icon: iconComponent(Receipt), 
    color: "#F9AE9E" 
  },
  { 
    id: "972c1d6685627a123c16a0a86c2b2a68721bedc9", 
    name: "Investimentos", 
    type: "expense", 
    icon: iconComponent(PiggyBank), 
    color: "#EF84B2" 
  },
  { 
    id: "59e06c7a5aa5f86be6126ed74a8f2a9568a7f58d", 
    name: "Lazer e hobbies", 
    type: "expense", 
    icon: iconComponent(Film), 
    color: "#42924F" 
  },
  { 
    id: "6fd64a71141e790cc61953c67a019e1598f446a0", 
    name: "Mercado", 
    type: "expense", 
    icon: iconComponent(ShoppingCart), 
    color: "#F9845D" 
  },
  { 
    id: "829442e4f3271109edb5a4707030f9e19b1b3ba4", 
    name: "Outros", 
    type: "expense", 
    icon: iconComponent(ScrollText), 
    color: "#AFAFAF" 
  },
  { 
    id: "db7728cb28fb351d5baf76cc79b3a33afc36649b", 
    name: "Pets", 
    type: "expense", 
    icon: iconComponent(Dog), 
    color: "#FBA52C" 
  },
  { 
    id: "7a196aed8512ade4d9cef57d5ccfba970b4d2138", 
    name: "Presentes e doações", 
    type: "expense", 
    icon: iconComponent(Gift), 
    color: "#4255BD" 
  },
  { 
    id: "cd797ae6a26bbfef63450e4daf24bdc14737ce91", 
    name: "Roupas", 
    type: "expense", 
    icon: iconComponent(Shirt), 
    color: "#BA3709" 
  },
  { 
    id: "143aaaf5dc425e85724d48d7b63a79d0c65a8b35", 
    name: "Saúde", 
    type: "expense", 
    icon: iconComponent(HeartPulse), 
    color: "#5096DC" 
  },
  { 
    id: "883634e1fbbca76f5ebe51a68f8ad476da3962b5", 
    name: "Trabalho", 
    type: "expense", 
    icon: iconComponent(Briefcase), 
    color: "#4255BD" 
  },
  { 
    id: "25d60aaa69e8da7f19c5945689844d3f6a28d67c", 
    name: "Transporte", 
    type: "expense", 
    icon: iconComponent(Car), 
    color: "#79A9E1" 
  },
  { 
    id: "fcd4182c5a68ae333e25dd06ace37c2522d6be2c", 
    name: "Viagem", 
    type: "expense", 
    icon: iconComponent(Plane), 
    color: "#FF6669" 
  },
];

// Categorias padrão para receitas
export const DEFAULT_INCOME_CATEGORIES: Category[] = [
  { 
    id: "income-1", 
    name: "Salário", 
    type: "income", 
    icon: iconComponent(DollarSign), 
    color: "#64D877" 
  },
  { 
    id: "income-2", 
    name: "Freelancer", 
    type: "income", 
    icon: iconComponent(Briefcase), 
    color: "#4255BD" 
  },
  { 
    id: "income-3", 
    name: "Rendimentos", 
    type: "income", 
    icon: iconComponent(PiggyBank), 
    color: "#EF84B2" 
  },
  { 
    id: "income-4", 
    name: "Bônus", 
    type: "income", 
    icon: iconComponent(DollarSign), 
    color: "#5096DC" 
  },
  { 
    id: "income-5", 
    name: "Presentes", 
    type: "income", 
    icon: iconComponent(Gift), 
    color: "#4255BD" 
  },
  { 
    id: "income-6", 
    name: "Reembolso", 
    type: "income", 
    icon: iconComponent(RefreshCw), 
    color: "#F9845D" 
  },
  { 
    id: "income-7", 
    name: "Outros", 
    type: "income", 
    icon: iconComponent(ScrollText), 
    color: "#AFAFAF" 
  },
];

// Categorias padrão para investimentos
export const DEFAULT_INVESTMENT_CATEGORIES: Category[] = [
  { 
    id: "invest-1", 
    name: "Ações", 
    type: "investment", 
    icon: iconComponent(PiggyBank), 
    color: "#EF84B2" 
  },
  { 
    id: "invest-2", 
    name: "Fundos", 
    type: "investment", 
    icon: iconComponent(Building), 
    color: "#7253C8" 
  },
  { 
    id: "invest-3", 
    name: "Tesouro Direto", 
    type: "investment", 
    icon: iconComponent(FileText), 
    color: "#4255BD" 
  },
  { 
    id: "invest-4", 
    name: "Criptomoedas", 
    type: "investment", 
    icon: iconComponent(PiggyBank), 
    color: "#FBA52C" 
  },
  { 
    id: "invest-5", 
    name: "Poupança", 
    type: "investment", 
    icon: iconComponent(PiggyBank), 
    color: "#64D877" 
  },
  { 
    id: "invest-6", 
    name: "CDB/LCI/LCA", 
    type: "investment", 
    icon: iconComponent(Building), 
    color: "#5096DC" 
  },
  { 
    id: "invest-7", 
    name: "Outros", 
    type: "investment", 
    icon: iconComponent(ScrollText), 
    color: "#AFAFAF" 
  },
];

// Categorias padrão para transferências
export const DEFAULT_TRANSFER_CATEGORIES: Category[] = [
  { 
    id: "transfer-1", 
    name: "Entre Contas", 
    type: "transfer", 
    icon: iconComponent(RefreshCw), 
    color: "#7253C8" 
  },
  { 
    id: "transfer-2", 
    name: "Pagamento de Cartão", 
    type: "transfer", 
    icon: iconComponent(CreditCard), 
    color: "#FF6669" 
  },
  { 
    id: "transfer-3", 
    name: "Para Terceiros", 
    type: "transfer", 
    icon: iconComponent(Users), 
    color: "#5096DC" 
  },
  { 
    id: "transfer-4", 
    name: "Outras Transferências", 
    type: "transfer", 
    icon: iconComponent(RefreshCw), 
    color: "#AFAFAF" 
  },
];

// Combinando todas as categorias
export const ALL_CATEGORIES: Category[] = [
  ...DEFAULT_EXPENSE_CATEGORIES,
  ...DEFAULT_INCOME_CATEGORIES,
  ...DEFAULT_INVESTMENT_CATEGORIES,
  ...DEFAULT_TRANSFER_CATEGORIES,
];

// Carteiras padrão
export const DEFAULT_WALLETS: Wallet[] = [
  { 
    id: "wallet-1", 
    name: "Carteira Principal", 
    balance: 5000, 
    type: "cash", 
    icon: iconComponent(WalletIcon), 
    color: "#5096DC" 
  },
  { 
    id: "wallet-2", 
    name: "Conta Bancária", 
    balance: 15000, 
    type: "bank", 
    icon: iconComponent(Building), 
    color: "#7253C8" 
  },
  { 
    id: "wallet-3", 
    name: "Cartão de Crédito", 
    balance: 0, 
    type: "credit_card", 
    icon: iconComponent(CreditCard), 
    color: "#FF6669" 
  },
  { 
    id: "wallet-4", 
    name: "Poupança", 
    balance: 25000, 
    type: "savings", 
    icon: iconComponent(PiggyBank), 
    color: "#64D877" 
  },
];

// Métodos de pagamento padrão
export const DEFAULT_PAYMENT_METHODS: TransactionPaymentMethod[] = [
  { id: "credit_card", name: "Cartão de Crédito", icon: iconComponent(CreditCard) },
  { id: "debit_card", name: "Cartão de Débito", icon: iconComponent(CreditCard) },
  { id: "cash", name: "Dinheiro", icon: iconComponent(DollarSign) },
  { id: "pix", name: "PIX", icon: iconComponent(RefreshCw) },
  { id: "transfer", name: "Transferência", icon: iconComponent(RefreshCw) },
  { id: "boleto", name: "Boleto", icon: iconComponent(FileText) },
]; 