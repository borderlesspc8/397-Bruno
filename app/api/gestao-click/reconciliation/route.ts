import { NextResponse } from 'next/server';
import { logger } from '@/app/_services/logger';
import { gestaoClickConfig } from '@/app/_config/gestao-click';

// Configuração para forçar o comportamento dinâmico
export const dynamic = "force-dynamic";


export async function GET() {
  try {
    // Detalhes dos tokens configurados
    const configDetails = {
      apiUrl: gestaoClickConfig.apiUrl,
      accessToken: gestaoClickConfig.accessToken.substring(0, 5) + '...' + gestaoClickConfig.accessToken.substring(gestaoClickConfig.accessToken.length - 5),
      secretToken: gestaoClickConfig.secretAccessToken.substring(0, 5) + '...' + gestaoClickConfig.secretAccessToken.substring(gestaoClickConfig.secretAccessToken.length - 5),
      accessTokenLength: gestaoClickConfig.accessToken.length,
      secretTokenLength: gestaoClickConfig.secretAccessToken.length
    };
    
    logger.info('Verificando configuração do Gestão Click', {
      context: 'API_RECONCILIATION',
      data: configDetails
    });
    
    // Tentar diferentes formatos de autenticação
    const authVariations = [
      {
        method: 'Bearer + X-Secret-Token',
        headers: {
          'Authorization': `Bearer ${gestaoClickConfig.accessToken}`,
          'X-Secret-Token': gestaoClickConfig.secretAccessToken
        }
      },
      {
        method: 'Token direto + X-Secret-Token',
        headers: {
          'Authorization': gestaoClickConfig.accessToken,
          'X-Secret-Token': gestaoClickConfig.secretAccessToken
        }
      },
      {
        method: 'Basic Auth',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${gestaoClickConfig.accessToken}:${gestaoClickConfig.secretAccessToken}`).toString('base64')}`
        }
      },
      {
        method: 'Api-Token + Api-Secret',
        headers: {
          'Api-Token': gestaoClickConfig.accessToken,
          'Api-Secret': gestaoClickConfig.secretAccessToken
        }
      },
      {
        method: 'access-token + secret-access-token',
        headers: {
          'access-token': gestaoClickConfig.accessToken,
          'secret-access-token': gestaoClickConfig.secretAccessToken
        }
      }
    ];
    
    // Testar todos os formatos
    const results = await Promise.all(
      authVariations.map(async variation => {
        try {
          const headers: Record<string, string> = { 'Content-Type': 'application/json' };
          
          // Adicionar headers de variação
          Object.entries(variation.headers).forEach(([key, value]) => {
            if (value) headers[key] = value;
          });
          
          const response = await fetch(`${gestaoClickConfig.apiUrl}/api/vendas`, {
            method: 'GET',
            headers
          });
          
          const responseText = await response.text();
          let responseData;
          
          try {
            responseData = JSON.parse(responseText);
          } catch (e) {
            responseData = { error: 'Não foi possível fazer parse da resposta' };
          }
          
          return {
            method: variation.method,
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries()),
            data: responseData,
            success: response.ok
          };
        } catch (error) {
          return {
            method: variation.method,
            error: error instanceof Error ? error.message : String(error),
            success: false
          };
        }
      })
    );
    
    // Verificar dados da documentação
    const documentationCheck = {
      apiUrlPattern: gestaoClickConfig.apiUrl.includes('beteltecnologia.com') ? 'OK' : 'Diferente do esperado',
      tokenPattern: /^[a-f0-9]{40}$/.test(gestaoClickConfig.accessToken) ? 'Parece um token válido (40 caracteres hex)' : 'Formato inesperado',
      secretPattern: /^[a-f0-9]{40}$/.test(gestaoClickConfig.secretAccessToken) ? 'Parece um token válido (40 caracteres hex)' : 'Formato inesperado'
    };
    
    return NextResponse.json({
      config: configDetails,
      documentationCheck,
      authResults: results,
      recommendations: [
        'Verifique se os tokens no arquivo .env estão corretos e atualizados',
        'Entre em contato com o suporte do Gestão Click para confirmar o formato de autenticação',
        'Verifique se a API mudou recentemente ou se houve alguma atualização na documentação'
      ]
    });
  } catch (error) {
    logger.error('Erro ao verificar configurações de reconciliação', {
      context: 'API_RECONCILIATION',
      data: error instanceof Error ? { message: error.message, stack: error.stack } : String(error)
    });
    
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Erro desconhecido ao verificar configuração',
      error: error instanceof Error ? error.stack : null
    }, { status: 500 });
  }
} 
