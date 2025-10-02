const fs = require('fs');

// Ler o arquivo JSON
const vendasData = JSON.parse(fs.readFileSync('vendas_setembro_2025.json', 'utf8'));

console.log('=== ANÁLISE DE PRODUTOS MAIS VENDIDOS - SETEMBRO 2025 ===\n');

// Verificar estrutura dos dados
console.log('Estrutura dos dados:');
console.log('- Total de vendas:', vendasData.data ? vendasData.data.length : 'N/A');
console.log('- Primeira venda:', vendasData.data && vendasData.data[0] ? Object.keys(vendasData.data[0]) : 'N/A');

// Processar produtos
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
        console.log(`  Produto ${itemIndex + 1}:`, {
          nome: item.nome_produto,
          quantidade: item.quantidade,
          valor_venda: item.valor_venda,
          valor_total: item.valor_total
        });
        
        // Processar produto
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

// Converter para array e ordenar
const produtos = Array.from(produtosMap.values())
  .sort((a, b) => b.quantidade - a.quantidade);

console.log('\n=== TOP 15 PRODUTOS MAIS VENDIDOS (POR QUANTIDADE) ===');
produtos.slice(0, 15).forEach((produto, index) => {
  console.log(`${index + 1}. ${produto.nome}`);
  console.log(`   Quantidade: ${produto.quantidade}`);
  console.log(`   Valor Total: R$ ${produto.valor.toFixed(2)}`);
  console.log(`   Vendas: ${produto.vendas}`);
  console.log(`   Valor Unitário: R$ ${produto.valor_unitario.toFixed(2)}`);
  console.log('');
});

// Ordenar por valor total
const produtosPorValor = Array.from(produtosMap.values())
  .sort((a, b) => b.valor - a.valor);

console.log('\n=== TOP 15 PRODUTOS MAIS VENDIDOS (POR VALOR) ===');
produtosPorValor.slice(0, 15).forEach((produto, index) => {
  console.log(`${index + 1}. ${produto.nome}`);
  console.log(`   Valor Total: R$ ${produto.valor.toFixed(2)}`);
  console.log(`   Quantidade: ${produto.quantidade}`);
  console.log(`   Vendas: ${produto.vendas}`);
  console.log(`   Valor Unitário: R$ ${produto.valor_unitario.toFixed(2)}`);
  console.log('');
});

// Análise de categorias
console.log('\n=== ANÁLISE DE CATEGORIAS ===');
const categorias = {
  equipamentos: [],
  acessorios: [],
  acessoriosEspeciais: [],
  acessoriosSextavados: [],
  acessoriosEmborrachados: []
};

produtos.forEach(produto => {
  const nome = produto.nome.toUpperCase();
  
  // Termos para equipamentos
  const termosEquipamentos = [
    'BANCO', 'MESA', 'CADEIRA', 'ESTEIRA', 'BICICLETA', 'ELÍPTICO', 
    'LEG PRESS', 'HACK SQUAT', 'SMITH', 'CROSSOVER', 'PULLEY'
  ];
  
  // Termos para acessórios especiais
  const termosAcessoriosEspeciais = [
    'ANILHA', 'HALTER', 'CABO DE AÇO', 'KETTLEBELL', 'PAR DE CANELEIRAS'
  ];
  
  const isEquipamento = termosEquipamentos.some(termo => nome.includes(termo)) && produto.valor_unitario >= 1000;
  const isAcessorioEspecial = termosAcessoriosEspeciais.some(termo => nome.includes(termo));
  const isSextavado = nome.includes('SEXTAVADO');
  const isEmborrachado = nome.includes('EMBORRACHADO');
  
  if (isEquipamento) {
    categorias.equipamentos.push(produto);
  } else if (isAcessorioEspecial) {
    categorias.acessoriosEspeciais.push(produto);
  } else if (isSextavado) {
    categorias.acessoriosSextavados.push(produto);
  } else if (isEmborrachado) {
    categorias.acessoriosEmborrachados.push(produto);
  } else {
    categorias.acessorios.push(produto);
  }
});

Object.entries(categorias).forEach(([categoria, produtos]) => {
  console.log(`\n${categoria.toUpperCase()}: ${produtos.length} produtos`);
  if (produtos.length > 0) {
    const totalQuantidade = produtos.reduce((sum, p) => sum + p.quantidade, 0);
    const totalValor = produtos.reduce((sum, p) => sum + p.valor, 0);
    console.log(`  Total Quantidade: ${totalQuantidade}`);
    console.log(`  Total Valor: R$ ${totalValor.toFixed(2)}`);
    
    // Top 3 da categoria
    produtos.slice(0, 3).forEach((produto, index) => {
      console.log(`  ${index + 1}. ${produto.nome} (Qtd: ${produto.quantidade}, Valor: R$ ${produto.valor.toFixed(2)})`);
    });
  }
});

console.log('\n=== RESUMO GERAL ===');
console.log(`Total de produtos únicos: ${produtos.length}`);
console.log(`Total de vendas processadas: ${vendasData.data ? vendasData.data.length : 0}`);
console.log(`Total de itens vendidos: ${produtos.reduce((sum, p) => sum + p.quantidade, 0)}`);
console.log(`Faturamento total: R$ ${produtos.reduce((sum, p) => sum + p.valor, 0).toFixed(2)}`);
