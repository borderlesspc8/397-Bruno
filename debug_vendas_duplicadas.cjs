const fs = require('fs');

// Ler o arquivo JSON
const vendasData = JSON.parse(fs.readFileSync('vendas_agosto_2025.json', 'utf8'));

console.log('=== DEBUG VENDAS DUPLICADAS ===\n');

// Verificar se há vendas duplicadas por ID
const vendaIds = vendasData.data.map(venda => venda.id);
const vendaIdsUnicos = [...new Set(vendaIds)];

console.log(`Total de vendas: ${vendaIds.length}`);
console.log(`Vendas únicas: ${vendaIdsUnicos.length}`);
console.log(`Há duplicação: ${vendaIds.length !== vendaIdsUnicos.length}`);

if (vendaIds.length !== vendaIdsUnicos.length) {
  console.log('\n=== VENDAS DUPLICADAS ===');
  const vendaCounts = {};
  vendaIds.forEach(id => {
    vendaCounts[id] = (vendaCounts[id] || 0) + 1;
  });
  
  Object.entries(vendaCounts).forEach(([vendaId, count]) => {
    if (count > 1) {
      console.log(`Venda ${vendaId}: ${count} ocorrências`);
    }
  });
}

// Verificar especificamente as vendas com CROSS SMITH
console.log('\n=== VENDAS COM CROSS SMITH ===');
const crossSmithVendas = [];

vendasData.data.forEach((venda, index) => {
  if (venda && venda.produtos && Array.isArray(venda.produtos)) {
    venda.produtos.forEach((produtoWrapper, itemIndex) => {
      const item = produtoWrapper.produto || produtoWrapper;
      
      if (item.nome_produto && item.nome_produto.toUpperCase().includes('CROSS SMITH')) {
        crossSmithVendas.push({
          vendaId: venda.id,
          vendaData: venda.data,
          cliente: venda.nome_cliente,
          produto: item.nome_produto,
          quantidade: parseFloat(item.quantidade) || 0,
          valor: parseFloat(item.valor_total) || 0
        });
      }
    });
  }
});

console.log(`Total de vendas com CROSS SMITH: ${crossSmithVendas.length}`);

// Verificar se há duplicação nas vendas com CROSS SMITH
const crossSmithVendaIds = crossSmithVendas.map(v => v.vendaId);
const crossSmithVendaIdsUnicos = [...new Set(crossSmithVendaIds)];

console.log(`Vendas únicas com CROSS SMITH: ${crossSmithVendaIdsUnicos.length}`);
console.log(`Há duplicação nas vendas CROSS SMITH: ${crossSmithVendas.length !== crossSmithVendaIdsUnicos.length}`);

if (crossSmithVendas.length !== crossSmithVendaIdsUnicos.length) {
  console.log('\n=== DUPLICAÇÃO EM VENDAS CROSS SMITH ===');
  const crossSmithCounts = {};
  crossSmithVendaIds.forEach(id => {
    crossSmithCounts[id] = (crossSmithCounts[id] || 0) + 1;
  });
  
  Object.entries(crossSmithCounts).forEach(([vendaId, count]) => {
    if (count > 1) {
      console.log(`Venda ${vendaId}: ${count} ocorrências`);
    }
  });
}

// Mostrar todas as vendas com CROSS SMITH
console.log('\n=== DETALHES DAS VENDAS CROSS SMITH ===');
crossSmithVendas.forEach((venda, index) => {
  console.log(`${index + 1}. Venda ${venda.vendaId} - ${venda.vendaData}`);
  console.log(`   Cliente: ${venda.cliente}`);
  console.log(`   Produto: ${venda.produto}`);
  console.log(`   Quantidade: ${venda.quantidade}`);
  console.log(`   Valor: R$ ${venda.valor.toFixed(2)}`);
  console.log('');
});
