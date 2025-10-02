const fs = require('fs');

// Ler o arquivo JSON
const vendasData = JSON.parse(fs.readFileSync('vendas_agosto_2025.json', 'utf8'));

console.log('=== ANÁLISE ESPECÍFICA - CROSS SMITH AGOSTO 2025 ===\n');

// Verificar estrutura dos dados
console.log('Total de vendas em agosto/2025:', vendasData.data ? vendasData.data.length : 'N/A');

// Processar produtos específicos de CROSS SMITH
const crossSmithVendas = [];
const produtosMap = new Map();

if (vendasData.data && Array.isArray(vendasData.data)) {
  vendasData.data.forEach((venda, index) => {
    console.log(`\n--- Venda ${index + 1} ---`);
    console.log('ID:', venda.id);
    console.log('Data:', venda.data);
    console.log('Cliente:', venda.nome_cliente);
    console.log('Valor Total:', venda.valor_total);
    
    // Verificar se tem produtos
    if (venda.produtos && Array.isArray(venda.produtos)) {
      console.log('Produtos encontrados:', venda.produtos.length);
      
      venda.produtos.forEach((produtoWrapper, itemIndex) => {
        const item = produtoWrapper.produto || produtoWrapper;
        
        // Filtrar apenas CROSS SMITH
        if (item.nome_produto && item.nome_produto.toUpperCase().includes('CROSS SMITH')) {
          console.log(`  🎯 CROSS SMITH encontrado:`, {
            nome: item.nome_produto,
            quantidade: item.quantidade,
            valor_venda: item.valor_venda,
            valor_total: item.valor_total
          });
          
          crossSmithVendas.push({
            vendaId: venda.id,
            vendaData: venda.data,
            cliente: venda.nome_cliente,
            produto: item.nome_produto,
            quantidade: parseFloat(item.quantidade) || 0,
            valor: parseFloat(item.valor_total) || 0,
            valorUnitario: parseFloat(item.valor_venda) || 0
          });
        }
        
        // Processar todos os produtos para contagem geral
        const nomeProduto = item.nome_produto;
        if (nomeProduto) {
          if (produtosMap.has(nomeProduto)) {
            const produto = produtosMap.get(nomeProduto);
            produto.quantidade += parseFloat(item.quantidade) || 0;
            produto.valor += parseFloat(item.valor_total) || 0;
            produto.vendas += 1;
          } else {
            produtosMap.set(nomeProduto, {
              nome: nomeProduto,
              quantidade: parseFloat(item.quantidade) || 0,
              valor: parseFloat(item.valor_total) || 0,
              vendas: 1,
              valor_unitario: parseFloat(item.valor_venda) || 0
            });
          }
        }
      });
    } else {
      console.log('Nenhum produto encontrado nesta venda');
    }
  });
}

console.log('\n=== RESUMO CROSS SMITH AGOSTO 2025 ===');
console.log('Total de vendas com CROSS SMITH:', crossSmithVendas.length);
console.log('Total de unidades vendidas:', crossSmithVendas.reduce((sum, v) => sum + v.quantidade, 0));
console.log('Valor total vendido:', crossSmithVendas.reduce((sum, v) => sum + v.valor, 0));

console.log('\n=== DETALHES DAS VENDAS CROSS SMITH ===');
crossSmithVendas.forEach((venda, index) => {
  console.log(`${index + 1}. Venda ${venda.vendaId} - ${venda.vendaData}`);
  console.log(`   Cliente: ${venda.cliente}`);
  console.log(`   Produto: ${venda.produto}`);
  console.log(`   Quantidade: ${venda.quantidade}`);
  console.log(`   Valor: R$ ${venda.valor.toFixed(2)}`);
  console.log(`   Valor Unitário: R$ ${venda.valorUnitario.toFixed(2)}`);
  console.log('');
});

// Verificar se há outros produtos similares
console.log('\n=== PRODUTOS SIMILARES A CROSS SMITH ===');
const produtosSimilares = Array.from(produtosMap.values())
  .filter(p => p.nome.toUpperCase().includes('CROSS') || p.nome.toUpperCase().includes('SMITH'))
  .sort((a, b) => b.quantidade - a.quantidade);

produtosSimilares.forEach((produto, index) => {
  console.log(`${index + 1}. ${produto.nome}`);
  console.log(`   Quantidade: ${produto.quantidade}`);
  console.log(`   Valor Total: R$ ${produto.valor.toFixed(2)}`);
  console.log(`   Vendas: ${produto.vendas}`);
  console.log('');
});

// Top 10 produtos mais vendidos para comparação
console.log('\n=== TOP 10 PRODUTOS MAIS VENDIDOS AGOSTO 2025 ===');
const topProdutos = Array.from(produtosMap.values())
  .sort((a, b) => b.quantidade - a.quantidade)
  .slice(0, 10);

topProdutos.forEach((produto, index) => {
  console.log(`${index + 1}. ${produto.nome}`);
  console.log(`   Quantidade: ${produto.quantidade}`);
  console.log(`   Valor Total: R$ ${produto.valor.toFixed(2)}`);
  console.log(`   Vendas: ${produto.vendas}`);
  console.log('');
});
