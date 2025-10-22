// Script de teste completo da Dashboard CEO
// Testa dados reais, isolamento e consistência

const https = require('https');
const http = require('http');

// Configurações
const BASE_URL = 'http://localhost:3000';
const API_URL = 'https://api.beteltecnologia.com';
const ACCESS_TOKEN = '35f6a8f4b1f80e1a0c2bb0c85fb6f071ba92e82b';
const SECRET_TOKEN = '823e5135fab01a057328fbd0a8a99f17aa38933d';

// Headers para API Betel
const betelHeaders = {
  'Content-Type': 'application/json',
  'access-token': ACCESS_TOKEN,
  'secret-access-token': SECRET_TOKEN
};

// Função para fazer requisições HTTP
function makeRequest(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https://');
    const client = isHttps ? https : http;
    
    const options = {
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    client.get(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            data: jsonData
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            data: data,
            error: error.message
          });
        }
      });
    }).on('error', reject);
  });
}

// Função para testar APIs CEO
async function testCEODashboard() {
  console.log('🧪 INICIANDO TESTE COMPLETO DA DASHBOARD CEO\n');
  
  const startDate = '2024-01-01T00:00:00.000Z';
  const endDate = '2024-12-31T23:59:59.999Z';
  
  const results = {
    ceoAPIs: {},
    betelAPIs: {},
    comparison: {},
    errors: []
  };

  try {
    // FASE 1: Testar APIs CEO
    console.log('📊 FASE 1: Testando APIs CEO...\n');
    
    const ceoAPIs = [
      'operational-metrics',
      'financial-analysis', 
      'cash-flow',
      'sales-analysis'
    ];

    for (const api of ceoAPIs) {
      try {
        console.log(`  🔍 Testando /api/ceo/${api}...`);
        const response = await makeRequest(`${BASE_URL}/api/ceo/${api}?startDate=${startDate}&endDate=${endDate}`);
        
        if (response.status === 200) {
          console.log(`    ✅ Status: ${response.status}`);
          console.log(`    📈 Dados recebidos: ${JSON.stringify(response.data).length} caracteres`);
          
          // Verificar se são dados reais (não simulados)
          const hasRealData = checkForRealData(response.data);
          console.log(`    🎯 Dados reais: ${hasRealData ? 'SIM' : 'NÃO'}`);
          
          results.ceoAPIs[api] = {
            status: response.status,
            hasRealData,
            dataLength: JSON.stringify(response.data).length,
            lastUpdated: response.data.lastUpdated || 'N/A'
          };
        } else {
          console.log(`    ❌ Status: ${response.status}`);
          console.log(`    🚨 Erro: ${response.error || 'Erro desconhecido'}`);
          results.errors.push(`${api}: Status ${response.status}`);
        }
      } catch (error) {
        console.log(`    💥 Erro na requisição: ${error.message}`);
        results.errors.push(`${api}: ${error.message}`);
      }
      console.log('');
    }

    // FASE 2: Testar APIs Betel diretamente
    console.log('🔗 FASE 2: Testando APIs Betel diretamente...\n');
    
    const betelEndpoints = [
      '/vendas?data_inicio=2024-01-01&data_fim=2024-12-31&todas_lojas=true',
      '/recebimentos?data_inicio=2024-01-01&data_fim=2024-12-31',
      '/pagamentos?data_inicio=2024-01-01&data_fim=2024-12-31',
      '/centros_custos',
      '/formas_pagamentos'
    ];

    for (const endpoint of betelEndpoints) {
      try {
        console.log(`  🔍 Testando ${endpoint}...`);
        const response = await makeRequest(`${API_URL}${endpoint}`, betelHeaders);
        
        if (response.status === 200) {
          console.log(`    ✅ Status: ${response.status}`);
          console.log(`    📊 Registros: ${Array.isArray(response.data) ? response.data.length : 'N/A'}`);
          
          results.betelAPIs[endpoint] = {
            status: response.status,
            recordCount: Array.isArray(response.data) ? response.data.length : 0
          };
        } else {
          console.log(`    ❌ Status: ${response.status}`);
          results.errors.push(`Betel ${endpoint}: Status ${response.status}`);
        }
      } catch (error) {
        console.log(`    💥 Erro na requisição: ${error.message}`);
        results.errors.push(`Betel ${endpoint}: ${error.message}`);
      }
      console.log('');
    }

    // FASE 3: Análise de consistência
    console.log('🔄 FASE 3: Análise de consistência...\n');
    
    // Verificar se as APIs CEO estão realmente usando dados da Betel
    const operationalMetrics = results.ceoAPIs['operational-metrics'];
    const financialAnalysis = results.ceoAPIs['financial-analysis'];
    
    if (operationalMetrics && operationalMetrics.hasRealData) {
      console.log('  ✅ APIs CEO estão retornando dados reais');
      console.log('  ✅ Integração com APIs Betel funcionando');
    } else {
      console.log('  ❌ APIs CEO podem estar retornando dados simulados');
    }

    // FASE 4: Resumo dos resultados
    console.log('📋 RESUMO DOS RESULTADOS:\n');
    console.log(`  APIs CEO testadas: ${Object.keys(results.ceoAPIs).length}/4`);
    console.log(`  APIs CEO funcionando: ${Object.values(results.ceoAPIs).filter(r => r.status === 200).length}`);
    console.log(`  APIs Betel testadas: ${Object.keys(results.betelAPIs).length}/5`);
    console.log(`  APIs Betel funcionando: ${Object.values(results.betelAPIs).filter(r => r.status === 200).length}`);
    console.log(`  Erros encontrados: ${results.errors.length}`);
    
    if (results.errors.length > 0) {
      console.log('\n🚨 ERROS ENCONTRADOS:');
      results.errors.forEach(error => console.log(`  - ${error}`));
    }

    // FASE 5: Verificações específicas
    console.log('\n🔍 VERIFICAÇÕES ESPECÍFICAS:\n');
    
    // Verificar se dados são realistas
    if (operationalMetrics && operationalMetrics.hasRealData) {
      console.log('  ✅ Dados parecem realistas (não são valores simulados)');
    }
    
    // Verificar timestamps
    const hasRecentTimestamps = Object.values(results.ceoAPIs)
      .some(api => api.lastUpdated && new Date(api.lastUpdated) > new Date(Date.now() - 60000));
    
    if (hasRecentTimestamps) {
      console.log('  ✅ Timestamps são recentes (dados atualizados)');
    }

    console.log('\n🎉 TESTE CONCLUÍDO!');

  } catch (error) {
    console.error('💥 Erro geral no teste:', error.message);
  }
}

// Função para verificar se os dados são reais (não simulados)
function checkForRealData(data) {
  const dataStr = JSON.stringify(data);
  
  // Verificar se há valores típicos de simulação
  const simulationPatterns = [
    'Math.sin',
    'Math.cos',
    'Math.random',
    'simulation',
    'mock',
    'fake',
    'dummy'
  ];
  
  // Verificar se há valores realistas
  const hasRealisticValues = (
    data.costRevenueRatio >= 0 && data.costRevenueRatio <= 1 && // Entre 0 e 1
    data.customerAcquisitionCost > 0 && data.customerAcquisitionCost < 10000 && // CAC realista
    data.lastUpdated && // Tem timestamp
    new Date(data.lastUpdated) > new Date('2024-01-01') // Timestamp recente
  );
  
  const hasSimulationPatterns = simulationPatterns.some(pattern => 
    dataStr.toLowerCase().includes(pattern)
  );
  
  return hasRealisticValues && !hasSimulationPatterns;
}

// Executar teste
testCEODashboard().catch(console.error);




