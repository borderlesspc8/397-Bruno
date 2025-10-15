import { TransactionType, TransactionPaymentMethod } from "@prisma/client";

export class ValidationService {
  /**
   * Valida um valor monetário
   */
  static validateAmount(amount: any): { 
    isValid: boolean; 
    value?: number; 
    message?: string 
  } {
    if (amount === undefined || amount === null) {
      return { isValid: false, message: "Valor não fornecido" };
    }

    let numericValue: number;
    if (typeof amount === "string") {
     
      const normalizedValue = amount
        .replace(/\./g, "")  // Remover pontos de milhares
        .replace(",", ".");  // Substituir vírgula decimal por ponto
      
      numericValue = parseFloat(normalizedValue);
    } else {
      numericValue = Number(amount);
    }

    if (isNaN(numericValue)) {
      return { isValid: false, message: "Valor não é um número válido" };
    }

    if (numericValue <= 0) {
      return { isValid: false, message: "Valor deve ser maior que zero" };
    }

    // Arredondar para 2 casas decimais para evitar erros de precisão
    const roundedValue = Math.round(numericValue * 100) / 100;
    return { isValid: true, value: roundedValue };
  }

  /**
   * Valida uma data
   */
  static validateDate(date: any): { 
    isValid: boolean; 
    value?: Date; 
    message?: string 
  } {
    if (!date) {
      return { isValid: true, value: new Date() }; // Usa data atual se não fornecida
    }

    let parsedDate: Date;
    if (typeof date === "string") {
      parsedDate = new Date(date);
    } else if (date instanceof Date) {
      parsedDate = date;
    } else {
      return { isValid: false, message: "Formato de data inválido" };
    }

    if (isNaN(parsedDate.getTime())) {
      return { isValid: false, message: "Data inválida" };
    }

    return { isValid: true, value: parsedDate };
  }

  /**
   * Valida um tipo de transação
   */
  static validateTransactionType(type: any): { 
    isValid: boolean; 
    value?: TransactionType; 
    message?: string 
  } {
    if (!type) {
      return { isValid: false, message: "Tipo de transação não fornecido" };
    }

    if (!TransactionType) {
      return { isValid: false, message: "Enum TransactionType não disponível" };
    }

    const validTypes = Object.values(TransactionType);
    
    if (!validTypes.includes(type as TransactionType)) {
      return { 
        isValid: false, 
        message: `Tipo inválido. Valores permitidos: ${validTypes.join(", ")}` 
      };
    }

    return { isValid: true, value: type as TransactionType };
  }

  /**
   * Valida um método de pagamento
   */
  static validatePaymentMethod(method: any): { 
    isValid: boolean; 
    value?: TransactionPaymentMethod; 
    message?: string 
  } {
    if (!method) {
      // Método de pagamento é opcional, retorna undefined se não fornecido
      return { isValid: true };
    }

    if (!TransactionPaymentMethod) {
      return { isValid: false, message: "Enum TransactionPaymentMethod não disponível" };
    }

    const validMethods = Object.values(TransactionPaymentMethod);
    
    if (!validMethods.includes(method as TransactionPaymentMethod)) {
      return { 
        isValid: false, 
        message: `Método de pagamento inválido. Valores permitidos: ${validMethods.join(", ")}` 
      };
    }

    return { isValid: true, value: method as TransactionPaymentMethod };
  }

  /**
   * Valida um array de tags
   */
  static validateTags(tags: any): { 
    isValid: boolean; 
    value?: string[]; 
    message?: string 
  } {
    if (!tags) {
      return { isValid: true, value: [] };
    }

    // Se uma string foi fornecida, converte para array
    if (typeof tags === "string") {
      tags = tags.split(",").map((tag: string) => tag.trim());
    }

    // Verifica se é um array
    if (!Array.isArray(tags)) {
      return { isValid: false, message: "Tags deve ser um array de strings" };
    }

    // Filtra tags válidas (strings não vazias)
    const validTags = tags
      .map((tag: any) => String(tag).trim())
      .filter((tag: string) => tag.length > 0);

    return { isValid: true, value: validTags };
  }

  /**
   * Valida uma transação completa
   */
  static validateTransaction(data: Record<string, any>): {
    isValid: boolean;
    validatedData?: Record<string, any>;
    errors?: Record<string, string>;
  } {
    const errors: Record<string, string> = {};
    const validatedData: Record<string, any> = {};

    // Validar campos obrigatórios
    if (!data.walletId) {
      errors.walletId = "ID da carteira é obrigatório";
    } else {
      validatedData.walletId = data.walletId;
    }

    // Validar valor
    const amountValidation = this.validateAmount(data.amount);
    if (!amountValidation.isValid) {
      errors.amount = amountValidation.message || "Valor inválido";
    } else {
      validatedData.amount = amountValidation.value;
    }

    // Validar tipo
    const typeValidation = this.validateTransactionType(data.type);
    if (!typeValidation.isValid) {
      errors.type = typeValidation.message || "Tipo inválido";
    } else {
      validatedData.type = typeValidation.value;
    }

    // Validar data
    const dateValidation = this.validateDate(data.date);
    if (!dateValidation.isValid) {
      errors.date = dateValidation.message || "Data inválida";
    } else {
      validatedData.date = dateValidation.value;
    }

    // Validar método de pagamento (opcional)
    if (data.paymentMethod) {
      const methodValidation = this.validatePaymentMethod(data.paymentMethod);
      if (!methodValidation.isValid) {
        errors.paymentMethod = methodValidation.message || "Método de pagamento inválido";
      } else if (methodValidation.value) {
        validatedData.paymentMethod = methodValidation.value;
      }
    }

    // Validar tags (opcional)
    if (data.tags !== undefined) {
      const tagsValidation = this.validateTags(data.tags);
      if (!tagsValidation.isValid) {
        errors.tags = tagsValidation.message || "Tags inválidas";
      } else {
        validatedData.tags = tagsValidation.value;
      }
    }

    // Copiar outros campos
    validatedData.description = data.description || "";
    validatedData.category = data.category || "Outros";
    validatedData.isReconciled = Boolean(data.isReconciled);
    validatedData.metadata = data.metadata || undefined;

    return {
      isValid: Object.keys(errors).length === 0,
      validatedData,
      errors: Object.keys(errors).length > 0 ? errors : undefined
    };
  }

  /**
   * Formata um valor numérico para moeda (R$)
   */
  static formatToCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  /**
   * Converte uma string formatada em moeda para número
   */
  static formatToNumber(value: string): number {
    // Remove todos os caracteres não numéricos (exceto ponto e vírgula)
    const cleanString = value.replace(/[^0-9.,]/g, '');
    
    // Substitui vírgula por ponto para cálculos
    const normalized = cleanString
      .replace(/\./g, '') // Remove pontos (separadores de milhar)
      .replace(',', '.'); // Substitui vírgula por ponto (decimal)
    
    // Converte para número
    return parseFloat(normalized || '0');
  }
} 
