import { NextResponse } from "next/server";
import { BBIntegrationService } from "@/app/_lib/bb-integration";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/_lib/auth-options";
import { prisma } from "@/app/_lib/prisma";
import { Transaction, TransactionCategory, TransactionType } from "@prisma/client";
import { getBankCredentials } from "@/app/_lib/bank-utils";
import { getBalance } from "@/app/_lib/bb-integration/account";
import { limitarDataFutura, normalizarPeriodo, formatarData, formatarDataInterna } from "@/app/_lib/bb-integration/utils";
import { shouldHideTransaction, mascaraCpfCnpj } from "@/app/_utils/transaction-utils";
import logger from "@/app/_lib/logger";
import { existsSync } from "fs";
import { getCertPathsForWallet } from "@/app/_lib/bb-integration/certificates";
import { hashString } from "@/app/_utils/hash-utils";

// Definir enum para Banco do Brasil
enum BankIntegrationProvider {
  BANCO_DO_BRASIL = "banco-do-brasil"
}

// Interface para dados da transação extraídos da API do Banco do Brasil
interface BancoDoBrasilTransactionData {
  dataLancamento: number;
  dataMovimento: number;
  indicadorSinalLancamento: string;
  indicadorTipoLancamento?: string;
  textoInformacaoComplementar: string;
  valorLancamento: number;
  textoDescricaoHistorico: string;
  codigoHistorico: number;
  numeroLote: number;
  numeroDocumento: number;
  numeroCpfCnpjContrapartida: number;
  indicadorTipoPessoaContrapartida: string;
  codigoBancoContrapartida: number;
  codigoAgenciaContrapartida: number;
  numeroContaContrapartida: string;
  textoDvContaContrapartida: string;
}

// Função para formatar datas no formato DDMMAAAA com zeros à esquerda para uso interno
function formatarDataDDMMAAAA(data: Date): string {
  return formatarDataInterna(data);
}

// A função normalizarPeriodo já está sendo importada no topo do arquivo
// import { limitarDataFutura, normalizarPeriodo, formatarData } from "@/app/_lib/bb-integration/utils";

