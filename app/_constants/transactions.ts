import { 
  TransactionCategory as TransactionCategoryType, 
  TRANSACTION_CATEGORIES
} from '../_lib/types';
import { PaymentMethods, PAYMENT_METHOD_LABELS } from './payment-methods';
import { TransactionTypes, TRANSACTION_TYPE_LABELS } from './transaction-types';

export const TRANSACTION_PAYMENT_METHOD_ICONS = {
  [PaymentMethods.CREDIT_CARD]: "credit-card.svg",
  [PaymentMethods.DEBIT_CARD]: "debit-card.svg",
  [PaymentMethods.BANK_TRANSFER]: "bank-transfer.svg",
  [PaymentMethods.BOLETO]: "bank-slip.svg",
  [PaymentMethods.CASH]: "money.svg",
  [PaymentMethods.PIX]: "pix.svg",
  [PaymentMethods.OTHER]: "other.svg",
};

export const TRANSACTION_CATEGORY_LABELS: Record<string, string> = {
  "VENDAS_BALCAO": "Vendas no Balcão",
  "VENDAS_PRODUTOS": "Vendas de Produtos",
  "DELIVERY": "Delivery",
  "REMUNERACAO_FUNCIONARIOS": "Remuneração de Funcionários",
  "ENCARGOS_FGTS": "Encargos - FGTS",
  "ENCARGOS_INSS": "Encargos - INSS",
  "ENCARGOS_ALIMENTACAO": "Encargos - Vale Alimentação",
  "ENCARGOS_VALE_TRANSPORTE": "Encargos - Vale Transporte",
  "ENCARGOS_13_SALARIO": "Encargos - 13º Salário",
  "ENCARGOS_14_SALARIO": "Encargos - 14º Salário",
  "ENCARGOS_RESCISOES": "Encargos - Rescisões",
  "ENCARGOS_EXAMES": "Encargos - Exames",
  "REPOSICAO_ESTOQUE": "Reposição de Estoque",
  "MANUTENCAO_EQUIPAMENTOS": "Manutenção de Equipamentos",
  "MATERIAL_REFORMA": "Material de Reforma",
  "MATERIAL_ESCRITORIO": "Material de Escritório",
  "AQUISICAO_EQUIPAMENTOS": "Aquisição de Equipamentos",
  "MARKETING_PUBLICIDADE": "Marketing e Publicidade",
  "TELEFONIA_INTERNET": "Telefonia e Internet",
  "ENERGIA_AGUA": "Energia e Água",
  "TRANSPORTADORA": "Transportadora",
  "CONTABILIDADE": "Contabilidade",
  "TROCO": "Troco",
  "COMPRAS": "Compras",
  "FERIAS": "Férias",
  "OTHER": "Outros"
};

export const TRANSACTION_PAYMENT_METHOD_LABELS = PAYMENT_METHOD_LABELS;

export const TRANSACTION_TYPE_OPTIONS = [
  {
    value: TransactionTypes.EXPENSE,
    label: TRANSACTION_TYPE_LABELS.EXPENSE,
  },
  {
    value: TransactionTypes.DEPOSIT,
    label: TRANSACTION_TYPE_LABELS.DEPOSIT,
  },
  {
    value: TransactionTypes.INVESTMENT,
    label: TRANSACTION_TYPE_LABELS.INVESTMENT,
  },
];

export const TRANSACTION_PAYMENT_METHOD_OPTIONS = [
  {
    value: PaymentMethods.BANK_TRANSFER,
    label: TRANSACTION_PAYMENT_METHOD_LABELS.BANK_TRANSFER,
  },
  {
    value: PaymentMethods.BOLETO,
    label: TRANSACTION_PAYMENT_METHOD_LABELS.BOLETO,
  },
  {
    value: PaymentMethods.CASH,
    label: TRANSACTION_PAYMENT_METHOD_LABELS.CASH,
  },
  {
    value: PaymentMethods.CREDIT_CARD,
    label: TRANSACTION_PAYMENT_METHOD_LABELS.CREDIT_CARD,
  },
  {
    value: PaymentMethods.DEBIT_CARD,
    label: TRANSACTION_PAYMENT_METHOD_LABELS.DEBIT_CARD,
  },
  {
    value: PaymentMethods.OTHER,
    label: TRANSACTION_PAYMENT_METHOD_LABELS.OTHER,
  },
  {
    value: PaymentMethods.PIX,
    label: TRANSACTION_PAYMENT_METHOD_LABELS.PIX,
  },
];

