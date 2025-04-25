import { GestaoClickCliente, GestaoClickImportResult, GestaoClickRelatorioCruzamento, GestaoClickResponse, GestaoClickSituacaoVenda, GestaoClickVenda, GestaoClickVendaFiltros } from "@/app/types/gestao-click";
import axios from "axios";
import { format } from "date-fns";
import { prisma } from "../db";

/**
 * Serviço para integração com API do Gestão Click
 */
export class GestaoClickClientService {
  private baseUrl: string;
  private apiKey: string;
  private secretKey: string;
  private userId: string;

  /**
   * Construtor do serviço
   * @param apiKey Chave de API do Gestão Click
   * @param secretKey Chave secreta do Gestão Click
   * @param userId ID do usuário no sistema
   */
  constructor(apiKey: string, secretKey: string, userId: string) {
    this.baseUrl = "https://api.gestaoclick.com/v1";
    this.apiKey = apiKey;
    this.secretKey = secretKey;
    this.userId = userId;
  }

  /**
   * Obter cabeçalhos de autenticação para as requisições
   */
  private getAuthHeaders() {
    return {
      "X-API-KEY": this.apiKey,
      "X-SECRET-KEY": this.secretKey,
      "X-USER-ID": this.userId,
      "Content-Type": "application/json",
    };
  }

  /**
   * Buscar clientes do Gestão Click
   * @param page Página atual para paginação
   * @param limit Limite de itens por página
   * @param search Termo de busca
   * @returns Resposta com lista de clientes
   */
  async getClientes(
    page: number = 1,
    limit: number = 50,
    search?: string
  ): Promise<GestaoClickResponse<GestaoClickCliente>> {
    try {
      const params: Record<string, any> = {
        page,
        limit,
      };

      if (search) {
        params.search = search;
      }

      const response = await axios.get(`${this.baseUrl}/clientes`, {
        headers: this.getAuthHeaders(),
        params,
      });

      return response.data;
    } catch (error: any) {
      console.error("Erro ao buscar clientes:", error.message);
      throw new Error(`Falha ao buscar clientes: ${error.message}`);
    }
  }

  /**
   * Buscar vendas do Gestão Click com filtros
   * @param filtros Filtros para busca de vendas
   * @returns Resposta com lista de vendas
   */
  async getVendas(
    filtros: GestaoClickVendaFiltros = {}
  ): Promise<GestaoClickResponse<GestaoClickVenda>> {
    try {
      const { dataInicio, dataFim, clienteId, situacaoId, page = 1, limit = 50, search } = filtros;
      
      const params: Record<string, any> = {
        page,
        limit,
      };

      if (dataInicio) params.dataInicio = dataInicio;
      if (dataFim) params.dataFim = dataFim;
      if (clienteId) params.clienteId = clienteId;
      if (situacaoId) params.situacaoId = situacaoId;
      if (search) params.search = search;

      const response = await axios.get(`${this.baseUrl}/vendas`, {
        headers: this.getAuthHeaders(),
        params,
      });

      return response.data;
    } catch (error: any) {
      console.error("Erro ao buscar vendas:", error.message);
      throw new Error(`Falha ao buscar vendas: ${error.message}`);
    }
  }

  /**
   * Buscar situações de vendas do Gestão Click
   * @returns Resposta com lista de situações de vendas
   */
  async getSituacoesVendas(): Promise<GestaoClickResponse<GestaoClickSituacaoVenda>> {
    try {
      const response = await axios.get(`${this.baseUrl}/vendas/situacoes`, {
        headers: this.getAuthHeaders(),
      });

      return response.data;
    } catch (error: any) {
      console.error("Erro ao buscar situações de vendas:", error.message);
      throw new Error(`Falha ao buscar situações de vendas: ${error.message}`);
    }
  }