export async function POST(
  request: Request,
  { params }: { params: { walletId: string } }
) {
  // Variável para contar transações criadas
  let transactionCount = 0;

  try {
    logger.info(`Iniciando sincronização para carteira: ${params.walletId}`);
    
    // Verificar autenticação do usuário usando getServerSession
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      logger.warn("Usuário não autenticado");
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    // Obter a carteira pelo ID
    const wallet = await prisma.wallet.findUnique({
      where: {
        id: params.walletId,
        userId: session.user.id,
      }
    });

    if (!wallet) {
      logger.warn("Carteira não encontrada");
      return NextResponse.json(
        { error: "Carteira não encontrada" },
        { status: 404 }
      );
    }

    // Obter metadados da carteira
    const walletMetadata = wallet.metadata as Record<string, any> || {};
    
    // Verificar se é uma carteira integrada com banco
    if (wallet.type !== "BANK_INTEGRATION") {
      logger.warn("Esta carteira não possui integração bancária");
      return NextResponse.json(
        { error: "Esta carteira não possui integração bancária" },
        { status: 400 }
      );
    }
    
    // Verificar se a carteira tem as credenciais necessárias
    if (!walletMetadata.clientBasic || !walletMetadata.applicationKey) {
      logger.warn("Credenciais bancárias não encontradas para esta carteira");
      return NextResponse.json(
        { error: "Credenciais bancárias não configuradas" },
        { status: 400 }
      );
    }

    // Obter detalhes da conta da carteira
    const agencia = walletMetadata.agencia;
    const conta = walletMetadata.conta;

    if (!agencia || !conta) {
      logger.warn("Dados de agência ou conta não encontrados");
      return NextResponse.json(
        { error: "Dados de agência ou conta não encontrados" },
        { status: 400 }
      );
    }

    console.log("[SYNC] Dados de conexão:", {
      agencia,
      conta,
      bankId: wallet.bankId,
    });

    let transactions: Transaction[] = [];
    let updatedWallet = wallet;

    // Buscar o banco para verificar seu provider
    const bank = await prisma.bank.findUnique({
      where: { id: wallet.bankId || '' }
    });

    console.log("[SYNC] Banco identificado:", {
      id: bank?.id,
      name: bank?.name,
      provider: bank?.name?.toLowerCase().includes('brasil') ? 'banco-do-brasil' : 'outro'
    });

    // Sincronização com o banco do Brasil - verificando pelo nome do banco ao invés do ID
    const isBancoDoBrasil = bank?.name?.toLowerCase().includes('brasil');
    
    if (isBancoDoBrasil) {
      try {
        console.log("[SYNC] Iniciando sincronização com o Banco do Brasil");
        
        // Verificar se os certificados existem
        const certPaths = getCertPathsForWallet(process.cwd(), "certs/"+params.walletId);
        const certExists = existsSync(certPaths.cert);
        const keyExists = existsSync(certPaths.key);
        const caExists = existsSync(certPaths.ca);
        
        
        if (!certExists || !keyExists || !caExists) {
          logger.error("Certificados não encontrados. Por favor, forneça os certificados necessários.");
          return NextResponse.json(
            { error: "Certificados não encontrados. Por favor, forneça os certificados necessários." },
            { status: 400 }
          );
        }
        
        logger.info("Certificados verificados com sucesso");

        // Verificar se existem transações desta carteira no banco de dados
        const existingTransactions = await prisma.transaction.findFirst({
          where: {
            walletId: wallet.id,
          },
        });

        // Adicionar log para verificar se existem transações
        console.log("[SYNC_DEBUG] Verificação de transações existentes:", {
          walletId: wallet.id,
          existingTransactions: existingTransactions ? "Sim" : "Não"
        });

        // Obter datas para o período de sincronização
      const dataAtual = new Date();
        
        // Verificar se o ano está correto (para evitar erros com datas futuras)
        const anoAtual = dataAtual.getFullYear();
        if (dataAtual.getFullYear() > 2030) {
          console.warn("[SYNC] Ano detectado está muito no futuro. Forçando ano atual:", anoAtual);
          // Ajustar a data para o ano atual
          dataAtual.setFullYear(new Date().getFullYear());
        }
      
      // Formatar datas para o formato DDMMAAAA - com zero à esquerda para dias 1-9
        let dataInicio: string;
        let dataFim: string;
        
        if (!existingTransactions) {
          // Se não existem transações, pegar o mês completo
          console.log("[SYNC] Nenhuma transação encontrada para esta carteira. Importando dados do mês completo.");
          
          // Primeiro dia do mês atual
          const primeiroDiaMes = new Date(dataAtual.getFullYear(), dataAtual.getMonth(), 1);
          // Último dia do mês atual (que será limitado à data atual pela função normalizarPeriodo)
          const ultimoDiaMes = new Date(dataAtual.getFullYear(), dataAtual.getMonth() + 1, 0);
          
          // Normalizar o período para não pegar datas no futuro
          const { dataInicio: dataInicioNormalizada, dataFim: dataFimNormalizada } = 
            normalizarPeriodo(primeiroDiaMes, ultimoDiaMes);
          
          console.log("[SYNC] Período normalizado:", {
            original: {
              primeiroDiaMes: primeiroDiaMes.toISOString(),
              ultimoDiaMes: ultimoDiaMes.toISOString(),
            },
            normalizado: {
              dataInicio: dataInicioNormalizada.toISOString(),
              dataFim: dataFimNormalizada.toISOString(),
            }
          });
          
          // Converter para formato exigido pelo BB (DDMMAAAA)
          const diaInicio = dataInicioNormalizada.getDate().toString(); // Sem padStart para dias
          const mesInicio = (dataInicioNormalizada.getMonth() + 1).toString().padStart(2, '0');
          const anoInicio = dataInicioNormalizada.getFullYear().toString();
          
          const diaFim = dataFimNormalizada.getDate().toString(); // Sem padStart para dias
          const mesFim = (dataFimNormalizada.getMonth() + 1).toString().padStart(2, '0');
          const anoFim = dataFimNormalizada.getFullYear().toString();
          
          // Usar a função formatarData (sem zero à esquerda) para a API do BB
          dataInicio = formatarData(dataInicioNormalizada);
          dataFim = formatarData(dataFimNormalizada);
          
          // Log para mostrar as datas formatadas que serão usadas na API
          console.log("[SYNC] Formato de datas para API do BB:", {
            dataInicio, 
            dataFim,
            formatoAPI: "Sem zero à esquerda para dias 1-9"
          });
        } else {
          // Se já existem transações, buscar apenas as novas (de hoje)
          console.log("[SYNC] Transações existentes encontradas. Sincronizando apenas dados novos.");
          
          // Limitar a data atual para não tentar consultar o futuro
          const dataLimitada = limitarDataFutura(dataAtual);
          
          const dia = dataLimitada.getDate().toString(); // Sem padStart para dias
          const mes = (dataLimitada.getMonth() + 1).toString().padStart(2, '0');
          const ano = dataLimitada.getFullYear().toString();
          
          // Garantir que usamos apenas os 4 dígitos do ano
          dataInicio = `${dia}${mes}${ano.slice(-4)}`;
          dataFim = dataInicio; // Mesmo dia para início e fim
          
          console.log("[SYNC] Período de sincronização (apenas hoje):", { 
            dataInicio, 
            dataFim,
            data: dataLimitada.toISOString(),
            formatoData: "ddMMyyyy",
          });
        }

      // Obter credenciais completas do banco de dados usando a função especializada
      const credentials = await getBankCredentials(params.walletId);
      
      // Log detalhado das credenciais encontradas para diagnóstico
      console.log("[SYNC] Credenciais recuperadas:", {
        hasApplicationKey: !!credentials?.applicationKey,
        hasClientBasic: !!credentials?.clientBasic,
        hasClientId: !!credentials?.clientId,
        hasClientSecret: !!credentials?.clientSecret,
        hasAgencia: !!credentials?.agencia,
        hasConta: !!credentials?.conta
      });
      
      // Verificar se temos todas as credenciais necessárias
      if (!credentials || !credentials.applicationKey || !credentials.clientBasic) {
        console.error("[SYNC] Credenciais incompletas:", {
          applicationKey: !!credentials?.applicationKey,
          clientBasic: !!credentials?.clientBasic
        });
        
        return NextResponse.json(
          { 
            success: false, 
            message: "Credenciais incompletas. Reconecte sua conta bancária." 
          },
          { status: 400 }
        );
      }
      
        // Instanciar o serviço BB
        const bbService = BBIntegrationService.getInstance();
        
        // Obter um token OAuth válido
        console.log("[SYNC] Obtendo token OAuth autenticado...");
        let token;
        try {
          // Importar função getAuthToken
          const { getAuthToken } = await import('@/app/_lib/bb-integration/auth');
          
          // Obter token autenticado usando as credenciais completas do banco de dados
          token = await getAuthToken({
            applicationKey: credentials.applicationKey,
            clientBasic: credentials.clientBasic,
            clientId: credentials.clientId,
            clientSecret: credentials.clientSecret,
            apiUrl: credentials.apiUrl || "https://api-extratos.bb.com.br",
            agencia: credentials.agencia || agencia,
            conta: credentials.conta || conta,
            certPaths: await bbService.getCertificatePaths(params.walletId)
          });
          
          console.log("[SYNC] Token OAuth obtido com sucesso");
        } catch (tokenError: any) {
          console.error("[SYNC] Falha ao obter token OAuth:", tokenError);
          
          // Falhar graciosamente
          return NextResponse.json(
            { 
              success: false, 
              message: "Falha na autenticação com o banco. Verifique suas credenciais.",
              error: tokenError.message
            },
            { status: 401 }
          );
        }
        
        // Tentar obter o saldo atual diretamente da API do Banco do Brasil
        let saldoAtual: number | null = null;
        try {
          saldoAtual = await getBalance(
            agencia,
            conta,
            token,
            credentials.applicationKey,
            params.walletId
          );
          console.log("[SYNC] Saldo atual obtido da API:", saldoAtual);
        } catch (balanceError) {
          console.error("[SYNC] Erro ao obter saldo atual:", balanceError);
          console.log("[SYNC] Usando método alternativo para calcular o saldo (baseado em transações)");
          // O endpoint de saldo pode não estar disponível, então usaremos sempre o método alternativo
          saldoAtual = null;
        }
        
        // Obter extrato com período especificado
        const extract = await bbService.getExtract(
          agencia,
          conta,
          token,
          credentials.applicationKey,
          {
            dataInicio: dataInicio,
            dataFim: dataFim,
            numeroPagina: 1,
            quantidadeRegistros: 200, // Valor máximo conforme API
            walletId: params.walletId, // Adicionar o ID da carteira para usar certificados específicos
            useDatasJaFormatadas: true,
            dataInicioOriginal: dataInicio,
            dataFimOriginal: dataFim
          }
        );
        
        // Adicionar log para verificar o extrato recebido
        console.log("[SYNC_DEBUG] Extrato recebido:", {
          temExtrato: extract ? "Sim" : "Não",
          temListaLancamento: extract?.listaLancamento ? "Sim" : "Não",
          quantidadeLancamentos: extract?.listaLancamento?.length || 0
        });
        
        // Processar extrato para extrair saldo e transações reais
        let saldoAtualExtrato: number | null = null;
        if (extract.listaLancamento?.length > 0) {
          // Procurar registros de saldo para atualizar o saldo da carteira
          const registroSaldoAtual = extract.listaLancamento.find(
            item => item.textoDescricaoHistorico === "Saldo Atual"
          );
          const registroSaldoDisponivel = extract.listaLancamento.find(
            item => item.textoDescricaoHistorico === "Saldo Disponivel"
          );
          const registroSaldoComum = extract.listaLancamento.find(
            item => item.textoDescricaoHistorico === "S A L D O"
          );
          
          // Priorizar Saldo Atual, depois Saldo Disponível, depois S A L D O
          if (registroSaldoAtual) {
            saldoAtualExtrato = registroSaldoAtual.valorLancamento || 0;
            console.log("[SYNC] Saldo atual encontrado no extrato:", saldoAtualExtrato);
          } else if (registroSaldoDisponivel) {
            saldoAtualExtrato = registroSaldoDisponivel.valorLancamento || 0;
            console.log("[SYNC] Saldo disponível encontrado no extrato:", saldoAtualExtrato);
          } else if (registroSaldoComum) {
            saldoAtualExtrato = registroSaldoComum.valorLancamento || 0;
            console.log("[SYNC] Saldo comum encontrado no extrato:", saldoAtualExtrato);
          }
          
          // Se encontramos saldo no extrato e não tínhamos saldo da API, usar o do extrato
          if (saldoAtualExtrato !== null && saldoAtual === null) {
            saldoAtual = saldoAtualExtrato;
            console.log("[SYNC] Usando saldo encontrado no extrato:", saldoAtual);
          }
          
          // Filtrar transações reais, ignorando registros de saldo
          const transacoesReais = extract.listaLancamento.filter(item => {
            // Ignorar os registros de saldo
            const descricaoItem = extrairDescricao(item);
            return !shouldHideTransaction(descricaoItem);
          });
          
          console.log("[SYNC] Transações reais filtradas:", {
            totalRegistros: extract.listaLancamento.length,
            transacoesReais: transacoesReais.length
          });
          
          // Função auxiliar para extrair os valores corretamente da estrutura da API
          function extrairDadosTransacao(item: any): BancoDoBrasilTransactionData {
            // Verificar se os dados estão no objeto principal ou em lancamentoContaCorrenteCliente
            return {
              // Valores do objeto principal ou da estrutura aninhada
              dataLancamento: item.dataLancamento,
              dataMovimento: item.dataMovimento,
              indicadorSinalLancamento: item.indicadorSinalLancamento,
              indicadorTipoLancamento: item.indicadorTipoLancamento,
              textoInformacaoComplementar: item.textoInformacaoComplementar || "",
              valorLancamento: item.lancamentoContaCorrenteCliente?.valorLancamentoRemessa || item.valorLancamento,
              textoDescricaoHistorico: item.lancamentoContaCorrenteCliente?.nomeTipoOperacao || item.textoDescricaoHistorico || "",
              codigoHistorico: item.lancamentoContaCorrenteCliente?.codigoHistorico || item.codigoHistorico || 0,
              numeroLote: item.numeroLote || 0,
              numeroDocumento: item.numeroDocumento || 0,
              numeroCpfCnpjContrapartida: item.numeroCpfCnpjContrapartida || 0,
              indicadorTipoPessoaContrapartida: item.indicadorTipoPessoaContrapartida || "",
              codigoBancoContrapartida: item.codigoBancoContrapartida || 0,
              codigoAgenciaContrapartida: item.codigoAgenciaContrapartida || 0,
              numeroContaContrapartida: item.numeroContaContrapartida || "",
              textoDvContaContrapartida: item.textoDvContaContrapartida || ""
            };
          }
          
          // Função auxiliar para extrair descrição
          function extrairDescricao(item: any): string {
            return item.lancamentoContaCorrenteCliente?.nomeTipoOperacao || 
                   item.textoDescricaoHistorico || 
                   "";
          }
          
          // Gerar IDs externos para verificar duplicatas
          const externalIds = transacoesReais.map(item => {
            const dados = extrairDadosTransacao(item);
            // Usar dataLancamento se dataMovimento for 0
            const dataParaId = dados.dataMovimento > 0 ? dados.dataMovimento : dados.dataLancamento;
            // Formatar a data para garantir o formato correto com zero à esquerda
            let dataFormatada = dataParaId.toString();
            if (dataFormatada.length === 7) {
              dataFormatada = '0' + dataFormatada;
            }

            // Usar um hash da descrição e valor em vez de usar Date.now() que muda a cada sincronização
            const descricaoHash = hashString(
              (dados.textoDescricaoHistorico || '') + 
              (dados.textoInformacaoComplementar || '') + 
              (dados.valorLancamento?.toString() || '0')
            );
            
            const externalId = `bb-${wallet.id}-${dataFormatada}-${dados.numeroDocumento || '0'}-${dados.numeroLote || '0'}-${descricaoHash}`;
            return externalId;
          });
          
          // Verificar quais transações já existem no banco
          const existingExternalIds = await prisma.transaction.findMany({
            where: {
              externalId: {
                in: externalIds,
              },
              walletId: wallet.id,
            },
            select: {
              externalId: true,
            },
          });
          
          console.log("[SYNC] Verificação de duplicatas:", {
            totalTransacoes: transacoesReais.length,
            idsPotencialmenteDuplicados: externalIds.length,
            idsExistentes: existingExternalIds.length,
          });
          
          // Criar set para verificação rápida
          const existingExternalIdSet = new Set(existingExternalIds.map(t => t.externalId));
          
          // Filtrar apenas transações novas
          const newTransactionsData = transacoesReais
            .filter(item => {
              const dados = extrairDadosTransacao(item);
              // Usar dataLancamento se dataMovimento for 0
              const dataParaId = dados.dataMovimento > 0 ? dados.dataMovimento : dados.dataLancamento;
              const externalId = `bb-${wallet.id}-${dataParaId}-${dados.numeroDocumento || Date.now()}`;
              return !existingExternalIdSet.has(externalId);
            })
            .map((item: any) => {
              // Extrair os dados da estrutura correta
              const dados = extrairDadosTransacao(item);
              
              // Função auxiliar para enriquecer descrições com informações complementares
              function enrichDescription(description: string, complementInfo: string): string {
                // Se não houver info complementar, retornar apenas a descrição
                if (!complementInfo) return description;
                
                // Evitar informação duplicada
                if (description.includes(complementInfo)) return description;
                
                // Concatenar apenas se a informação agregar valor
                if (complementInfo.length > 3) {
                  return `${description} - ${complementInfo}`;
                }
                
                return description;
              }
              
              // Obter o texto de descrição da transação
              let description = "";
              if (dados.textoDescricaoHistorico && dados.textoInformacaoComplementar) {
                description = `${dados.textoDescricaoHistorico} - ${dados.textoInformacaoComplementar}`.trim();
              } else if (dados.textoDescricaoHistorico) {
                description = dados.textoDescricaoHistorico.trim();
              } else if (dados.textoInformacaoComplementar) {
                description = dados.textoInformacaoComplementar.trim();
              } else {
                description = "Transação Bancária";
              }
              
              // Obter informações complementares se disponíveis
              const complementInfo = dados.textoInformacaoComplementar || "";
              
              // Obter informações de contraparte para enriquecer os metadados
              const contrapartida = {
                cpfCnpj: dados.numeroCpfCnpjContrapartida || null,
                tipoPessoa: dados.indicadorTipoPessoaContrapartida || null,
                banco: dados.codigoBancoContrapartida || null,
                agencia: dados.codigoAgenciaContrapartida || null,
                conta: dados.numeroContaContrapartida || null,
                dv: dados.textoDvContaContrapartida || null
              };
              
              // Obter o código de histórico para ajudar na categorização
              const codigoHistorico = dados.codigoHistorico || 0;
              
              // Converter data do formato DDMMAAAA para Date
              // Usar dataLancamento se dataMovimento for 0
              let date: Date;
              try {
                const dateValue = (dados.dataMovimento > 0 ? dados.dataMovimento : dados.dataLancamento);
                let dateStr = dateValue.toString();
                
                // Garantir que a string tenha 8 dígitos (formato DDMMAAAA)
                if (dateStr.length < 8) {
                  // Tentar corrigir formatos como 5032025 para 05032025
                  if (dateStr.length === 7) {
                    dateStr = '0' + dateStr;
                    logger.info(`Corrigindo formato de data: ${dateValue} -> ${dateStr}`);
                  } else {
                    logger.warn(`Formato de data inválido: ${dateStr}, deve ter 8 dígitos`);
                    date = new Date();
                    throw new Error("Formato de data inválido");
                  }
                }
                
                // Extrair dia, mês e ano
                const day = parseInt(dateStr.substring(0, 2));
                const month = parseInt(dateStr.substring(2, 4)) - 1; // Meses em JS são 0-11
                const year = parseInt(dateStr.substring(4, 8));
                
                // Verificar se temos uma data válida
                if (isNaN(day) || isNaN(month) || isNaN(year) || 
                    day < 1 || day > 31 || month < 0 || month > 11 || year < 2020 || year > 2050) {
                  logger.warn(`Data inválida: ${dateStr}, componentes: dia=${day}, mês=${month+1}, ano=${year}`);
                  date = new Date();
                } else {
                  date = new Date(year, month, day);
                  // Para registro usar a versão formatada com zero à esquerda no log
                  const dataFormatadaComZero = formatarDataInterna(date);
                  logger.info(`Data processada com sucesso: ${dateStr} -> ${date.toISOString()} (formato banco: ${dataFormatadaComZero})`);
                }
              } catch (error: any) {
                logger.warn(`Erro ao processar data, usando data atual: ${error.message}`);
                date = new Date();
              }
              
              // Determinar se é entrada ou saída - garantir que o valor seja verificado corretamente
              const isDebit = dados.indicadorSinalLancamento === "D" || 
                             (dados.indicadorTipoLancamento === "D") ||
                             (description.toLowerCase().includes("debito")) ||
                             (codigoHistorico === 1 || codigoHistorico === 2);

              console.log("[SYNC_DEBUG] Determinação débito/crédito:", {
                descricao: description,
                indicadorSinal: dados.indicadorSinalLancamento,
                indicadorTipo: dados.indicadorTipoLancamento,
                codigoHistorico: codigoHistorico,
                resultadoIsDebit: isDebit
              });
              
              // Função para sugerir categoria com base no texto da descrição e código histórico
              function suggestCategory(descricaoTx: string, codigoHistorico: number, isDebit: boolean, complementInfo: string): TransactionCategory {
                // Normalizar texto para facilitar a busca de padrões
                const textoNormalizado = (descricaoTx + " " + complementInfo)
                  .toLowerCase()
                  .normalize("NFD")
                  .replace(/[\u0300-\u036f]/g, "");

                // Se for crédito (entrada de dinheiro)
                if (!isDebit) {
                  if (textoNormalizado.includes("venda") || textoNormalizado.includes("balcao")) {
                    return TransactionCategory.VENDAS_BALCAO;
                  }
                  
                  if (textoNormalizado.includes("produto") || textoNormalizado.includes("recebimento")) {
                    return TransactionCategory.VENDAS_PRODUTOS;
                  }
                  
                  if (textoNormalizado.includes("delivery") || textoNormalizado.includes("entrega")) {
                    return TransactionCategory.DELIVERY;
                  }
                  
                  // Padrão para entradas
                  return TransactionCategory.OTHER;
                }
                
                // Para saídas (débito)
                if (textoNormalizado.includes("energia") || textoNormalizado.includes("agua") || textoNormalizado.includes("luz")) {
                  return TransactionCategory.ENERGIA_AGUA;
                }
                
                if (textoNormalizado.includes("internet") || textoNormalizado.includes("telecom") || textoNormalizado.includes("telefo")) {
                  return TransactionCategory.TELEFONIA_INTERNET;
                }
                
                if (textoNormalizado.includes("compra")) {
                  return TransactionCategory.COMPRAS;
                }
                
                if (textoNormalizado.includes("manutencao") || textoNormalizado.includes("conserto") || textoNormalizado.includes("reparo")) {
                  return TransactionCategory.MANUTENCAO_EQUIPAMENTOS;
                }
                
                if (textoNormalizado.includes("estoque") || textoNormalizado.includes("reposicao")) {
                  return TransactionCategory.REPOSICAO_ESTOQUE;
                }
                
                if (textoNormalizado.includes("equipamento") || textoNormalizado.includes("aquisicao")) {
                  return TransactionCategory.AQUISICAO_EQUIPAMENTOS;
                }
                
                if (textoNormalizado.includes("reforma") || textoNormalizado.includes("obra")) {
                  return TransactionCategory.MATERIAL_REFORMA;
                }
                
                if (textoNormalizado.includes("escritorio") || textoNormalizado.includes("papelaria")) {
                  return TransactionCategory.MATERIAL_ESCRITORIO;
                }
                
                if (textoNormalizado.includes("marketing") || textoNormalizado.includes("publicidade") || textoNormalizado.includes("divulgacao")) {
                  return TransactionCategory.MARKETING_PUBLICIDADE;
                }
                
                if (textoNormalizado.includes("transporte") || textoNormalizado.includes("frete") || textoNormalizado.includes("transportadora")) {
                  return TransactionCategory.TRANSPORTADORA;
                }
                
                if (textoNormalizado.includes("contabilidade") || textoNormalizado.includes("contador")) {
                  return TransactionCategory.CONTABILIDADE;
                }

                if (textoNormalizado.includes("funcionario") || textoNormalizado.includes("salario") || textoNormalizado.includes("remuneracao")) {
                  return TransactionCategory.REMUNERACAO_FUNCIONARIOS;
                }
                
                if (textoNormalizado.includes("fgts")) {
                  return TransactionCategory.ENCARGOS_FGTS;
                }
                
                if (textoNormalizado.includes("inss")) {
                  return TransactionCategory.ENCARGOS_INSS;
                }
                
                if (textoNormalizado.includes("alimentacao") || textoNormalizado.includes("refeicao")) {
                  return TransactionCategory.ENCARGOS_ALIMENTACAO;
                }
                
                if (textoNormalizado.includes("transporte") && textoNormalizado.includes("vale")) {
                  return TransactionCategory.ENCARGOS_VALE_TRANSPORTE;
                }
                
                if (textoNormalizado.includes("13") || textoNormalizado.includes("decimo terceiro")) {
                  return TransactionCategory.ENCARGOS_13_SALARIO;
                }
                
                if (textoNormalizado.includes("14") || textoNormalizado.includes("decimo quarto")) {
                  return TransactionCategory.ENCARGOS_14_SALARIO;
                }
                
                if (textoNormalizado.includes("rescis")) {
                  return TransactionCategory.ENCARGOS_RESCISOES;
                }
                
                if (textoNormalizado.includes("exame") || textoNormalizado.includes("medico")) {
                  return TransactionCategory.ENCARGOS_EXAMES;
                }
                
                if (textoNormalizado.includes("ferias")) {
                  return TransactionCategory.FERIAS;
                }
                
                if (textoNormalizado.includes("troco")) {
                  return TransactionCategory.TROCO;
                }
                
                // Códigos de histórico do Banco do Brasil
                // Alguns códigos são conhecidos e podem ajudar a categorizar melhor
                switch (codigoHistorico) {
                  case 459: // PIX TRANSF ENVIADA
                  case 457: // TED ENVIADA
                  case 74:  // DOC ENVIADO
                    return TransactionCategory.COMPRAS; // Usamos COMPRAS como alternativa
                  case 76:  // PAGAMENTO DE TÍTULO
                    return TransactionCategory.COMPRAS;
                  case 132: // PAGAMENTO DE FATURA
                    return TransactionCategory.COMPRAS;
                  case 126: // COMPRA COM CARTÃO
                    return TransactionCategory.COMPRAS;
                  case 48:  // IMPOSTO
                    return TransactionCategory.ENCARGOS_INSS; // Usamos ENCARGOS_INSS como alternativa
                  default:
                    // Se for débito e nenhum padrão for reconhecido, usamos a categoria OTHER
                    return TransactionCategory.OTHER;
                }
              }
              
              // Função para determinar o tipo de transação
              function determineTransactionType(descricaoTx: string, codigoHistorico: number, isDebit: boolean): string {
                const desc = descricaoTx.toLowerCase();
                
                if (desc.includes("pix")) {
                  return isDebit ? "PIX_SENT" : "PIX_RECEIVED";
                }
                
                if (desc.includes("ted") || desc.includes("doc") || desc.includes("transferencia")) {
                  return isDebit ? "TRANSFER_SENT" : "TRANSFER_RECEIVED";
                }
                
                if (desc.includes("cartao") || desc.includes("compra") || desc.includes("debito") || desc.includes("credito")) {
                  return "CARD_PAYMENT";
                }
                
                if (desc.includes("saque")) {
                  return "WITHDRAWAL";
                }
                
                if (desc.includes("deposito")) {
                  return "DEPOSIT";
                }
                
                if (desc.includes("salario") || desc.includes("proventos")) {
                  return "SALARY";
                }
                
                if (desc.includes("pagamento")) {
                  return "PAYMENT";
                }
                
                return isDebit ? "EXPENSE" : "INCOME";
              }
              
              // Sugerir categoria com base no texto da descrição e código histórico
              let category = suggestCategory(description, codigoHistorico, isDebit, complementInfo);
              
              // Determinar o tipo de transação com base no código histórico e descrição
              const transactionType = determineTransactionType(description, codigoHistorico, isDebit);
              
              // Converter o tipo de transação para o formato Prisma
              let type: "DEPOSIT" | "EXPENSE" | "INVESTMENT" = "EXPENSE";
              if (transactionType === "INCOME" || transactionType === "SALARY" || 
                  transactionType === "PIX_RECEIVED" || transactionType === "TRANSFER_RECEIVED" || 
                  transactionType === "DEPOSIT") {
                type = "DEPOSIT";
              } else if (transactionType === "INVESTMENT") {
                type = "INVESTMENT";
              }
              
              // Log para debug do tipo de transação
              // console.log("[SYNC_DEBUG] Tipo de transação:", {
              //   descricao: description,
              //   indicadorSinal: dados.indicadorSinalLancamento,
              //   isDebit,
              //   transactionType,
              //   tipoFinal: type
              // });
              
              // Determinar o método de pagamento com base na descrição
              let paymentMethod: "CREDIT_CARD" | "DEBIT_CARD" | "BANK_TRANSFER" | "BANK_SLIP" | "CASH" | "PIX" | "OTHER" = "OTHER";
              
              if (transactionType === "PIX_SENT" || transactionType === "PIX_RECEIVED") {
                paymentMethod = "PIX";
              } else if (transactionType === "TRANSFER_SENT" || transactionType === "TRANSFER_RECEIVED") {
                paymentMethod = "BANK_TRANSFER";
              } else if (transactionType === "CARD_PAYMENT") {
                // Tentar diferenciar entre crédito e débito
                if (description.toLowerCase().includes("credito") || complementInfo.toLowerCase().includes("credito")) {
                  paymentMethod = "CREDIT_CARD";
                } else {
                  paymentMethod = "DEBIT_CARD";
                }
              } else if (transactionType === "BANK_SLIP" || 
                    description.toLowerCase().includes("boleto") || 
                    complementInfo.toLowerCase().includes("boleto")) {
                paymentMethod = "BANK_SLIP";
              } else if (transactionType === "WITHDRAWAL" || description.toLowerCase().includes("saque")) {
                paymentMethod = "CASH";
              }
              
              // Verificar se temos um valor válido para amount
              let amount = 0;
              if (dados.valorLancamento !== undefined && dados.valorLancamento !== null) {
                const rawValue = Number(dados.valorLancamento);
                if (!isNaN(rawValue)) {
                  // Aplicar a regra de sinal para o valor
                  // - Se for débito, garantir que seja negativo
                  // - Se for crédito, garantir que seja positivo
                  if (isDebit) {
                    amount = -Math.abs(rawValue);
                    console.log("[SYNC_DEBUG] Valor ajustado para débito:", { original: rawValue, ajustado: amount });
                  } else {
                    amount = Math.abs(rawValue);
                    console.log("[SYNC_DEBUG] Valor ajustado para crédito:", { original: rawValue, ajustado: amount });
                  }
                } else {
                  logger.warn(`Valor inválido ${dados.valorLancamento}, usando zero como padrão`);
                }
              } else {
                logger.warn(`Valor não definido, usando zero como padrão`);
              }
              
              // Gerar um ID externo único para evitar duplicatas nas importações 
              // Usar dataLancamento se dataMovimento for 0
              const dataParaId = dados.dataMovimento > 0 ? dados.dataMovimento : dados.dataLancamento;
              // Formatar a data para garantir o formato correto com zero à esquerda
              let dataFormatada = dataParaId.toString();
              if (dataFormatada.length === 7) {
                dataFormatada = '0' + dataFormatada;
              }

              // Usar um hash da descrição e valor em vez de usar Date.now() que muda a cada sincronização
              const descricaoHash = hashString(
                (dados.textoDescricaoHistorico || '') + 
                (dados.textoInformacaoComplementar || '') + 
                (dados.valorLancamento?.toString() || '0')
              );
              
              const externalId = `bb-${wallet.id}-${dataFormatada}-${dados.numeroDocumento || '0'}-${dados.numeroLote || '0'}-${descricaoHash}`;
              
              // Criar metadados para a transação, preservando os valores originais
              const metadataTransaction = {
                source: "banco-do-brasil",
                valorOriginal: dados.valorLancamento,
                dataOriginal: dataParaId,
                // Campos essenciais da transação
                indicadorSinalLancamento: dados.indicadorSinalLancamento,
                descricaoOriginal: description,
                complementoOriginal: complementInfo,
                codigoHistorico: dados.codigoHistorico,
                // Outros metadados úteis
                numeroDocumento: dados.numeroDocumento,
                numeroLote: dados.numeroLote,
                // Dados para análise
                tipoCategorizado: transactionType,
                isDebit: isDebit
              };
              
              // Log para debug
              console.log("[SYNC_DEBUG] Processamento de transação:", {
                descricao: description,
                indicadorSinal: dados.indicadorSinalLancamento,
                isDebit: isDebit,
                valorOriginal: dados.valorLancamento,
                dataOriginal: dataParaId,
                dataFormatadaAPI: formatarData(date), // Como seria enviado para API (sem zero)
                dataFormatadaBanco: formatarDataInterna(date) // Como é salvo no banco (com zero)
              });
              
              return {
                name: enrichDescription(description, complementInfo),
                amount: amount, // Usar o valor calculado
                date,
                category: category,
                type: type as TransactionType,
                paymentMethod: paymentMethod,
                metadata: metadataTransaction,
                userId: session.user.id,
                walletId: wallet.id,
                externalId
              };
            });
          
          // Adicionar log para verificar as transações a serem importadas
          console.log("[SYNC_DEBUG] Transações a serem importadas:", {
            total: newTransactionsData.length,
            primeirasTransacoes: newTransactionsData.slice(0, 2).map(t => ({
              name: t.name,
              amount: t.amount,
              date: t.date,
              type: t.type,
              externalId: t.externalId
            }))
          });
          
          if (newTransactionsData.length === 0) {
            console.log("[SYNC] Nenhuma transação nova para importar");
            
            // Atualizar apenas o saldo e metadados da carteira
            const updatedMetadata = {
              ...wallet.metadata as Record<string, any>,
              lastSync: new Date().toISOString(),
              lastSyncStatus: "success",
              lastSyncCount: 0
            };
            
            try {
              // Atualizar carteira em uma única operação
              updatedWallet = await prisma.wallet.update({
                where: { id: wallet.id },
                data: { 
                  balance: saldoAtual !== null ? saldoAtual : wallet.balance,
                  metadata: updatedMetadata
                },
                include: {
                  bank: true
                }
              });
              
              // Log do resumo da sincronização
              console.log("[SYNC] Resumo da sincronização:", {
                carteira: wallet.name,
                id: wallet.id,
                saldoAnterior: wallet.balance,
                saldoNovo: updatedWallet.balance,
                diferenca: updatedWallet.balance - wallet.balance,
                transacoesImportadas: extract.listaLancamento?.length || 0,
                dataInicio,
                dataFim
              });
              
              // Retornar resposta adequada
              return NextResponse.json({
                success: true,
                message: "Carteira sincronizada com sucesso. Não foram encontradas novas transações.",
                wallet: updatedWallet,
                data: {
                  transactionCount: 0,
                  balance: updatedWallet.balance,
                  totalRegistros: extract.listaLancamento.length
                }
              });
            } catch (error) {
              console.error("[SYNC] Erro ao atualizar carteira:", error);
              throw error; // Deixar o tratamento de erro principal lidar com isso
            }
          }
          
          // Chegamos aqui, temos transações novas para importar
          
          try {
            // Adicionar logs detalhados para análise
            console.log("[SYNC_DEBUG] Dados brutos das transações:");
            console.log("===== ANÁLISE DE DADOS =====");
            
            // Exibir estatísticas gerais
            console.log("[SYNC_DEBUG] Estatísticas gerais:", {
              totalTransacoesRecebidas: extract.listaLancamento?.length || 0,
              totalTransacoesReais: transacoesReais?.length || 0,
              totalTransacoesUnicas: newTransactionsData?.length || 0,
            });
            
            // Examinar as primeiras transações brutas
            if (extract.listaLancamento && extract.listaLancamento.length > 0) {
              console.log("[SYNC_DEBUG] Primeira transação bruta da API:", 
                JSON.stringify(extract.listaLancamento[0], null, 2)
              );
            }
            
            // Examinar as transações após filtragem
            if (transacoesReais && transacoesReais.length > 0) {
              console.log("[SYNC_DEBUG] Primeira transação após filtragem:", 
                JSON.stringify(transacoesReais[0], null, 2)
              );
            }
            
            // Examinar as transações mapeadas
            if (newTransactionsData && newTransactionsData.length > 0) {
              console.log("[SYNC_DEBUG] Primeira transação mapeada:", 
                JSON.stringify(newTransactionsData[0], null, 2)
              );
              
              // Verificar problemas específicos
              const transacoesComValoresNaN = newTransactionsData.filter(tx => 
                isNaN(tx.amount)
              ).length;
              
              const transacoesComDatasInvalidas = newTransactionsData.filter(tx => {
                const ano = tx.date.getFullYear();
                return ano < 2010 || ano > 2050;
              }).length;
              
              console.log("[SYNC_DEBUG] Problemas detectados:", {
                transacoesComValoresNaN,
                percentualComValoresNaN: Math.round((transacoesComValoresNaN / newTransactionsData.length) * 100) + "%",
                transacoesComDatasInvalidas,
                percentualComDatasInvalidas: Math.round((transacoesComDatasInvalidas / newTransactionsData.length) * 100) + "%"
              });
              
              // Verificar campo valorLancamento
              const tiposDoValorLancamento = newTransactionsData.reduce((acc: Record<string, number>, tx) => {
                const tipo = tx.metadata && 'valorOriginal' in tx.metadata 
                  ? typeof tx.metadata.valorOriginal 
                  : 'undefined';
                  
                if (!acc[tipo]) {
                  acc[tipo] = 0;
                }
                acc[tipo] += 1;
                return acc;
              }, {} as Record<string, number>);
              
              console.log("[SYNC_DEBUG] Tipos do valorLancamento:", tiposDoValorLancamento);
            }
            
            // Executar a transação para criar as transações no banco de dados
            const result = await prisma.$transaction(async (tx) => {
              // Verificar se há transações para criar
              if (newTransactionsData.length > 0) {
                try {
                  // Verificar se todas as transações têm os campos obrigatórios
                  const transacoesInvalidas = newTransactionsData.filter(tx => 
                    tx.name === undefined || tx.amount === undefined || !tx.date || !tx.type || !tx.userId || !tx.walletId
                  );
                  
                  if (transacoesInvalidas.length > 0) {
                    console.error("[SYNC_ERROR] Transações com dados inválidos:", {
                      total: transacoesInvalidas.length,
                      exemplos: transacoesInvalidas.slice(0, 2)
                    });
                    
                    // Filtrar apenas transações válidas
                    const transacoesValidas = newTransactionsData.filter(tx => 
                      tx.name !== undefined && tx.amount !== undefined && tx.date && tx.type && tx.userId && tx.walletId
                    );
                    
                    console.log("[SYNC_DEBUG] Continuando apenas com transações válidas:", {
                      totalOriginal: newTransactionsData.length,
                      totalValidas: transacoesValidas.length
                    });
                    
                    // Atualizar para usar apenas transações válidas
                    if (transacoesValidas.length > 0) {
                      const createdTx = await tx.transaction.createMany({
                        data: transacoesValidas,
                        skipDuplicates: true
                      });
                      console.log("[SYNC_DB] Transações salvas no banco:", createdTx.count);
                      transactionCount = createdTx.count; // Armazenar o número de transações criadas
                    } else {
                      console.log("[SYNC_DEBUG] Nenhuma transação válida para criar");
                    }
                  } else {
                    // Todas as transações são válidas
                    const createdTx = await tx.transaction.createMany({
                      data: newTransactionsData,
                      skipDuplicates: true // Segurança extra contra duplicatas
                    });
                    console.log("[SYNC_DB] Transações salvas no banco:", createdTx.count);
                    transactionCount = createdTx.count; // Armazenar o número de transações criadas
                  }
                  
                  // Adicionar log para confirmar a criação das transações
                  console.log("[SYNC_DEBUG] Transações criadas com sucesso");
                } catch (error) {
                  console.error("[SYNC_ERROR] Erro ao criar transações:", error);
                  throw new Error(`Falha ao criar transações: ${(error as Error).message}`);
                }
              } else {
                console.log("[SYNC_DEBUG] Nenhuma transação nova para criar");
              }
              
              // Atualizar saldo e metadados da carteira
              if (saldoAtual !== null) {
                try {
                  // Atualizar os metadados para incluir informações da sincronização
                  const updatedMetadata = {
                    ...wallet.metadata as Record<string, any>,
                    lastSync: new Date().toISOString(),
                    lastSyncStatus: "success",
                    lastSyncCount: newTransactionsData.length
                  };
                  
                  // Atualizar a carteira com o novo saldo e metadados
                  updatedWallet = await tx.wallet.update({
                    where: { id: wallet.id },
                    data: {
                      balance: saldoAtual,
                      metadata: updatedMetadata
                    },
                    include: {
                      bank: true
                    }
                  });
                  
                  console.log("[SYNC_DEBUG] Carteira atualizada com sucesso:", {
                    id: updatedWallet.id,
                    saldoNovo: updatedWallet.balance
                  });
                } catch (error) {
                  console.error("[SYNC_ERROR] Erro ao atualizar carteira:", error);
                  throw new Error(`Falha ao atualizar carteira: ${(error as Error).message}`);
                }
              }
              
              return {
                transactionCount: transactionCount,
                walletUpdated: saldoAtual !== null
              };
            });
            
            console.log("[SYNC_DEBUG] Resultado da transação:", result);
            
            // Log do resumo da sincronização
            console.log("[SYNC] Resumo da sincronização:", {
              carteira: wallet.name,
              id: wallet.id,
              saldoAnterior: wallet.balance,
              saldoNovo: updatedWallet.balance,
              diferenca: updatedWallet.balance - wallet.balance,
              transacoesImportadas: extract.listaLancamento?.length || 0,
              dataInicio,
              dataFim
            });
            
            // Retornar resultado bem-sucedido com o número correto de transações
            return NextResponse.json({
              success: true,
              message: "Carteira sincronizada com sucesso",
              wallet: updatedWallet,
              data: {
                transactionCount: transactionCount,
                balance: updatedWallet?.balance || 0,
                totalRegistros: extract.listaLancamento?.length || 0
              }
            });
          } catch (error) {
            console.error("[SYNC] Erro na transação ao salvar dados:", error);
            throw new Error("Erro ao salvar os dados sincronizados: " + (error as Error).message);
          }
        } else {
          // Sem transações disponíveis no extrato
          console.log("[SYNC] Extrato não contém transações");
          
          // Atualizar apenas os metadados para registrar a tentativa de sincronização
          const updatedMetadata = {
            ...wallet.metadata as Record<string, any>,
            lastSync: new Date().toISOString(),
            lastSyncStatus: "success",
            lastSyncCount: 0
          };
          
          // Atualizar saldo se disponível
          if (saldoAtual !== null) {
            updatedWallet = await prisma.wallet.update({
              where: { id: wallet.id },
              data: { 
                balance: saldoAtual,
                metadata: updatedMetadata
              },
              include: {
                bank: true
              }
            });
          }
        }
        
        // Log do resumo da sincronização
        console.log("[SYNC] Resumo da sincronização:", {
          carteira: wallet.name,
          id: wallet.id,
          saldoAnterior: wallet.balance,
          saldoNovo: updatedWallet.balance,
          diferenca: updatedWallet.balance - wallet.balance,
          transacoesImportadas: extract.listaLancamento?.length || 0,
          dataInicio,
          dataFim
        });
        
        // Retornar resultado bem-sucedido com o número correto de transações
        return NextResponse.json({
          success: true,
          message: "Carteira sincronizada com sucesso",
          wallet: updatedWallet,
          data: {
            transactionCount: transactionCount,
            balance: updatedWallet?.balance || 0,
            totalRegistros: extract.listaLancamento?.length || 0
          }
        });
      } catch (error: any) {
        console.error("[SYNC] Erro ao sincronizar:", error);
        
        return NextResponse.json({
          success: false,
          message: error.message || "Erro ao sincronizar carteira",
          error: error.message
        }, {
          status: 500
        });
      }
    } else {
      console.log("[SYNC] Tipo de banco não suportado");
      
      return NextResponse.json({
        success: false,
        message: "Este tipo de banco não é suportado para sincronização automática."
      }, {
        status: 400
      });
    }
  } catch (error: any) {
    console.error("[SYNC_ERROR]", error);
    
    return NextResponse.json({
        success: false, 
      message: error.message || "Erro ao sincronizar carteira",
      error: error.message
    }, {
      status: 500
    });
  }
} 