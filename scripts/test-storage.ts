import { storeRawStatement } from '../app/_services/bank-statement-storage.js';

async function testStorage() {
  try {
    console.log('Testando armazenamento de extrato bancário...');

    // Dados de teste
    const startDate = '2025-03-01';
    const endDate = '2025-03-10';
    const mockResponse = {
      listaLancamento: [
        {
          dataLancamento: '01032025',
          valorLancamento: 1000.00,
          textoDescricaoHistorico: 'PIX RECEBIDO',
          indicadorSinalLancamento: 'C'
        },
        {
          dataLancamento: '05032025',
          valorLancamento: 500.00,
          textoDescricaoHistorico: 'PAGAMENTO CONTA',
          indicadorSinalLancamento: 'D'
        }
      ],
      totalLancamentos: 2,
      dataConsulta: new Date().toISOString()
    };

    // Tentar armazenar
    await storeRawStatement(startDate, endDate, mockResponse);
    console.log('Teste concluído com sucesso!');
  } catch (error) {
    console.error('Erro no teste:', error);
    process.exit(1);
  }
}

// Executar teste
testStorage(); 