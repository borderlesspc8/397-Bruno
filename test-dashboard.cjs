async function testarDashboard() {
  try {
    console.log('Testando API da dashboard para agosto/2025...');
    
    const response = await fetch('http://localhost:3000/api/dashboard/vendas?dataInicio=2025-08-01&dataFim=2025-08-31&forceUpdate=true');
    const data = await response.json();
    
    console.log('\n=== DADOS DA API ===');
    console.log(`Total de vendas: ${data.totalVendas}`);
    console.log(`Total valor: R$ ${data.totalValor.toFixed(2)}`);
    console.log(`Vendas no array: ${data.vendas ? data.vendas.length : 0}`);
    
    if (data.vendas && data.vendas.length > 0) {
      // Calcular totais como a dashboard faz
      let custoTotal = 0;
      let descontosTotal = 0;
      let fretesTotal = 0;
      
      data.vendas.forEach(venda => {
        custoTotal += parseFloat(venda.valor_custo || '0');
        descontosTotal += parseFloat(venda.desconto_valor || '0');
        fretesTotal += parseFloat(venda.valor_frete || '0');
      });
      
      const lucroTotal = data.totalValor - custoTotal - descontosTotal + fretesTotal;
      const margemLucro = data.totalValor > 0 ? (lucroTotal / data.totalValor) * 100 : 0;
      
      console.log('\n=== CÁLCULOS DA DASHBOARD ===');
      console.log(`Custo total: R$ ${custoTotal.toFixed(2)}`);
      console.log(`Descontos: R$ ${descontosTotal.toFixed(2)}`);
      console.log(`Fretes: R$ ${fretesTotal.toFixed(2)}`);
      console.log(`Lucro: R$ ${lucroTotal.toFixed(2)}`);
      console.log(`Margem: ${margemLucro.toFixed(2)}%`);
      
      console.log('\n=== VALORES ESPERADOS ===');
      console.log(`Valor total: R$ 704.093,15`);
      console.log(`Custos: R$ 436.029,26`);
      console.log(`Descontos: R$ 67.287,60`);
      console.log(`Fretes: R$ 296,20`);
      console.log(`Lucro: R$ 268.063,89 (61,48%)`);
      
      console.log('\n=== DASHBOARD ATUAL ===');
      console.log(`Valor total: R$ 254.195,36`);
      console.log(`Margem: 36.1%`);
      console.log(`Custo total: R$ 435.629,26`);
      console.log(`Descontos: R$ 14.564,73`);
      
      // Mostrar algumas vendas para análise
      console.log('\n=== PRIMEIRAS 3 VENDAS ===');
      data.vendas.slice(0, 3).forEach((venda, index) => {
        console.log(`${index + 1}. ID: ${venda.id}, Valor: R$ ${venda.valor_total}, Desconto: R$ ${venda.desconto_valor || '0'}, Frete: R$ ${venda.valor_frete || '0'}, Custo: R$ ${venda.valor_custo || '0'}`);
      });
    }
    
  } catch (error) {
    console.error('Erro no teste:', error);
  }
}

testarDashboard();
