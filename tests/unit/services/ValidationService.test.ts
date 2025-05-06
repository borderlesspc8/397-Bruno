import { ValidationService } from '@/app/_services/ValidationService';
import { TransactionType, TransactionPaymentMethod } from '@/app/_types/enums';

// Definindo manualmente os enums para os testes em vez de importar do Prisma
const MockTransactionType = {
  EXPENSE: 'EXPENSE',
  INCOME: 'INCOME',
  TRANSFER: 'TRANSFER'
};

const MockTransactionPaymentMethod = {
  CASH: 'CASH',
  CREDIT_CARD: 'CREDIT_CARD',
  DEBIT_CARD: 'DEBIT_CARD',
  BANK_TRANSFER: 'BANK_TRANSFER',
  PIX: 'PIX'
};

// Mock do módulo @prisma/client que exporta os enums necessários
jest.mock('@prisma/client', () => ({
  TransactionType: MockTransactionType,
  TransactionPaymentMethod: MockTransactionPaymentMethod
}));

// Importando o serviço real (e não o mockado) para testar
jest.unmock('@/app/_services/validation-service');

// Removendo o mock antigo que substituía completamente o ValidationService
// jest.mock('@/app/_services/validation-service', () => { ... });

describe('ValidationService', () => {
  describe('validateAmount', () => {
    it('deve retornar erro quando o valor é nulo', () => {
      const result = ValidationService.validateAmount(null as any);
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Valor não fornecido');
    });

    it('deve retornar erro quando o valor é indefinido', () => {
      const result = ValidationService.validateAmount(undefined as any);
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Valor não fornecido');
    });

    it('deve retornar erro quando o valor não é um número válido', () => {
      const result = ValidationService.validateAmount('abc');
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Valor não é um número válido');
    });

    it('deve retornar erro quando o valor é menor ou igual a zero', () => {
      const result = ValidationService.validateAmount(0);
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Valor deve ser maior que zero');
    });

    it('deve validar corretamente um valor numérico', () => {
      const result = ValidationService.validateAmount(100);
      expect(result.isValid).toBe(true);
      expect(result.value).toBe(100);
    });

    it('deve validar corretamente um valor em string com vírgula', () => {
      const result = ValidationService.validateAmount('1.234,56');
      expect(result.isValid).toBe(true);
      expect(result.value).toBe(1234.56);
    });
  });

  describe('validateDate', () => {
    it('deve retornar a data atual quando o valor é nulo', () => {
      const result = ValidationService.validateDate(null);
      expect(result.isValid).toBe(true);
      expect(result.value).toBeInstanceOf(Date);
    });

    it('deve retornar erro quando a data é inválida', () => {
      const result = ValidationService.validateDate('data inválida');
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Data inválida');
    });

    it('deve validar corretamente uma data válida', () => {
      const date = new Date();
      const result = ValidationService.validateDate(date);
      expect(result.isValid).toBe(true);
      expect(result.value).toBe(date);
    });
  });

  describe('validateTransactionType', () => {
    it('deve retornar erro quando o tipo é nulo', () => {
      const result = ValidationService.validateTransactionType('');
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Tipo de transação não fornecido');
    });

    it('deve retornar erro quando o tipo é inválido', () => {
      const result = ValidationService.validateTransactionType('INVALID_TYPE');
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Tipo de transação inválido');
    });

    it('deve validar corretamente um tipo válido', () => {
      const result = ValidationService.validateTransactionType(TransactionType.EXPENSE);
      expect(result.isValid).toBe(true);
      expect(result.value).toBe(TransactionType.EXPENSE);
    });
  });

  describe('validatePaymentMethod', () => {
    it('deve retornar erro quando o método é nulo', () => {
      const result = ValidationService.validatePaymentMethod('');
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Método de pagamento não fornecido');
    });

    it('deve retornar erro quando o método é inválido', () => {
      const result = ValidationService.validatePaymentMethod('INVALID_METHOD');
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Método de pagamento inválido');
    });

    it('deve validar corretamente um método válido', () => {
      const result = ValidationService.validatePaymentMethod(TransactionPaymentMethod.PIX);
      expect(result.isValid).toBe(true);
      expect(result.value).toBe(TransactionPaymentMethod.PIX);
    });
  });

  describe('validateCPF', () => {
    it('deve retornar falso para CPF nulo', () => {
      expect(ValidationService.validateCPF('')).toBe(false);
    });

    it('deve retornar falso para CPF com formato inválido', () => {
      expect(ValidationService.validateCPF('123')).toBe(false);
    });

    it('deve retornar falso para CPF com todos os dígitos iguais', () => {
      expect(ValidationService.validateCPF('111.111.111-11')).toBe(false);
    });

    it('deve validar corretamente um CPF válido', () => {
      expect(ValidationService.validateCPF('529.982.247-25')).toBe(true);
    });
  });

  describe('validateCNPJ', () => {
    it('deve retornar falso para CNPJ nulo', () => {
      expect(ValidationService.validateCNPJ('')).toBe(false);
    });

    it('deve retornar falso para CNPJ com formato inválido', () => {
      expect(ValidationService.validateCNPJ('123')).toBe(false);
    });

    it('deve retornar falso para CNPJ com todos os dígitos iguais', () => {
      expect(ValidationService.validateCNPJ('11.111.111/1111-11')).toBe(false);
    });

    it('deve validar corretamente um CNPJ válido', () => {
      expect(ValidationService.validateCNPJ('11.444.777/0001-61')).toBe(true);
    });
  });

  describe('validateTransactionAmount', () => {
    it('deve retornar falso para valor inválido', () => {
      expect(ValidationService.validateTransactionAmount('abc', TransactionType.EXPENSE)).toBe(false);
    });

    it('deve retornar falso para valor negativo em despesa', () => {
      expect(ValidationService.validateTransactionAmount('-100', TransactionType.EXPENSE)).toBe(false);
    });

    it('deve retornar falso para valor negativo em receita', () => {
      expect(ValidationService.validateTransactionAmount('-100', TransactionType.INCOME)).toBe(false);
    });

    it('deve validar corretamente um valor positivo', () => {
      expect(ValidationService.validateTransactionAmount('100', TransactionType.EXPENSE)).toBe(true);
    });
  });

  describe('formatToCurrency', () => {
    it('deve formatar corretamente um valor numérico', () => {
      const formatted = ValidationService.formatToCurrency(1234.56);
      expect(formatted.replace(/\s/g, ' ')).toBe('R$ 1.234,56');
    });

    it('deve formatar corretamente um valor zero', () => {
      const formatted = ValidationService.formatToCurrency(0);
      expect(formatted.replace(/\s/g, ' ')).toBe('R$ 0,00');
    });
  });

  describe('formatToNumber', () => {
    it('deve converter corretamente uma string com vírgula', () => {
      expect(ValidationService.formatToNumber('1.234,56')).toBe(1234.56);
    });

    it('deve converter corretamente uma string com ponto', () => {
      expect(ValidationService.formatToNumber('1234.56')).toBe(123456);
    });
  });
}); 