const https = require('https');

const API_URL = 'https://api.beteltecnologia.com';
const ACCESS_TOKEN = '35f6a8f4b1f80e1a0c2bb0c85fb6f071ba92e82b';
const SECRET_ACCESS_TOKEN = '823e5135fab01a057328fbd0a8a99f17aa38933d';

function fazerRequisicao(url) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'Content-Type': 'application/json',
        'access-token': ACCESS_TOKEN,
        'secret-access-token': SECRET_ACCESS_TOKEN
      }
    };

    https.get(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

async function buscarTodasPaginas() {
  console.log('=== BUSCANDO TODAS AS PÁGINAS ===\n');
  
  let todasVendas = [];
  let paginaAtual = 1;
  let temMaisPaginas = true;
  
  while (temMaisPaginas) {
    console.log(`Buscando página ${paginaAtual}...`);
    
    const url = `${API_URL}/vendas?data_inicio=2025-08-01&data_fim=2025-08-31&todas_lojas=true&page=${paginaAtual}&limit=500`;
    
    try {
      const resultado = await fazerRequisicao(url);
      
      if (resultado.data && Array.isArray(resultado.data)) {
        console.log(`Página ${paginaAtual}: ${resultado.data.length} vendas`);
        todasVendas = [...todasVendas, ...resultado.data];
        
        // Verificar se há mais páginas
        if (resultado.meta) {
          const { proxima_pagina, total_paginas } = resultado.meta;
          if (proxima_pagina && paginaAtual < total_paginas) {
            paginaAtual++;
          } else {
            temMaisPaginas = false;
          }
        } else {
          temMaisPaginas = false;
        }
      } else {
        console.log(`Página ${paginaAtual}: Nenhuma venda encontrada`);
        temMaisPaginas = false;
      }
    } catch (error) {
      console.error(`Erro na página ${paginaAtual}:`, error.message);
      temMaisPaginas = false;
    }
    
    // Proteção contra loop infinito
    if (paginaAtual > 10) {
      console.log('Limite de páginas atingido');
      break;
    }
  }
  
  console.log(`\nTotal de vendas encontradas: ${todasVendas.length}`);
  
  // Verificar duplicação por ID
  const vendaIds = todasVendas.map(venda => venda.id);
  const vendaIdsUnicos = [...new Set(vendaIds)];
  
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
  
  // Verificar CROSS SMITH
  console.log('\n=== VENDAS COM CROSS SMITH ===');
  const crossSmithVendas = [];
  
  todasVendas.forEach((venda, index) => {
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
  
  // Agrupar por produto
  const agrupados = {};
  crossSmithVendas.forEach(venda => {
    const nome = venda.produto;
    if (!agrupados[nome]) {
      agrupados[nome] = [];
    }
    agrupados[nome].push(venda);
  });
  
  console.log('\n=== AGRUPAMENTO POR PRODUTO ===');
  Object.entries(agrupados).forEach(([nome, vendas]) => {
    console.log(`\n${nome}:`);
    console.log(`  Total de vendas: ${vendas.length}`);
    console.log(`  Quantidade total: ${vendas.reduce((sum, v) => sum + v.quantidade, 0)}`);
    console.log(`  Valor total: R$ ${vendas.reduce((sum, v) => sum + v.valor, 0).toFixed(2)}`);
    
    vendas.forEach((venda, index) => {
      console.log(`    ${index + 1}. Venda ${venda.vendaId} - ${venda.vendaData} - Qtd: ${venda.quantidade}, Valor: R$ ${venda.valor.toFixed(2)}`);
    });
  });
}

buscarTodasPaginas().catch(console.error);
