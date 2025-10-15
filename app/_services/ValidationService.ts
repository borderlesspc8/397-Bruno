import { TransactionType, TransactionPaymentMethod } from '@/app/_types/enums';

interface ValidationResult<T> {
  isValid: boolean;
  value?: T;
  message?: string;
}

export class ValidationService {
  static validateAmount(amount: number | string): ValidationResult<number> {
    if (amount === null || amount === undefined) {
      return { isValid: false, message: 'Valor não fornecido' };
    }

    let numericValue: number;
    if (typeof amount === 'string') {
      // Remove caracteres não numéricos e converte vírgula para ponto
      const cleanValue = amount.replace(/[^\d,-]/g, '').replace(',', '.');
      numericValue = parseFloat(cleanValue);
    } else {
      numericValue = amount;
    }

    if (isNaN(numericValue)) {
      return { isValid: false, message: 'Valor não é um número válido' };
    }

    if (numericValue <= 0) {
      return { isValid: false, message: 'Valor deve ser maior que zero' };
    }

    return { isValid: true, value: numericValue };
  }

  static validateDate(date: Date | string | null): ValidationResult<Date> {
    if (date === null || date === undefined) {
      return { isValid: true, value: new Date() };
    }

    const dateObj = date instanceof Date ? date : new Date(date);
    
    if (isNaN(dateObj.getTime())) {
      return { isValid: false, message: 'Data inválida' };
    }

    return { isValid: true, value: dateObj };
  }

  static validateTransactionType(type: string): ValidationResult<string> {
    if (!type) {
      return { isValid: false, message: 'Tipo de transação não fornecido' };
    }

    if (!Object.values(TransactionType).includes(type as TransactionType)) {
      return { isValid: false, message: 'Tipo de transação inválido' };
    }

    return { isValid: true, value: type };
  }

  static validatePaymentMethod(method: string): ValidationResult<string> {
    if (!method) {
      return { isValid: false, message: 'Método de pagamento não fornecido' };
    }

    if (!Object.values(TransactionPaymentMethod).includes(method as TransactionPaymentMethod)) {
      return { isValid: false, message: 'Método de pagamento inválido' };
    }

    return { isValid: true, value: method };
  }

  static validateCPF(cpf: string): boolean {
    if (!cpf) return false;
    
    // Remove caracteres não numéricos
    cpf = cpf.replace(/[^\d]/g, '');
    
    // Verifica se tem 11 dígitos
    if (cpf.length !== 11) return false;
    
    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cpf)) return false;
    
    // Validação do primeiro dígito verificador
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let digit = 11 - (sum % 11);
    if (digit > 9) digit = 0;
    if (digit !== parseInt(cpf.charAt(9))) return false;
    
    // Validação do segundo dígito verificador
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cpf.charAt(i)) * (11 - i);
    }
    digit = 11 - (sum % 11);
    if (digit > 9) digit = 0;
    if (digit !== parseInt(cpf.charAt(10))) return false;
    
    return true;
  }

  static validateCNPJ(cnpj: string): boolean {
    if (!cnpj) return false;
    
    // Remove caracteres não numéricos
    cnpj = cnpj.replace(/[^\d]/g, '');
    
    // Verifica se tem 14 dígitos
    if (cnpj.length !== 14) return false;
    
    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{13}$/.test(cnpj)) return false;
    
    // Validação do primeiro dígito verificador
    let sum = 0;
    let weight = 5;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(cnpj.charAt(i)) * weight;
      weight = weight === 2 ? 9 : weight - 1;
    }
    let digit = 11 - (sum % 11);
    if (digit > 9) digit = 0;
    if (digit !== parseInt(cnpj.charAt(12))) return false;
    
    // Validação do segundo dígito verificador
    sum = 0;
    weight = 6;
    for (let i = 0; i < 13; i++) {
      sum += parseInt(cnpj.charAt(i)) * weight;
      weight = weight === 2 ? 9 : weight - 1;
    }
    digit = 11 - (sum % 11);
    if (digit > 9) digit = 0;
    if (digit !== parseInt(cnpj.charAt(13))) return false;
    
    return true;
  }

  static validateTransactionAmount(amount: string, type: TransactionType): boolean {
    const result = this.validateAmount(amount);
    if (!result.isValid) return false;
    
    const numericValue = result.value!;
    
    if (type === TransactionType.EXPENSE && numericValue <= 0) {
      return false;
    }
    
    if (type === TransactionType.INCOME && numericValue <= 0) {
      return false;
    }
    
    return true;
  }

  static formatToCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  static formatToNumber(value: string): number {
    const cleanValue = value.replace(/[^\d,-]/g, '').replace(',', '.');
    return parseFloat(cleanValue);
  }
} 
