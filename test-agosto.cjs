const { BetelTecnologiaService } = require('./app/_services/betelTecnologia.ts');

async function testarAgosto() {
  try {
    console.log('Testando busca de vendas para agosto/2025...');
    
    const dataInicio = new Date('2025-08-01');
    const dataFim = new Date('2025-08-31');
    
    const resultado = await BetelTecnologiaService.buscarVendas({
      dataInicio,
      dataFim
    });
    
    console.log('\n=== RESULTADOS OBTIDOS ===');
    console.log(`Total de vendas: ${resultado.totalVendas}`);
    console.log(`Total valor: R$ ${resultado.totalValor.toFixed(2)}`);
    console.log(`Erro: ${resultado.erro || 'Nenhum'}`);
    
    if (resultado.vendas && resultado.vendas.length > 0) {
      // Calcular ticket médio
      const ticketMedio = resultado.totalVendas > 0 ? resultado.totalValor / resultado.totalVendas : 0;
      console.log(`Ticket médio: R$ ${ticketMedio.toFixed(2)}`);
      
      // Calcular totais de descontos e fretes
      let totalDescontos = 0;
      let totalFretes = 0;
      let totalCustos = 0;
      
      resultado.vendas.forEach(venda => {
        // Descontos
        const descontoValor = parseFloat(venda.desconto_valor || '0');
        const descontoPercentual = parseFloat(venda.desconto_porcentagem || '0');
        if (descontoValor > 0) {
          totalDescontos += descontoValor;
        } else if (descontoPercentual > 0) {
          // Calcular desconto baseado na porcentagem
          const valorProdutos = parseFloat(venda.valor_produtos || venda.valor_total || '0');
          totalDescontos += (valorProdutos * descontoPercentual) / 100;
        }
        
        // Fretes
        totalFretes += parseFloat(venda.valor_frete || '0');
        
        // Custos
        totalCustos += parseFloat(venda.valor_custo || '0');
      });
      
      const lucro = resultado.totalValor - totalCustos;
      const margemLucro = totalCustos > 0 ? (lucro / resultado.totalValor) * 100 : 0;
      
      console.log(`\n=== DETALHAMENTO ===`);
      console.log(`Descontos: R$ ${totalDescontos.toFixed(2)}`);
      console.log(`Fretes: R$ ${totalFretes.toFixed(2)}`);
      console.log(`Custos: R$ ${totalCustos.toFixed(2)}`);
      console.log(`Lucro: R$ ${lucro.toFixed(2)} (${margemLucro.toFixed(2)}%)`);
      
      console.log(`\n=== VALORES ESPERADOS ===`);
      console.log(`Ticket médio: R$ 4.000,53`);
      console.log(`Qtd. vendas: 176`);
      console.log(`Descontos: R$ 67.287,60`);
      console.log(`Fretes: R$ 296,20`);
      console.log(`Custos: R$ 436.029,26`);
      console.log(`Valor total: R$ 704.093,15`);
      console.log(`Lucro: R$ 268.063,89 (61,48%)`);
      
      console.log(`\n=== DASHBOARD ATUAL ===`);
      console.log(`Valor total: R$ 254.195,36`);
      console.log(`Margem: 36.1%`);
      console.log(`Custo total: R$ 435.629,26`);
      console.log(`Descontos: R$ 14.564,73`);
      
      // Mostrar algumas vendas para análise
      console.log(`\n=== PRIMEIRAS 5 VENDAS ===`);
      resultado.vendas.slice(0, 5).forEach((venda, index) => {
        console.log(`${index + 1}. ID: ${venda.id}, Valor: R$ ${venda.valor_total}, Desconto: R$ ${venda.desconto_valor || '0'}, Frete: R$ ${venda.valor_frete || '0'}, Custo: R$ ${venda.valor_custo || '0'}`);
      });
    }
    
  } catch (error) {
    console.error('Erro no teste:', error);
  }
}

testarAgosto();
