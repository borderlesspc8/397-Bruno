/**
 * Exporta todos os handlers para processamento de eventos do Gestão Click
 */

export { processTransactionEvent } from './transaction-handler';
export { processSaleEvent } from './sale-handler';
export { installmentHandler } from './installment-handler';
export { processCostCenterEvent, processInventoryEvent } from './misc-handlers'; 
