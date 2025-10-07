const { BetelTecnologiaService } = require('./app/_services/betelTecnologia.ts');

async function verificarFormasPagamento() {
  try {
    const hoje = new Date();
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    
    console.log('Buscando vendas do mês atual...');
    const vendasResult = await BetelTecnologiaService.buscarVendas({
      dataInicio: inicioMes,
      dataFim: hoje
    });
    
    console.log(`Total de vendas encontradas: ${vendasResult.vendas.length}`);
    
    // Filtrar vendas válidas
    const STATUS_VALIDOS = ['Concretizada', 'Em andamento'];
    const vendasValidas = vendasResult.vendas.filter(venda => 
      STATUS_VALIDOS.includes(venda.nome_situacao || '')
    );
    
    console.log(`Vendas válidas: ${vendasValidas.length}`);
    
    // Coletar formas de pagamento únicas
    const formasPagamento = new Set();
    
    vendasValidas.forEach(venda => {
      if (venda.forma_pagamento) {
        formasPagamento.add(venda.forma_pagamento);
      }
      if (venda.pagamentos && Array.isArray(venda.pagamentos)) {
        venda.pagamentos.forEach(pag => {
          if (pag.pagamento?.nome_forma_pagamento) {
            formasPagamento.add(pag.pagamento.nome_forma_pagamento);
          }
        });
      }
    });
    
    console.log('\nFormas de pagamento encontradas:');
    Array.from(formasPagamento).sort().forEach(forma => {
      console.log(`- ${forma}`);
    });
    
    // Verificar quantas vendas cada forma tem
    console.log('\nDetalhamento por forma de pagamento:');
    const contagemFormas = {};
    
    vendasValidas.forEach(venda => {
      let formaPrincipal = venda.forma_pagamento || 'Não informado';
      
      if (venda.pagamentos && Array.isArray(venda.pagamentos) && venda.pagamentos.length > 0) {
        const primeiraForma = venda.pagamentos[0]?.pagamento?.nome_forma_pagamento;
        if (primeiraForma) {
          formaPrincipal = primeiraForma;
        }
      }
      
      if (!contagemFormas[formaPrincipal]) {
        contagemFormas[formaPrincipal] = { count: 0, valor: 0 };
      }
      contagemFormas[formaPrincipal].count++;
      contagemFormas[formaPrincipal].valor += parseFloat(venda.valor_total || '0');
    });
    
    Object.entries(contagemFormas)
      .sort((a, b) => b[1].valor - a[1].valor)
      .forEach(([forma, dados]) => {
        console.log(`- ${forma}: ${dados.count} vendas, R$ ${dados.valor.toFixed(2)}`);
      });
    
  } catch (error) {
    console.error('Erro:', error);
  }
}

verificarFormasPagamento();