export const TRANSACTION_CATEGORY_OPTIONS = [
  {
    value: "VENDAS_BALCAO",
    label: TRANSACTION_CATEGORY_LABELS["VENDAS_BALCAO"],
  },
  {
    value: "VENDAS_PRODUTOS",
    label: TRANSACTION_CATEGORY_LABELS["VENDAS_PRODUTOS"],
  },
  {
    value: "DELIVERY",
    label: TRANSACTION_CATEGORY_LABELS["DELIVERY"],
  },
  {
    value: "REMUNERACAO_FUNCIONARIOS",
    label: TRANSACTION_CATEGORY_LABELS["REMUNERACAO_FUNCIONARIOS"],
  },
  {
    value: "ENCARGOS_FGTS",
    label: TRANSACTION_CATEGORY_LABELS["ENCARGOS_FGTS"],
  },
  {
    value: "ENCARGOS_INSS",
    label: TRANSACTION_CATEGORY_LABELS["ENCARGOS_INSS"],
  },
  {
    value: "ENCARGOS_ALIMENTACAO",
    label: TRANSACTION_CATEGORY_LABELS["ENCARGOS_ALIMENTACAO"],
  },
  {
    value: "ENCARGOS_VALE_TRANSPORTE",
    label: TRANSACTION_CATEGORY_LABELS["ENCARGOS_VALE_TRANSPORTE"],
  },
  {
    value: "ENCARGOS_13_SALARIO",
    label: TRANSACTION_CATEGORY_LABELS["ENCARGOS_13_SALARIO"],
  },
  {
    value: "ENCARGOS_14_SALARIO",
    label: TRANSACTION_CATEGORY_LABELS["ENCARGOS_14_SALARIO"],
  },
  {
    value: "ENCARGOS_RESCISOES",
    label: TRANSACTION_CATEGORY_LABELS["ENCARGOS_RESCISOES"],
  },
  {
    value: "ENCARGOS_EXAMES",
    label: TRANSACTION_CATEGORY_LABELS["ENCARGOS_EXAMES"],
  },
  {
    value: "REPOSICAO_ESTOQUE",
    label: TRANSACTION_CATEGORY_LABELS["REPOSICAO_ESTOQUE"],
  },
  {
    value: "MANUTENCAO_EQUIPAMENTOS",
    label: TRANSACTION_CATEGORY_LABELS["MANUTENCAO_EQUIPAMENTOS"],
  },
  {
    value: "MATERIAL_REFORMA",
    label: TRANSACTION_CATEGORY_LABELS["MATERIAL_REFORMA"],
  },
  {
    value: "MATERIAL_ESCRITORIO",
    label: TRANSACTION_CATEGORY_LABELS["MATERIAL_ESCRITORIO"],
  },
  {
    value: "AQUISICAO_EQUIPAMENTOS",
    label: TRANSACTION_CATEGORY_LABELS["AQUISICAO_EQUIPAMENTOS"],
  },
  {
    value: "MARKETING_PUBLICIDADE",
    label: TRANSACTION_CATEGORY_LABELS["MARKETING_PUBLICIDADE"],
  },
  {
    value: "TELEFONIA_INTERNET",
    label: TRANSACTION_CATEGORY_LABELS["TELEFONIA_INTERNET"],
  },
  {
    value: "ENERGIA_AGUA",
    label: TRANSACTION_CATEGORY_LABELS["ENERGIA_AGUA"],
  },
  {
    value: "TRANSPORTADORA",
    label: TRANSACTION_CATEGORY_LABELS["TRANSPORTADORA"],
  },
  {
    value: "CONTABILIDADE",
    label: TRANSACTION_CATEGORY_LABELS["CONTABILIDADE"],
  },
  {
    value: "TROCO",
    label: TRANSACTION_CATEGORY_LABELS["TROCO"],
  },
  {
    value: "COMPRAS",
    label: TRANSACTION_CATEGORY_LABELS["COMPRAS"],
  },
  {
    value: "FERIAS",
    label: TRANSACTION_CATEGORY_LABELS["FERIAS"],
  }
];
