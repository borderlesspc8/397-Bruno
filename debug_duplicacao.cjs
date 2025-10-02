const fs = require('fs');

// Ler o arquivo JSON
const vendasData = JSON.parse(fs.readFileSync('vendas_agosto_2025.json', 'utf8'));

console.log('=== DEBUG DUPLICAÇÃO - ANÁLISE COMPLETA ===\n');

// Contar todas as ocorrências de CROSS SMITH
const crossSmithOcorrencias = [];

if (vendasData.data && Array.isArray(vendasData.data)) {
  vendasData.data.forEach((venda, index) => {
    if (venda && venda.produtos && Array.isArray(venda.produtos)) {
      venda.produtos.forEach((produtoWrapper, itemIndex) => {
        const item = produtoWrapper.produto || produtoWrapper;
        
        if (item.nome_produto && item.nome_produto.toUpperCase().includes('CROSS SMITH')) {
          crossSmithOcorrencias.push({
            vendaId: venda.id,
            vendaData: venda.data,
            cliente: venda.nome_cliente,
            produto: item.nome_produto,
            quantidade: parseFloat(item.quantidade) || 0,
            valor: parseFloat(item.valor_total) || 0,
            valorUnitario: parseFloat(item.valor_venda) || 0
          });
        }
      });
    }
  });
}

console.log('=== TODAS AS OCORRÊNCIAS DE CROSS SMITH ===');
crossSmithOcorrencias.forEach((ocorrencia, index) => {
  console.log(`${index + 1}. Venda ${ocorrencia.vendaId} - ${ocorrencia.vendaData}`);
  console.log(`   Cliente: ${ocorrencia.cliente}`);
  console.log(`   Produto: ${ocorrencia.produto}`);
  console.log(`   Quantidade: ${ocorrencia.quantidade}`);
  console.log(`   Valor: R$ ${ocorrencia.valor.toFixed(2)}`);
  console.log(`   Valor Unitário: R$ ${ocorrencia.valorUnitario.toFixed(2)}`);
  console.log('');
});

// Agrupar por nome do produto
const agrupados = {};
crossSmithOcorrencias.forEach(ocorrencia => {
  const nome = ocorrencia.produto;
  if (!agrupados[nome]) {
    agrupados[nome] = [];
  }
  agrupados[nome].push(ocorrencia);
});

console.log('=== AGRUPAMENTO POR PRODUTO ===');
Object.entries(agrupados).forEach(([nome, ocorrencias]) => {
  console.log(`\n${nome}:`);
  console.log(`  Total de ocorrências: ${ocorrencias.length}`);
  console.log(`  Quantidade total: ${ocorrencias.reduce((sum, o) => sum + o.quantidade, 0)}`);
  console.log(`  Valor total: R$ ${ocorrencias.reduce((sum, o) => sum + o.valor, 0).toFixed(2)}`);
  
  ocorrencias.forEach((ocorrencia, index) => {
    console.log(`    ${index + 1}. Venda ${ocorrencia.vendaId} - Qtd: ${ocorrencia.quantidade}, Valor: R$ ${ocorrencia.valor.toFixed(2)}`);
  });
});

// Verificar se há duplicação de vendas
const vendaIds = crossSmithOcorrencias.map(o => o.vendaId);
const vendaIdsUnicos = [...new Set(vendaIds)];

console.log('\n=== ANÁLISE DE DUPLICAÇÃO ===');
console.log(`Total de ocorrências: ${crossSmithOcorrencias.length}`);
console.log(`Vendas únicas: ${vendaIdsUnicos.length}`);
console.log(`Há duplicação de vendas: ${vendaIds.length !== vendaIdsUnicos.length}`);

if (vendaIds.length !== vendaIdsUnicos.length) {
  console.log('\nVendas duplicadas:');
  const vendaCounts = {};
  vendaIds.forEach(id => {
    vendaCounts[id] = (vendaCounts[id] || 0) + 1;
  });
  
  Object.entries(vendaCounts).forEach(([vendaId, count]) => {
    if (count > 1) {
      console.log(`  Venda ${vendaId}: ${count} ocorrências`);
    }
  });
}
