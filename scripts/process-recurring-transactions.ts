import { RecurringTransactionService } from "../app/_services/recurring-transaction-service";

async function processRecurringTransactions() {
  try {
    console.log("Iniciando processamento de transações recorrentes...");
    
    const processedCount = await RecurringTransactionService.processRecurringTransactions();
    
    console.log(`Processamento concluído. ${processedCount} transações geradas.`);
    process.exit(0);
  } catch (error) {
    console.error("Erro ao processar transações recorrentes:", error);
    process.exit(1);
  }
}

processRecurringTransactions(); 