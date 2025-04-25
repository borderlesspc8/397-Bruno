/**
 * Implementação simplificada para importar vendas do Gestão Click
 */

import { db } from '@/app/_lib/db';

/**
 * Importa vendas do Gestão Click para a tabela sales_records
 * @param userId ID do usuário
 * @param vendas Array de vendas do Gestão Click
 */
export async function importVendasToDatabase(userId: string, vendas: any[]): Promise<{
  imported: number;
  skipped: number;
  errors: number;
  details: any[];
}> {
  const result = {
    imported: 0,
    skipped: 0,
    errors: 0,
    details: [] as any[]
  };

  // Primeiro buscar vendas existentes e seus pagamentos para evitar duplicação
  const existingVendas = await db.sales_records.findMany({
    where: {
      userId,
      source: 'GESTAO_CLICK'
    },
    select: {
      externalId: true,
      id: true,
      metadata: true
    }
  });

  // Criar um mapa de vendas existentes com seus pagamentos já processados
  const existingVendasMap = new Map<string, { id: string, processedPaymentIds: Set<string>, processedAttachmentIds: Set<string> }>();
  
  // Preencher o mapa com as vendas e IDs de pagamentos já processados
  existingVendas.forEach(v => {
    if (v.externalId) {
      // Verificar se existe metadata com informações de pagamentos processados
      const metadata = v.metadata as any;
      const processedPaymentIds = new Set<string>();
      const processedAttachmentIds = new Set<string>();
      
      // Se houver metadata de pagamentos, adicionar os IDs já processados
      if (metadata && metadata.processedPaymentIds && Array.isArray(metadata.processedPaymentIds)) {
        metadata.processedPaymentIds.forEach((paymentId: string) => {
          processedPaymentIds.add(paymentId);
        });
      }
      
      // Se houver metadata de anexos, adicionar os IDs já processados
      if (metadata && metadata.processedAttachmentIds && Array.isArray(metadata.processedAttachmentIds)) {
        metadata.processedAttachmentIds.forEach((attachmentId: string) => {
          processedAttachmentIds.add(attachmentId);
        });
      }
      
      existingVendasMap.set(v.externalId, {
        id: v.id,
        processedPaymentIds,
        processedAttachmentIds
      });
    }
  });

  console.log(`[DEBUG] Encontradas ${existingVendasMap.size} vendas já existentes no banco de dados`);

  // Processar cada venda
  for (const venda of vendas) {
    try {
      const vendaId = venda.id?.toString();
      
      // Verificar se a venda já existe
      const existingVenda = vendaId ? existingVendasMap.get(vendaId) : undefined;
      
      // Extrair informações de pagamentos da venda (se existirem)
      const pagamentos = venda.pagamentos || [];
      
      // Extrair informações de anexos da venda (se existirem)
      const anexos = venda.anexos || [];
      if (anexos.length > 0) {
        console.log(`[DEBUG] Venda ${vendaId} tem ${anexos.length} anexos`);
      }
      
      // Se a venda existe mas não tem todos os pagamentos ou anexos, processar apenas os novos
      if (existingVenda) {
        console.log(`[DEBUG] Venda ${vendaId} já existe, verificando pagamentos e anexos não processados`);
        let novosPagamentosAdicionados = false;
        let novosAnexosAdicionados = false;
        
        // Filtrar apenas pagamentos ainda não processados
        const novosPagamentos = pagamentos.filter((pagamento: any) => {
          const pagamentoId = pagamento.id?.toString();
          return pagamentoId && !existingVenda.processedPaymentIds.has(pagamentoId);
        });
        
        // Filtrar apenas anexos ainda não processados
        const novosAnexos = anexos.filter((anexo: any) => {
          const anexoId = anexo.id?.toString();
          return anexoId && !existingVenda.processedAttachmentIds.has(anexoId);
        });
        
        if (novosPagamentos.length === 0 && novosAnexos.length === 0) {
          // Pular venda se todos os pagamentos e anexos já foram processados
          console.log(`[DEBUG] Todos os pagamentos e anexos da venda ${vendaId} já foram processados, pulando`);
          result.skipped++;
          continue;
        }
        
        // Processar novos pagamentos para esta venda
        if (novosPagamentos.length > 0) {
          console.log(`[DEBUG] Encontrados ${novosPagamentos.length} novos pagamentos para venda ${vendaId}`);
          
          const processedPaymentIds = [...existingVenda.processedPaymentIds];
          
          for (const pagamento of novosPagamentos) {
            const pagamentoId = pagamento.id?.toString();
            
            // Criar um registro relacionado a esta venda para o pagamento
            await criarRegistroPagamento(existingVenda.id, userId, pagamento, venda);
            
            // Adicionar o ID do pagamento aos processados
            processedPaymentIds.push(pagamentoId);
            result.imported++;
            novosPagamentosAdicionados = true;
          }
          
          // Atualizar a metadata da venda com os novos pagamentos processados
          if (novosPagamentosAdicionados) {
            await db.sales_records.update({
              where: { id: existingVenda.id },
              data: {
                metadata: {
                  ...venda,
                  processedPaymentIds
                },
                updatedAt: new Date()
              }
            });
          }
        }
        
        // Processar novos anexos para esta venda
        if (novosAnexos.length > 0) {
          console.log(`[DEBUG] Encontrados ${novosAnexos.length} novos anexos para venda ${vendaId}`);
          
          const processedAttachmentIds = [...existingVenda.processedAttachmentIds];
          
          for (const anexo of novosAnexos) {
            const anexoId = anexo.id?.toString();
            
            // Criar um registro relacionado a esta venda para o anexo
            await criarRegistroAnexo(existingVenda.id, userId, anexo, venda);
            
            // Adicionar o ID do anexo aos processados
            processedAttachmentIds.push(anexoId);
            novosAnexosAdicionados = true;
          }
          
          // Atualizar a metadata da venda com os novos anexos processados
          if (novosAnexosAdicionados) {
            await db.sales_records.update({
              where: { id: existingVenda.id },
              data: {
                metadata: {
                  ...venda,
                  processedAttachmentIds
                },
                updatedAt: new Date()
              }
            });
          }
        }
        
        continue;
      }

      // Se chegou aqui, é uma nova venda
      // Gerar um ID único para a venda
      const recordId = `sr_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
      
      // Extrair dados da venda
      const valorTotal = parseFloat(venda.valor_total) || 0;
      const codigo = venda.codigo || vendaId || `GC-${Date.now()}`;
      const data = venda.data ? new Date(venda.data) : new Date();
      const status = venda.nome_situacao || 'PENDING';
      const clienteNome = venda.nome_cliente || 'Cliente não informado';
      const lojaNome = venda.nome_loja || 'Loja não informada';
      
      // Lista de IDs de pagamentos e anexos processados
      const processedPaymentIds: string[] = [];
      const processedAttachmentIds: string[] = [];
      
      // Criar registro na tabela sales_records
      await db.sales_records.create({
        data: {
          id: recordId,
          userId,
          externalId: vendaId,
          code: codigo,
          date: data,
          totalAmount: valorTotal,
          netAmount: valorTotal,
          status,
          customerName: clienteNome,
          storeName: lojaNome,
          source: 'GESTAO_CLICK',
          metadata: {
            ...venda,
            processedPaymentIds,
            processedAttachmentIds
          },
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      
      // Processar pagamentos, se existirem
      if (pagamentos.length > 0) {
        for (const pagamento of pagamentos) {
          const pagamentoId = pagamento.id?.toString();
          
          // Criar um registro relacionado a esta venda para o pagamento
          await criarRegistroPagamento(recordId, userId, pagamento, venda);
          
          // Adicionar o ID do pagamento aos processados
          if (pagamentoId) {
            processedPaymentIds.push(pagamentoId);
          }
        }
        
        // Atualizar a metadata da venda com os pagamentos processados
        await db.sales_records.update({
          where: { id: recordId },
          data: {
            metadata: {
              ...venda,
              processedPaymentIds,
              processedAttachmentIds
            }
          }
        });
      }
      
      // Processar anexos, se existirem
      if (anexos.length > 0) {
        console.log(`[DEBUG] Processando ${anexos.length} anexos para a venda ${vendaId}`);
        
        for (const anexo of anexos) {
          const anexoId = anexo.id?.toString();
          
          // Criar um registro relacionado a esta venda para o anexo
          await criarRegistroAnexo(recordId, userId, anexo, venda);
          
          // Adicionar o ID do anexo aos processados
          if (anexoId) {
            processedAttachmentIds.push(anexoId);
          }
        }
        
        // Atualizar a metadata da venda com os anexos processados
        await db.sales_records.update({
          where: { id: recordId },
          data: {
            metadata: {
              ...venda,
              processedPaymentIds,
              processedAttachmentIds
            }
          }
        });
      } else {
        // Se não houver pagamentos e a venda tiver parcelas, criar registros padrão
        if (venda.numero_parcelas && parseInt(venda.numero_parcelas) > 0) {
          const numParcelas = parseInt(venda.numero_parcelas);
          const valorParcela = valorTotal / numParcelas;
          const dataBase = venda.data_primeira_parcela 
            ? new Date(venda.data_primeira_parcela) 
            : new Date(venda.data);
          
          for (let i = 1; i <= numParcelas; i++) {
            // Calcular data da parcela
            const dataParcela = new Date(dataBase);
            if (i > 1 && venda.intervalo_dias) {
              dataParcela.setDate(dataParcela.getDate() + (i - 1) * parseInt(venda.intervalo_dias));
            }
            
            // ID único para a parcela
            const parcelaId = `inst_${Date.now()}_${i}_${Math.floor(Math.random() * 10000)}`;
            
            // Criar registro na tabela installments
            await db.installments.create({
              data: {
                id: parcelaId,
                salesRecordId: recordId,
                userId,
                number: i,
                amount: valorParcela,
                dueDate: dataParcela,
                status: 'PENDING',
                createdAt: new Date(),
                updatedAt: new Date()
              }
            });
          }
        }
      }
      
      result.imported++;
      console.log(`[DEBUG] Venda ${vendaId} importada com sucesso como ${recordId}`);
      
      // Adicionar aos detalhes
      result.details.push({
        id: vendaId,
        codigo,
        cliente: clienteNome,
        valor: valorTotal,
        status: 'imported'
      });
    } catch (error) {
      console.error(`[ERROR] Erro ao importar venda ${venda.id}:`, error);
      result.errors++;
      
      // Adicionar erro aos detalhes
      result.details.push({
        id: venda.id,
        codigo: venda.codigo,
        cliente: venda.nome_cliente,
        valor: venda.valor_total,
        status: 'error',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  return result;
}

/**
 * Função auxiliar para criar um registro de pagamento
 */
async function criarRegistroPagamento(
  salesRecordId: string, 
  userId: string, 
  pagamento: any, 
  venda: any
) {
  // Criar um ID único para o pagamento
  const pagamentoId = `pmt_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
  
  // Extrair dados do pagamento
  const valorPagamento = parseFloat(pagamento.valor) || 0;
  const dataPagamento = pagamento.dataPagamento || pagamento.data_pagamento || pagamento.data;
  const status = pagamento.status?.toUpperCase() === 'PAGO' ? 'CLEARED' : 'PENDING';
  const formaPagamento = pagamento.formaPagamento || pagamento.forma_pagamento || 'Outros';
  
  // Criar registro na tabela installments para este pagamento
  await db.installments.create({
    data: {
      id: pagamentoId,
      salesRecordId,
      userId,
      externalId: pagamento.id?.toString(),
      number: pagamento.numero || 1,
      amount: valorPagamento,
      dueDate: dataPagamento ? new Date(dataPagamento) : new Date(),
      status,
      // Armazenar o método de pagamento nos metadados em vez de usar um campo inexistente
      metadata: {
        ...pagamento,
        vendaId: venda.id,
        formaPagamento: formaPagamento
      },
      createdAt: new Date(),
      updatedAt: new Date()
    }
  });
  
  console.log(`[DEBUG] Pagamento ${pagamento.id} da venda ${venda.id} processado com sucesso como ${pagamentoId}`);
  
  return pagamentoId;
}

/**
 * Função auxiliar para criar um registro de anexo
 */
async function criarRegistroAnexo(
  salesRecordId: string,
  userId: string,
  anexo: any,
  venda: any
) {
  try {
    // Criar um ID único para o anexo
    const anexoId = `att_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    
    // Extrair dados do anexo
    const nomeArquivo = anexo.nome || anexo.descricao || `Anexo-${Date.now()}`;
    const urlArquivo = anexo.url || anexo.urlArquivo || '';
    const tipoArquivo = anexo.tipo || anexo.mimeType || 'application/octet-stream';
    const tamanhoArquivo = anexo.tamanho || 0;
    
    // Buscar uma transação associada a esta venda para vincular o anexo
    const transacaoAssociada = await db.sales_transaction.findFirst({
      where: {
        salesRecordId
      },
      select: {
        transactionId: true
      }
    });
    
    if (!transacaoAssociada) {
      console.log(`[DEBUG] Nenhuma transação associada à venda ${salesRecordId} para vincular anexo. Criando uma transação temporária.`);
      
      // Criar uma transação virtual apenas para registrar o anexo
      const transactionId = `tx_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
      
      // Criar transação temporária
      await db.transaction.create({
        data: {
          id: transactionId,
          userId,
          name: `Anexo de venda (${venda.codigo || venda.id})`,
          amount: 0,
          date: new Date(),
          type: 'INCOME',
          status: 'PENDING',
          walletId: 'gestao-click-global', // Usar a carteira global do Gestão Click
          paymentMethod: 'OTHER', // Método de pagamento padrão
          category: 'OTHER', // Categoria padrão
          metadata: {
            source: 'GESTAO_CLICK',
            isAttachmentHolder: true,
            salesRecordId,
            anexoId: anexo.id
          },
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      
      // Associar a transação à venda
      try {
        await db.sales_transaction.create({
          data: {
            salesRecordId,
            transactionId,
            createdAt: new Date()
          }
        });
      } catch (error) {
        console.warn(`[WARN] Erro ao associar transação temporária à venda: ${error}`);
      }
      
      // Criar o anexo vinculado à transação temporária
      await db.attachment.create({
        data: {
          id: anexoId,
          userId,
          transactionId,
          name: nomeArquivo,
          fileKey: anexo.id?.toString() || `gc-anexo-${Date.now()}`,
          fileUrl: urlArquivo,
          fileType: tipoArquivo,
          fileSize: tamanhoArquivo,
          metadata: {
            ...anexo,
            vendaId: venda.id,
            salesRecordId
          },
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
    } else {
      // Usar a transação existente para vincular o anexo
      const transactionId = transacaoAssociada.transactionId;
      
      // Criar o anexo na tabela de anexos
      await db.attachment.create({
        data: {
          id: anexoId,
          userId,
          transactionId,
          name: nomeArquivo,
          fileKey: anexo.id?.toString() || `gc-anexo-${Date.now()}`,
          fileUrl: urlArquivo,
          fileType: tipoArquivo,
          fileSize: tamanhoArquivo,
          metadata: {
            ...anexo,
            vendaId: venda.id,
            salesRecordId
          },
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      
      console.log(`[DEBUG] Anexo vinculado à transação existente ${transactionId}`);
    }
    
    console.log(`[DEBUG] Anexo ${anexo.id} da venda ${venda.id} processado com sucesso como ${anexoId}`);
    
    return anexoId;
  } catch (error) {
    console.error(`[ERROR] Erro ao criar registro de anexo: ${error}`);
    throw error;
  }
}
