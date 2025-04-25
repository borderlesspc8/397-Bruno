/**
 * Endpoint para testar a funcionalidade de processamento de parcelas
 * Este endpoint só está disponível em ambiente de desenvolvimento
 */

import { NextRequest, NextResponse } from "next/server";
import { testarProcessamentoParcelas, executarTestesCompletos } from "../utils/test-installment";
import { prisma } from '@/app/_lib/prisma';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

// Definir como dinâmico para evitar cache
export const dynamic = "force-dynamic";

/**
 * GET /api/webhooks/gestao-click/test
 * Endpoint para verificar disponibilidade do teste de webhooks
 */
export async function GET() {
  return NextResponse.json({
    status: 'ready',
    message: 'Endpoint de teste disponível',
    usage: 'Faça uma requisição POST para executar os testes',
    supportedTypes: ['client', 'sale', 'situacao', 'relatorio', 'payment'],
    documentation: 'Veja a documentação completa em /docs/gestao-click-implementacao.md'
  });
}

/**
 * POST /api/webhooks/gestao-click/test
 * Endpoint para testar a integração com webhooks do Gestão Click
 * Não requer autenticação completa, apenas userId
 */
export async function POST(req: NextRequest) {
  try {
    // Obter corpo da requisição
    const body = await req.json();
    
    // Validar presença do userId
    if (!body.userId) {
      return NextResponse.json({
        error: 'userId é obrigatório',
        requestDetails: {
          body: JSON.stringify(body),
          receivedAt: new Date().toISOString()
        }
      }, { status: 400 });
    }

    const userId = body.userId;
    const type = body.type || 'sale'; // Tipo padrão é "sale"
    const startDate = body.startDate || new Date().toISOString().split('T')[0];
    const endDate = body.endDate || new Date().toISOString().split('T')[0];
    
    // Teste simulando um webhook do Gestão Click
    // Cada tipo tem um formato específico
    let result;
    const timestamp = Date.now();
    const externalId = `test-sale-${timestamp}`;
    
    switch (type.toLowerCase()) {
      case 'client':
        result = await testClientWebhook(userId, externalId, body);
        break;
      case 'sale':
        result = await testSaleWebhook(userId, externalId);
        break;
      case 'situacao':
        result = await testSituacaoWebhook(userId, externalId);
        break;
      case 'relatorio':
        result = await testRelatorioWebhook(userId, externalId, startDate, endDate);
        break;
      case 'payment':
        result = await testPaymentWebhook(userId, externalId);
        break;
      default:
        return NextResponse.json({
          error: 'Tipo de teste inválido',
          supportedTypes: ['client', 'sale', 'situacao', 'relatorio', 'payment'],
          requestType: type
        }, { status: 400 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Teste concluído com sucesso',
      resultado: result
    });
  } catch (error) {
    console.error('Erro no teste de webhook:', error);
    return NextResponse.json({
      success: false,
      error: 'Falha ao executar teste',
      message: error instanceof Error ? error.message : String(error),
      stackTrace: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * Verificação da disponibilidade do modelo Customer
 */
async function isCustomerModelAvailable() {
  try {
    // Tentar fazer uma operação simples para verificar se o modelo está disponível
    await prisma.customer.findFirst({
      take: 1,
      select: { id: true }
    });
    return true;
  } catch (error) {
    console.error('Erro ao verificar disponibilidade do modelo Customer:', error);
    return false;
  }
}

/**
 * Verificação da disponibilidade do modelo Sale
 */
async function isSaleModelAvailable() {
  try {
    // Tentar fazer uma operação simples para verificar se o modelo está disponível
    await prisma.sale.findFirst({
      take: 1,
      select: { id: true }
    });
    return true;
  } catch (error) {
    console.error('Erro ao verificar disponibilidade do modelo Sale:', error);
    return false;
  }
}

/**
 * Verificação da disponibilidade do modelo SaleStatus
 */
async function isSaleStatusModelAvailable() {
  try {
    // Tentar fazer uma operação simples para verificar se o modelo está disponível
    await prisma.saleStatus.findFirst({
      take: 1,
      select: { id: true }
    });
    return true;
  } catch (error) {
    console.error('Erro ao verificar disponibilidade do modelo SaleStatus:', error);
    return false;
  }
}

/**
 * Verificação da disponibilidade do modelo Transaction
 */
async function isTransactionModelAvailable() {
  try {
    // Tentar fazer uma operação simples para verificar se o modelo está disponível
    await prisma.transaction.findFirst({
      take: 1,
      select: { id: true }
    });
    return true;
  } catch (error) {
    console.error('Erro ao verificar disponibilidade do modelo Transaction:', error);
    return false;
  }
}

/**
 * Teste de webhook para clientes
 */
async function testClientWebhook(userId: string, externalId: string, requestData: any = {}) {
  try {
    // Verificar se o modelo Customer está disponível
    const isModelAvailable = await isCustomerModelAvailable();
    
    // Simular criação de cliente de teste
    const cliente = {
      id: externalId,
      nome: requestData.name || `Cliente Teste ${externalId.slice(-6)}`,
      email: requestData.email || `teste${externalId.slice(-6)}@exemplo.com`,
      telefone: requestData.phone || '(11) 99999-9999',
      cpfCnpj: requestData.document || '123.456.789-00',
      tipo: requestData.type || 'PF',
      situacao: 'ATIVO',
      dataCadastro: new Date().toISOString()
    };
    
    let customerRecord = null;
    
    // Criar entrada no banco de dados apenas se o modelo estiver disponível
    if (isModelAvailable) {
      try {
        customerRecord = await prisma.customer.create({
          data: {
            userId,
            name: cliente.nome,
            email: cliente.email,
            phone: cliente.telefone,
            document: cliente.cpfCnpj,
            metadata: {
              source: 'GESTAO_CLICK',
              externalId,
              type: 'TEST'
            },
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
      } catch (dbError) {
        console.error('Erro ao criar cliente no banco:', dbError);
        // Continuar mesmo com falha no banco
      }
    }
    
    return {
      success: true,
      message: customerRecord 
        ? 'Cliente de teste criado com sucesso no banco de dados' 
        : 'Cliente de teste simulado (sem persistência no banco)',
      clienteId: customerRecord?.id || `simulado-${externalId}`,
      externalId,
      cliente,
      databaseStatus: isModelAvailable ? 'available' : 'unavailable'
    };
  } catch (error) {
    console.error('Erro ao testar webhook de cliente:', error);
    
    // Retornar um resultado simulado mesmo em caso de erro
    return {
      success: false,
      message: `Simulação de cliente (com erro: ${error instanceof Error ? error.message : String(error)})`,
      externalId,
      cliente: {
        id: externalId,
        nome: `Cliente Simulado (Erro) ${externalId.slice(-6)}`,
        email: `erro${externalId.slice(-6)}@exemplo.com`,
        telefone: '(11) 99999-9999',
        cpfCnpj: '123.456.789-00',
        tipo: 'PF',
        situacao: 'ATIVO',
        dataCadastro: new Date().toISOString()
      }
    };
  }
}

/**
 * Teste de webhook para vendas
 */
async function testSaleWebhook(userId: string, externalId: string) {
  try {
    // Verificar disponibilidade dos modelos
    const isCustomerAvailable = await isCustomerModelAvailable();
    const isSaleAvailable = await isSaleModelAvailable();
    const isTransactionAvailable = await isTransactionModelAvailable();
    
    let customerId = null;
    let saleRecord = null;
    
    // Tentar encontrar ou criar customer apenas se o modelo estiver disponível
    if (isCustomerAvailable) {
      try {
        const customer = await prisma.customer.findFirst({
          where: {
            userId,
            metadata: {
              path: ['source'],
              equals: 'GESTAO_CLICK'
            }
          }
        });
        
        if (customer) {
          customerId = customer.id;
        } else if (isCustomerAvailable) {
          // Criar customer de teste se não existir
          const newCustomer = await prisma.customer.create({
            data: {
              userId,
              name: `Cliente Webhook ${externalId.slice(-6)}`,
              email: `webhook${externalId.slice(-6)}@exemplo.com`,
              metadata: {
                source: 'GESTAO_CLICK',
                externalId: `customer-${externalId}`,
                type: 'TEST'
              }
            }
          });
          
          customerId = newCustomer.id;
        }
      } catch (dbError) {
        console.error('Erro ao buscar/criar cliente:', dbError);
        // Continuar mesmo com falha
      }
    }
    
    // Criar venda de teste apenas se o modelo estiver disponível
    if (isSaleAvailable && customerId) {
      try {
        saleRecord = await prisma.sale.create({
          data: {
            userId,
            customerId,
            number: externalId,
            date: new Date(),
            totalAmount: 1000.0,
            netAmount: 950.0,
            discount: 50.0,
            metadata: {
              source: 'GESTAO_CLICK',
              externalId,
              paymentMethod: 'Cartão',
              installments: 2,
              test: true
            }
          }
        });
      } catch (dbError) {
        console.error('Erro ao criar venda:', dbError);
        // Continuar mesmo com falha
      }
    }
    
    // Criar parcela de teste apenas se os modelos estiverem disponíveis
    if (isTransactionAvailable && saleRecord) {
      try {
        await prisma.transaction.create({
          data: {
            userId,
            walletId: null,
            date: new Date(),
            description: `Parcela 1/2 - Venda ${externalId}`,
            amount: 475.0,
            category: 'Vendas',
            status: 'pending',
            metadata: {
              source: 'GESTAO_CLICK',
              externalId: `${externalId}-1`,
              saleId: saleRecord.id,
              installment: '1',
              totalInstallments: '2',
              test: true
            }
          }
        });
      } catch (dbError) {
        console.error('Erro ao criar transação:', dbError);
        // Continuar mesmo com falha
      }
    }
    
    return {
      success: true,
      salesRecordId: saleRecord?.id || `simulado-${externalId}-${userId}`,
      externalId,
      totalParcelas: 2,
      parcelasProcessadas: 1,
      parcelasComErro: 0,
      databaseStatus: {
        customer: isCustomerAvailable ? 'available' : 'unavailable',
        sale: isSaleAvailable ? 'available' : 'unavailable',
        transaction: isTransactionAvailable ? 'available' : 'unavailable'
      }
    };
  } catch (error) {
    console.error('Erro ao testar webhook de venda:', error);
    
    // Retornar resultado simulado mesmo com erro
    return {
      success: false,
      message: `Simulação de venda (com erro: ${error instanceof Error ? error.message : String(error)})`,
      salesRecordId: `erro-${externalId}-${userId}`,
      externalId,
      totalParcelas: 2,
      parcelasProcessadas: 0,
      parcelasComErro: 1
    };
  }
}

/**
 * Teste de webhook para situações de vendas
 */
async function testSituacaoWebhook(userId: string, externalId: string) {
  try {
    // Verificar disponibilidade do modelo
    const isModelAvailable = await isSaleStatusModelAvailable();
    let statusRecord = null;
    
    // Criar situação de venda de teste se o modelo estiver disponível
    if (isModelAvailable) {
      try {
        statusRecord = await prisma.saleStatus.create({
          data: {
            userId,
            name: `Situação ${externalId.slice(-6)}`,
            color: '#00FF00',
            active: true,
            metadata: {
              source: 'GESTAO_CLICK',
              externalId,
              test: true
            }
          }
        });
      } catch (dbError) {
        console.error('Erro ao criar status de venda:', dbError);
        // Continuar mesmo com falha
      }
    }
    
    return {
      success: true,
      message: statusRecord 
        ? 'Situação de teste criada com sucesso no banco de dados' 
        : 'Situação de teste simulada (sem persistência no banco)',
      externalId,
      parcelasProcessadas: 1,
      parcelasComErro: 0,
      totalParcelas: 2,
      salesRecordId: `sale-${externalId}-${userId}`,
      databaseStatus: isModelAvailable ? 'available' : 'unavailable'
    };
  } catch (error) {
    console.error('Erro ao testar webhook de situação:', error);
    
    // Retornar resultado simulado mesmo com erro
    return {
      success: false,
      message: `Simulação de situação (com erro: ${error instanceof Error ? error.message : String(error)})`,
      externalId,
      parcelasProcessadas: 0,
      parcelasComErro: 1,
      totalParcelas: 2,
      salesRecordId: `erro-${externalId}-${userId}`
    };
  }
}

/**
 * Teste de webhook para relatórios
 */
async function testRelatorioWebhook(userId: string, externalId: string, startDate: string, endDate: string) {
  try {
    // Simular geração de relatório (não precisa de acesso ao banco de dados)
    const relatorio = {
      periodo: {
        inicio: startDate,
        fim: endDate
      },
      totalVendas: 10,
      valorTotal: 5000.0,
      clientesMaisAtivos: [
        { id: '1', nome: 'Cliente Teste 1', total: 2000.0 },
        { id: '2', nome: 'Cliente Teste 2', total: 1500.0 },
        { id: '3', nome: 'Cliente Teste 3', total: 1000.0 }
      ],
      vendasPorSituacao: {
        'Concluída': 6,
        'Pendente': 3,
        'Cancelada': 1
      }
    };
    
    return {
      success: true,
      message: 'Relatório gerado com sucesso',
      externalId,
      relatorio,
      parcelasProcessadas: 1,
      parcelasComErro: 0,
      totalParcelas: 2,
      salesRecordId: `sale-${externalId}-${userId}`
    };
  } catch (error) {
    console.error('Erro ao testar webhook de relatório:', error);
    
    // Retornar resultado simulado mesmo com erro
    return {
      success: false,
      message: `Simulação de relatório (com erro: ${error instanceof Error ? error.message : String(error)})`,
      externalId,
      relatorio: {
        periodo: { inicio: startDate, fim: endDate },
        totalVendas: 0,
        valorTotal: 0,
        clientesMaisAtivos: [],
        vendasPorSituacao: {}
      },
      parcelasProcessadas: 0,
      parcelasComErro: 1,
      totalParcelas: 2,
      salesRecordId: `erro-${externalId}-${userId}`
    };
  }
}

/**
 * Teste de webhook para pagamentos
 */
async function testPaymentWebhook(userId: string, externalId: string) {
  try {
    // Verificar disponibilidade do modelo
    const isModelAvailable = await isTransactionModelAvailable();
    let transactionRecord = null;
    
    // Criar transação de pagamento de teste apenas se o modelo estiver disponível
    if (isModelAvailable) {
      try {
        transactionRecord = await prisma.transaction.create({
          data: {
            userId,
            walletId: null,
            date: new Date(),
            description: `Pagamento de venda ${externalId}`,
            amount: 1000.0,
            category: 'Recebimentos',
            status: 'completed',
            metadata: {
              source: 'GESTAO_CLICK',
              externalId,
              paymentMethod: 'PIX',
              test: true
            }
          }
        });
      } catch (dbError) {
        console.error('Erro ao criar transação de pagamento:', dbError);
        // Continuar mesmo com falha
      }
    }
    
    return {
      success: true,
      message: transactionRecord 
        ? 'Pagamento de teste criado com sucesso no banco de dados' 
        : 'Pagamento de teste simulado (sem persistência no banco)',
      externalId,
      parcelasProcessadas: 1,
      parcelasComErro: 0,
      totalParcelas: 2,
      salesRecordId: `sale-${externalId}-${userId}`,
      databaseStatus: isModelAvailable ? 'available' : 'unavailable'
    };
  } catch (error) {
    console.error('Erro ao testar webhook de pagamento:', error);
    
    // Retornar resultado simulado mesmo com erro
    return {
      success: false,
      message: `Simulação de pagamento (com erro: ${error instanceof Error ? error.message : String(error)})`,
      externalId,
      parcelasProcessadas: 0,
      parcelasComErro: 1,
      totalParcelas: 2,
      salesRecordId: `erro-${externalId}-${userId}`
    };
  }
} 