  /**
   * Importar clientes do Gestão Click para o banco de dados
   * @returns Resultado da importação
   */
  async importClientes(): Promise<GestaoClickImportResult> {
    const result: GestaoClickImportResult = {
      total: 0,
      imported: 0,
      skipped: 0,
      errors: 0,
      errorDetails: [],
    };

    try {
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const response = await this.getClientes(page, 100);
        result.total += response.data.length;

        for (const cliente of response.data) {
          try {
            // Verificar se o cliente já existe no banco
            const existingClient = await prisma.customer.findFirst({
              where: {
                metadata: {
                  path: ["source"],
                  equals: "GESTAO_CLICK",
                },
                AND: {
                  metadata: {
                    path: ["externalId"],
                    equals: cliente.id.toString(),
                  },
                },
              },
            });

            const clientData = {
              name: cliente.nome,
              email: cliente.email || null,
              phone: cliente.telefone || null,
              document: cliente.cpfCnpj || null,
              address: cliente.endereco 
                ? {
                    street: cliente.endereco,
                    city: cliente.cidade || null,
                    state: cliente.estado || null,
                    postalCode: cliente.cep || null,
                    neighborhood: cliente.bairro || null,
                    complement: cliente.complemento || null,
                  } 
                : undefined,
              metadata: {
                source: "GESTAO_CLICK",
                externalId: cliente.id.toString(),
                type: cliente.tipo,
                status: cliente.situacao,
                notes: cliente.observacoes || null,
                registerDate: cliente.dataCadastro,
              },
            };

            if (existingClient) {
              // Atualizar cliente existente
              await prisma.customer.update({
                where: { id: existingClient.id },
                data: clientData,
              });
              result.skipped++;
            } else {
              // Criar novo cliente
              await prisma.customer.create({
                data: clientData,
              });
              result.imported++;
            }
          } catch (error: any) {
            console.error(`Erro ao importar cliente ${cliente.id}:`, error.message);
            result.errors++;
            result.errorDetails?.push(`Cliente ${cliente.id} (${cliente.nome}): ${error.message}`);
          }
        }

        // Verificar se há mais páginas
        if (response.metadata && response.metadata.currentPage < response.metadata.totalPages) {
          page++;
        } else {
          hasMore = false;
        }
      }

      return result;
    } catch (error: any) {
      console.error("Erro ao importar clientes:", error.message);
      throw new Error(`Falha ao importar clientes: ${error.message}`);
    }
  }

  /**
   * Importar situações de vendas do Gestão Click para o banco de dados
   * @returns Resultado da importação
   */
  async importSituacoesVendas(): Promise<GestaoClickImportResult> {
    const result: GestaoClickImportResult = {
      total: 0,
      imported: 0,
      skipped: 0,
      errors: 0,
      errorDetails: [],
    };

    try {
      const response = await this.getSituacoesVendas();
      result.total = response.data.length;

      for (const situacao of response.data) {
        try {
          // Verificar se a situação já existe no banco
          const existingSituation = await prisma.saleStatus.findFirst({
            where: {
              metadata: {
                path: ["source"],
                equals: "GESTAO_CLICK",
              },
              AND: {
                metadata: {
                  path: ["externalId"],
                  equals: situacao.id.toString(),
                },
              },
            },
          });

          const situationData = {
            name: situacao.descricao,
            color: situacao.cor || null,
            active: situacao.ativo,
            metadata: {
              source: "GESTAO_CLICK",
              externalId: situacao.id.toString(),
            },
          };

          if (existingSituation) {
            // Atualizar situação existente
            await prisma.saleStatus.update({
              where: { id: existingSituation.id },
              data: situationData,
            });
            result.skipped++;
          } else {
            // Criar nova situação
            await prisma.saleStatus.create({
              data: situationData,
            });
            result.imported++;
          }
        } catch (error: any) {
          console.error(`Erro ao importar situação ${situacao.id}:`, error.message);
          result.errors++;
          result.errorDetails?.push(`Situação ${situacao.id} (${situacao.descricao}): ${error.message}`);
        }
      }

      return result;
    } catch (error: any) {
      console.error("Erro ao importar situações de vendas:", error.message);
      throw new Error(`Falha ao importar situações de vendas: ${error.message}`);
    }
  }

  /**
   * Importar vendas do Gestão Click para o banco de dados
   * @param dataInicio Data de início para filtrar vendas
   * @param dataFim Data de fim para filtrar vendas
   * @returns Resultado da importação
   */
  async importVendas(dataInicio?: string, dataFim?: string): Promise<GestaoClickImportResult> {
    const result: GestaoClickImportResult = {
      total: 0,
      imported: 0,
      skipped: 0,
      errors: 0,
      errorDetails: [],
    };

    try {
      let page = 1;
      let hasMore = true;

      const filtros: GestaoClickVendaFiltros = {
        page,
        limit: 50,
      };

      if (dataInicio) filtros.dataInicio = dataInicio;
      if (dataFim) filtros.dataFim = dataFim;

      while (hasMore) {
        const response = await this.getVendas(filtros);
        result.total += response.data.length;

        for (const venda of response.data) {
          try {
            // Verificar se a venda já existe no banco
            const existingSale = await prisma.sale.findFirst({
              where: {
                metadata: {
                  path: ["source"],
                  equals: "GESTAO_CLICK",
                },
                AND: {
                  metadata: {
                    path: ["externalId"],
                    equals: venda.id.toString(),
                  },
                },
              },
            });

            // Buscar o cliente correspondente
            const customer = await prisma.customer.findFirst({
              where: {
                metadata: {
                  path: ["source"],
                  equals: "GESTAO_CLICK",
                },
                AND: {
                  metadata: {
                    path: ["externalId"],
                    equals: venda.clienteId.toString(),
                  },
                },
              },
            });

            // Buscar a situação correspondente
            const status = await prisma.saleStatus.findFirst({
              where: {
                metadata: {
                  path: ["source"],
                  equals: "GESTAO_CLICK",
                },
                AND: {
                  metadata: {
                    path: ["externalId"],
                    equals: venda.situacaoId.toString(),
                  },
                },
              },
            });

            const saleData = {
              number: venda.numero,
              date: new Date(venda.data),
              totalAmount: venda.valorTotal,
              discount: venda.valorDesconto || 0,
              netAmount: venda.valorLiquido,
              notes: venda.observacoes || null,
              customerId: customer?.id,
              statusId: status?.id,
              metadata: {
                source: "GESTAO_CLICK",
                externalId: venda.id.toString(),
                paymentMethod: venda.formaPagamento || null,
                installments: venda.parcelas || null,
                rawData: JSON.stringify(venda),
              },
            };

            if (existingSale) {
              // Atualizar venda existente
              await prisma.sale.update({
                where: { id: existingSale.id },
                data: saleData,
              });
              result.skipped++;
            } else {
              // Criar nova venda
              await prisma.sale.create({
                data: saleData,
              });
              result.imported++;
            }
          } catch (error: any) {
            console.error(`Erro ao importar venda ${venda.id}:`, error.message);
            result.errors++;
            result.errorDetails?.push(`Venda ${venda.id} (${venda.numero}): ${error.message}`);
          }
        }

        // Verificar se há mais páginas
        if (response.metadata && response.metadata.currentPage < response.metadata.totalPages) {
          page++;
          filtros.page = page;
        } else {
          hasMore = false;
        }
      }

      return result;
    } catch (error: any) {
      console.error("Erro ao importar vendas:", error.message);
      throw new Error(`Falha ao importar vendas: ${error.message}`);
    }
  }

  /**
   * Importar todos os dados do cliente
   * Importa clientes, situações de vendas e vendas em sequência
   * @param dataInicio Data de início para filtrar vendas
   * @param dataFim Data de fim para filtrar vendas
   * @returns Resultado consolidado das importações
   */
  async importAllClientData(dataInicio?: string, dataFim?: string): Promise<Record<string, GestaoClickImportResult>> {
    try {
      // Importar situações de vendas primeiro
      const situacoesResult = await this.importSituacoesVendas();
      
      // Importar clientes em seguida
      const clientesResult = await this.importClientes();
      
      // Por fim, importar vendas que dependem dos clientes e situações
      const vendasResult = await this.importVendas(dataInicio, dataFim);

      return {
        situacoes: situacoesResult,
        clientes: clientesResult,
        vendas: vendasResult,
      };
    } catch (error: any) {
      console.error("Erro ao importar todos os dados:", error.message);
      throw new Error(`Falha ao importar todos os dados: ${error.message}`);
    }
  }

  /**
   * Obter dados para relatório de cruzamento
   * @param clienteId ID do cliente para filtrar (opcional)
   * @param dataInicio Data de início para filtrar
   * @param dataFim Data de fim para filtrar
   * @returns Dados de relatório cruzado
   */
  async getCrossClientData(
    clienteId?: number,
    dataInicio?: string,
    dataFim?: string
  ): Promise<GestaoClickRelatorioCruzamento> {
    try {
      const filtros: GestaoClickVendaFiltros = {
        limit: 1000, // Buscar mais vendas para ter dados relevantes
      };

      if (clienteId) filtros.clienteId = clienteId;
      if (dataInicio) filtros.dataInicio = dataInicio;
      if (dataFim) filtros.dataFim = dataFim;

      // Buscar vendas com os filtros informados
      const vendasResponse = await this.getVendas(filtros);
      
      // Se há clienteId, buscar dados do cliente
      let clienteData = undefined;
      if (clienteId) {
        const clientesResponse = await this.getClientes();
        const cliente = clientesResponse.data.find(c => c.id === clienteId);
        
        if (cliente) {
          const vendas = vendasResponse.data.filter(v => v.clienteId === clienteId);
          const totalCompras = vendas.length;
          const valorTotalCompras = vendas.reduce((total, venda) => total + venda.valorLiquido, 0);
          
          clienteData = {
            cliente,
            totalCompras,
            ticketMedio: totalCompras > 0 ? valorTotalCompras / totalCompras : 0,
            ultimaCompra: vendas.length > 0 ? 
              vendas.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())[0].data : 
              undefined,
            situacao: cliente.situacao,
          };
        }
      }

      // Processar dados de vendas
      const vendas = vendasResponse.data;
      const vendasPorSituacao: Record<string, number> = {};
      const vendasPorMes: Record<string, number> = {};
      const produtosMaisVendidos: Record<string, { quantidade: number; valorTotal: number }> = {};

      // Dados financeiros
      const totalRecebido = vendas.reduce((total, venda) => {
        // Somar apenas pagamentos com status PAGO
        const pagamentos = venda.pagamentos || [];
        return total + pagamentos
          .filter(p => p.status === 'PAGO')
          .reduce((sum, p) => sum + p.valor, 0);
      }, 0);

      const totalPendente = vendas.reduce((total, venda) => {
        // Somar apenas pagamentos com status PENDENTE
        const pagamentos = venda.pagamentos || [];
        return total + pagamentos
          .filter(p => p.status === 'PENDENTE')
          .reduce((sum, p) => sum + p.valor, 0);
      }, 0);

      const recebimentosPorMes: Record<string, number> = {};
      const recebimentosPorFormaPagamento: Record<string, number> = {};

      // Processar dados das vendas
      for (const venda of vendas) {
        // Contagem por situação
        const situacao = venda.situacaoDescricao;
        vendasPorSituacao[situacao] = (vendasPorSituacao[situacao] || 0) + 1;

        // Contagem por mês
        const mes = format(new Date(venda.data), 'yyyy-MM');
        vendasPorMes[mes] = (vendasPorMes[mes] || 0) + venda.valorLiquido;

        // Processamento de itens da venda
        const itens = venda.itens || [];
        for (const item of itens) {
          const produto = item.produtoNome;
          if (!produtosMaisVendidos[produto]) {
            produtosMaisVendidos[produto] = { quantidade: 0, valorTotal: 0 };
          }
          produtosMaisVendidos[produto].quantidade += item.quantidade;
          produtosMaisVendidos[produto].valorTotal += item.valorLiquido;
        }

        // Processamento de pagamentos
        const pagamentos = venda.pagamentos || [];
        for (const pagamento of pagamentos) {
          if (pagamento.status === 'PAGO') {
            // Recebimentos por mês
            const mesPagamento = format(new Date(pagamento.dataPagamento || pagamento.data), 'yyyy-MM');
            recebimentosPorMes[mesPagamento] = (recebimentosPorMes[mesPagamento] || 0) + pagamento.valor;

            // Recebimentos por forma de pagamento
            const formaPagamento = pagamento.formaPagamento;
            recebimentosPorFormaPagamento[formaPagamento] = (recebimentosPorFormaPagamento[formaPagamento] || 0) + pagamento.valor;
          }
        }
      }

      // Ordenar produtos mais vendidos e limitar a 10
      const produtosMaisVendidosArray = Object.entries(produtosMaisVendidos)
        .map(([produtoNome, { quantidade, valorTotal }]) => ({
          produtoNome,
          quantidade,
          valorTotal,
        }))
        .sort((a, b) => b.valorTotal - a.valorTotal)
        .slice(0, 10);

      return {
        periodo: {
          inicio: dataInicio || '0000-00-00',
          fim: dataFim || format(new Date(), 'yyyy-MM-dd'),
        },
        dadosCliente: clienteData,
        dadosVendas: {
          totalVendas: vendas.length,
          valorTotalVendas: vendas.reduce((total, venda) => total + venda.valorLiquido, 0),
          vendasPorSituacao,
          vendasPorMes,
          produtosMaisVendidos: produtosMaisVendidosArray,
        },
        dadosFinanceiros: {
          totalRecebido,
          totalPendente,
          recebimentosPorMes,
          recebimentosPorFormaPagamento,
        },
      };
    } catch (error: any) {
      console.error("Erro ao obter relatório cruzado:", error.message);
      throw new Error(`Falha ao gerar relatório cruzado: ${error.message}`);
    }
  }
} 