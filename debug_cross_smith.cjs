const fs = require('fs');

// Ler o arquivo JSON
const vendasData = JSON.parse(fs.readFileSync('vendas_agosto_2025.json', 'utf8'));

console.log('=== DEBUG CROSS SMITH - ANÁLISE DETALHADA ===\n');

// Simular a lógica da nossa API
const produtosMap = new Map();
const equipamentosMap = new Map();

function processarItem(item, produtosMap, equipamentosMap) {
  const produtoId = item.produto_id?.toString() || item.id?.toString() || `unknown-${Math.random()}`;
  const nomeProduto = item.produto_nome || item.nome_produto || item.nome || item.descricao || "Produto sem nome";
  
  const quantidade = Number(item.quantidade || "1");
  if (isNaN(quantidade)) {
    console.warn(`Quantidade inválida para o produto ${produtoId}: ${item.quantidade}`);
    return;
  }
  
  const valorVenda = Number(item.valor_venda || item.valor_unitario || "0");
  const valorCusto = Number(item.valor_custo || "0");
  const valorTotal = Number(item.valor_total) || (quantidade * valorVenda);
  const custoTotal = valorCusto * quantidade;
  const valorUnitario = quantidade > 0 ? valorTotal / quantidade : valorVenda;
  
  const produtoInfo = {
    id: produtoId,
    nome: nomeProduto,
    quantidade: quantidade,
    valor: valorTotal,
    custo: custoTotal,
    valorUnitario: valorUnitario
  };
  
  const chave = nomeProduto.toUpperCase().trim();
  
  // Atualizar mapa geral de produtos
  if (!produtosMap.has(chave)) {
    produtosMap.set(chave, produtoInfo);
    console.log(`NOVO PRODUTO: ${nomeProduto} - Qtd: ${quantidade}, Valor: ${valorTotal}`);
  } else {
    const existente = produtosMap.get(chave);
    const quantidadeExistente = Number(existente.quantidade) || 0;
    const novaQuantidade = Number(quantidade) || 0;
    const quantidadeAnterior = existente.quantidade;
    
    existente.quantidade = quantidadeExistente + novaQuantidade;
    existente.valor = Number(existente.valor) + Number(valorTotal);
    existente.custo = Number(existente.custo) + Number(custoTotal);
    existente.valorUnitario = existente.quantidade > 0 ? existente.valor / existente.quantidade : valorUnitario;
    
    console.log(`ATUALIZANDO: ${nomeProduto}`);
    console.log(`  Quantidade anterior: ${quantidadeAnterior} + ${novaQuantidade} = ${existente.quantidade}`);
    console.log(`  Valor anterior: ${existente.valor - valorTotal} + ${valorTotal} = ${existente.valor}`);
  }
  
  // Verificar se é equipamento (valor unitário >= 1000)
  const ehEquipamento = valorUnitario >= 1000;
  
  if (ehEquipamento) {
    if (!equipamentosMap.has(chave)) {
      equipamentosMap.set(chave, produtoInfo);
      console.log(`NOVO EQUIPAMENTO: ${nomeProduto}`);
    } else {
      const existente = equipamentosMap.get(chave);
      const quantidadeExistente = Number(existente.quantidade) || 0;
      const novaQuantidade = Number(quantidade) || 0;
      const quantidadeAnterior = existente.quantidade;
      
      existente.quantidade = quantidadeExistente + novaQuantidade;
      existente.valor = Number(existente.valor) + Number(valorTotal);
      existente.custo = Number(existente.custo) + Number(custoTotal);
      existente.valorUnitario = existente.quantidade > 0 ? existente.valor / existente.quantidade : valorUnitario;
      
      console.log(`ATUALIZANDO EQUIPAMENTO: ${nomeProduto}`);
      console.log(`  Quantidade anterior: ${quantidadeAnterior} + ${novaQuantidade} = ${existente.quantidade}`);
      console.log(`  Valor anterior: ${existente.valor - valorTotal} + ${valorTotal} = ${existente.valor}`);
    }
  }
}

// Processar vendas
if (vendasData.data && Array.isArray(vendasData.data)) {
  vendasData.data.forEach((venda, index) => {
    if (venda && venda.produtos && Array.isArray(venda.produtos)) {
      venda.produtos.forEach((produtoWrapper, itemIndex) => {
        const item = produtoWrapper.produto || produtoWrapper;
        
        // Filtrar apenas CROSS SMITH para debug
        if (item.nome_produto && item.nome_produto.toUpperCase().includes('CROSS SMITH')) {
          console.log(`\n--- PROCESSANDO CROSS SMITH ---`);
          console.log(`Venda: ${venda.id} - ${venda.data}`);
          console.log(`Cliente: ${venda.nome_cliente}`);
          console.log(`Produto: ${item.nome_produto}`);
          console.log(`Quantidade: ${item.quantidade}`);
          console.log(`Valor Total: ${item.valor_total}`);
          console.log(`Valor Venda: ${item.valor_venda}`);
          
          processarItem(item, produtosMap, equipamentosMap);
        }
      });
    }
  });
}

console.log('\n=== RESULTADO FINAL ===');
console.log('Produtos Map:');
for (const [chave, produto] of produtosMap) {
  if (produto.nome.toUpperCase().includes('CROSS SMITH')) {
    console.log(`${produto.nome}: ${produto.quantidade} unidades, R$ ${produto.valor.toFixed(2)}`);
  }
}

console.log('\nEquipamentos Map:');
for (const [chave, produto] of equipamentosMap) {
  if (produto.nome.toUpperCase().includes('CROSS SMITH')) {
    console.log(`${produto.nome}: ${produto.quantidade} unidades, R$ ${produto.valor.toFixed(2)}`);
  }
}
