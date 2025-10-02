const { BetelTecnologiaService } = require('./app/_services/betelTecnologia.ts');

async function testarDesconto() {
  try {
    console.log('Testando cálculo de desconto...');
    
    const dataInicio = new Date('2025-08-01');
    const dataFim = new Date('2025-08-31');
    
    const resultado = await BetelTecnologiaService.buscarVendas({
      dataInicio,
      dataFim
    });
    
    console.log(`Total de vendas: ${resultado.totalVendas}`);
    console.log(`Total valor: R$ ${resultado.totalValor.toFixed(2)}`);
    
    if (resultado.vendas && resultado.vendas.length > 0) {
      // Verificar primeira venda
      const primeiraVenda = resultado.vendas[0];
      console.log('\n=== PRIMEIRA VENDA ===');
      console.log(`ID: ${primeiraVenda.id}`);
      console.log(`Valor total: R$ ${primeiraVenda.valor_total}`);
      console.log(`Desconto valor: R$ ${primeiraVenda.desconto_valor}`);
      console.log(`Desconto porcentagem: ${primeiraVenda.desconto_porcentagem}%`);
      console.log(`Valor produtos: R$ ${primeiraVenda.valor_produtos}`);
      
      // Calcular desconto esperado
      const valorProdutos = parseFloat(primeiraVenda.valor_produtos || '0');
      const valorTotal = parseFloat(primeiraVenda.valor_total || '0');
      const descontoEsperado = valorProdutos - valorTotal;
      
      console.log(`\nDesconto esperado: R$ ${descontoEsperado.toFixed(2)}`);
      console.log(`Desconto calculado: R$ ${primeiraVenda.desconto_valor}`);
      
      // Calcular totais
      let totalDescontos = 0;
      resultado.vendas.forEach(venda => {
        totalDescontos += parseFloat(venda.desconto_valor || '0');
      });
      
      console.log(`\nTotal de descontos: R$ ${totalDescontos.toFixed(2)}`);
    }
    
  } catch (error) {
    console.error('Erro no teste:', error);
  }
}

testarDesconto();
