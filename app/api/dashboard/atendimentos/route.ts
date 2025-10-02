import { NextRequest, NextResponse } from "next/server";
import { validateSessionForAPI } from "@/app/_utils/auth";
import { prisma } from "@/app/_lib/prisma";
import { authOptions } from "@/app/_lib/auth";
import { GestaoClickService } from '@/app/_services/gestao-click-service';
import { formatDate } from "@/app/_utils/format";
import { addDays, subDays } from "date-fns";
import { logger } from "@/app/_lib/logger";

// Configuração para forçar o comportamento dinâmico
export const dynamic = "force-dynamic";


// Interface para a estrutura de dados do dashboard
interface DashboardAtendimentos {
  totais: {
    atendimentos: number;
    conversoes: number;
    taxaConversao: number;
    tempoMedioResposta: number;
    taxaAbandono: number;
  };
  canais: Array<{
    canal: string;
    quantidade: number;
    percentual: number;
  }>;
  consultores: Array<{
    id: string;
    nome: string;
    atendimentos: number;
    conversoes: number;
    taxaConversao: number;
  }>;
  origemLeads: Array<{
    origem: string;
    quantidade: number;
    percentual: number;
  }>;
  avisos?: string[];
}

// Função para criar um dashboard vazio com avisos
function createEmptyDashboard(avisos: string[] = []): DashboardAtendimentos {
  return {
    totais: {
      atendimentos: 0,
      conversoes: 0,
      taxaConversao: 0,
      tempoMedioResposta: 0,
      taxaAbandono: 0
    },
    canais: [],
    consultores: [],
    origemLeads: [],
    avisos
  };
}

export async function GET(request: NextRequest) {
  try {
    // Recuperar parâmetros de data da URL
    const { searchParams } = new URL(request.url);
    const dataInicio = searchParams.get("dataInicio");
    const dataFim = searchParams.get("dataFim");
    
    // Verificar se os parâmetros obrigatórios foram fornecidos
    if (!dataInicio || !dataFim) {
      logger.warn("API dashboard/atendimentos: Parâmetros de data não fornecidos");
      return NextResponse.json(
        { 
          error: "Os parâmetros dataInicio e dataFim são obrigatórios", 
          dashboard: createEmptyDashboard(["Parâmetros de data não fornecidos"])
        }, 
        { status: 400 }
      );
    }

    // Obter sessão do usuário
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    // Verificar se usuário está autenticado
    if (!userId) {
      logger.warn("API dashboard/atendimentos: Usuário não autenticado");
      return NextResponse.json(
        { 
          error: "Usuário não autenticado", 
          dashboard: createEmptyDashboard(["Usuário não autenticado"])
        }, 
        { status: 401 }
      );
    }

    // Buscar configuração do Gestão Click
    const gestaoClickConfig = await prisma.integrationSettings.findFirst({
      where: {
        userId: userId,
        provider: "GESTAO_CLICK",
        active: true
      },
      select: {
        metadata: true
      }
    });

    // Inicializar variáveis de configuração
    let apiKey, secretToken, apiUrl, empresa;
    
    if (gestaoClickConfig && gestaoClickConfig.metadata) {
      // Usar configuração do usuário
      apiKey = (gestaoClickConfig.metadata as any).apiKey;
      secretToken = (gestaoClickConfig.metadata as any).secretToken;
      apiUrl = (gestaoClickConfig.metadata as any).apiUrl || 'https://api.beteltecnologia.com';
      empresa = (gestaoClickConfig.metadata as any).empresa;
    } else {
      // Usar variáveis de ambiente padrão
      apiKey = process.env.GESTAO_CLICK_ACCESS_TOKEN;
      secretToken = process.env.GESTAO_CLICK_SECRET_ACCESS_TOKEN;
      apiUrl = process.env.GESTAO_CLICK_API_URL || 'https://api.beteltecnologia.com';
      empresa = '';
      
      logger.info("Usando configuração padrão do Gestão Click a partir de variáveis de ambiente");
    }

    // Verificar se a API está configurada
    if (!apiKey || !apiUrl) {
      logger.warn("API dashboard/atendimentos: API Gestão Click não configurada");
      return NextResponse.json(
        { 
          error: "API Gestão Click não configurada corretamente", 
          dashboard: createEmptyDashboard(["API Gestão Click não configurada corretamente"])
        }, 
        { status: 500 }
      );
    }

    // Inicializar serviço Gestão Click
    const gestaoClickService = new GestaoClickService({
      apiKey,
      secretToken,
      apiUrl,
      userId,
      empresa
    });
    const avisos: string[] = [];
    
    // Buscar dados de vendas
    let vendas = null;
    try {
      vendas = await gestaoClickService.getSales(
        new Date(dataInicio),
        new Date(dataFim)
      );
    } catch (error) {
      logger.error("Erro ao buscar vendas:", error);
      avisos.push("Não foi possível obter dados de vendas");
    }

    // Buscar dados de clientes
    let clientes = null;
    try {
      // Fetch clientes (endpoints específicos do serviço)
      const clientesResponse = await fetch(`${apiUrl}/clientes?data_inicio=${dataInicio}&data_fim=${dataFim}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'access-token': apiKey,
          ...(secretToken ? { 'secret-access-token': secretToken } : {})
        }
      });
      
      if (clientesResponse.ok) {
        clientes = await clientesResponse.json();
      } else {
        throw new Error(`Erro ao buscar clientes: ${clientesResponse.status}`);
      }
    } catch (error) {
      logger.error("Erro ao buscar clientes:", error);
      avisos.push("Não foi possível obter dados de clientes");
    }

    // Buscar dados de funcionários
    let funcionarios = null;
    try {
      // Fetch funcionários (endpoints específicos do serviço)
      const funcionariosResponse = await fetch(`${apiUrl}/funcionarios`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'access-token': apiKey,
          ...(secretToken ? { 'secret-access-token': secretToken } : {})
        }
      });
      
      if (funcionariosResponse.ok) {
        funcionarios = await funcionariosResponse.json();
      } else {
        throw new Error(`Erro ao buscar funcionários: ${funcionariosResponse.status}`);
      }
    } catch (error) {
      logger.error("Erro ao buscar funcionários:", error);
      avisos.push("Não foi possível obter dados de funcionários");
    }

    // Se não foi possível obter nenhum dado, retornar dashboard vazio
    if (!vendas && !clientes && !funcionarios) {
      logger.warn("API dashboard/atendimentos: Não foi possível obter nenhum dado da API");
      return NextResponse.json(
        { 
          error: "Não foi possível obter dados da API Gestão Click", 
          dashboard: createEmptyDashboard(avisos)
        }, 
        { status: 500 }
      );
    }

    // Processar dados para o dashboard
    try {
      const totalAtendimentos = clientes?.data?.length || 0;
      const totalVendas = vendas?.data?.length || 0;
      
      // Calcular métricas do dashboard
      const taxaConversao = totalAtendimentos > 0 ? totalVendas / totalAtendimentos : 0;
      const tempoMedioResposta = calcularTempoMedioResposta(clientes);
      const taxaAbandono = calcularTaxaAbandono(clientes, vendas);
      
      // Processar dados de canais, consultores e origens
      const canais = processarCanais(clientes);
      const consultores = processarConsultores(clientes, vendas, funcionarios);
      const origemLeads = processarOrigemLeads(clientes);
  
      // Construir dashboard
      const dashboard: DashboardAtendimentos = {
        totais: {
          atendimentos: totalAtendimentos,
          conversoes: totalVendas,
          taxaConversao,
          tempoMedioResposta,
          taxaAbandono
        },
        canais,
        consultores,
        origemLeads
      };
  
      // Adicionar avisos, se houver
      if (avisos.length > 0) {
        dashboard.avisos = avisos;
      }
  
      // Retornar dados do dashboard
      return NextResponse.json({ dashboard });
    } catch (error) {
      logger.error("Erro ao processar dados para o dashboard:", error);
      return NextResponse.json(
        {
          error: "Erro ao processar dados para o dashboard",
          dashboard: createEmptyDashboard([...avisos, "Erro ao processar dados para o dashboard"])
        },
        { status: 500 }
      );
    }
  } catch (error) {
    // Tratar erro geral
    logger.error("Erro ao processar dashboard de atendimentos:", error);
    return NextResponse.json(
      { 
        error: "Erro ao processar dashboard de atendimentos", 
        dashboard: createEmptyDashboard(["Erro interno ao processar dados do dashboard"])
      }, 
      { status: 500 }
    );
  }
}

// Funções existentes de processamento de dados
function processarCanais(clientes: any) {
  console.log("Processando dados de canais");
  
  if (!clientes?.data || !Array.isArray(clientes.data)) {
    return [];
  }
  
  const canais = ['WhatsApp', 'Instagram', 'Site', 'Email', 'Telefone', 'Outro'];
  const contadores: Record<string, number> = {};
  
  // Inicializar contadores
  canais.forEach(canal => {
    contadores[canal] = 0;
  });
  
  // Contar atendimentos por canal
  clientes.data.forEach((cliente: any) => {
    if (!cliente) return;
    
    let canal = 'Outro';
    
    // Determinar o canal com base nas informações do cliente
    if (cliente.metadata?.canal) {
      canal = cliente.metadata.canal;
    } else if (cliente.observacao && typeof cliente.observacao === 'string') {
      const obs = cliente.observacao.toLowerCase();
      if (obs.includes('whatsapp')) {
        canal = 'WhatsApp';
      } else if (obs.includes('instagram')) {
        canal = 'Instagram';
      } else if (obs.includes('site')) {
        canal = 'Site';
      } else if (obs.includes('email')) {
        canal = 'Email';
      } else if (obs.includes('telefone') || obs.includes('ligação')) {
        canal = 'Telefone';
      }
    }
    
    // Garantir que o canal existe no contador
    if (!contadores[canal]) {
      canal = 'Outro';
    }
    
    contadores[canal]++;
  });
  
  // Calcular total
  const total = Object.values(contadores).reduce((a, b) => a + b, 0);
  
  // Formatar dados para retorno
  return Object.entries(contadores)
    .filter(([_, quantidade]) => quantidade > 0) // Remover canais sem atendimentos
    .map(([canal, quantidade]) => ({
      canal,
      quantidade,
      percentual: total > 0 ? quantidade / total : 0
    }))
    .sort((a, b) => b.quantidade - a.quantidade);
}

function processarConsultores(clientes: any, vendas: any, funcionarios: any) {
  console.log("Processando dados de consultores");
  
  // Mapear funcionários por ID
  const funcionariosPorId: Record<string, any> = {};
  if (funcionarios?.data && Array.isArray(funcionarios.data)) {
    funcionarios.data.forEach((funcionario: any) => {
      if (funcionario && funcionario.id) {
        funcionariosPorId[funcionario.id] = funcionario;
      }
    });
  }
  
  // Contadores para atendimentos e conversões por consultor
  const atendimentosPorConsultor: Record<string, {
    id: string;
    nome: string;
    atendimentos: number;
    conversoes: number;
  }> = {};
  
  // Processar clientes para contabilizar atendimentos
  if (clientes?.data && Array.isArray(clientes.data)) {
    clientes.data.forEach((cliente: any) => {
      if (!cliente || !cliente.funcionario_id) return;
      
      const consultorId = cliente.funcionario_id.toString();
      const consultor = funcionariosPorId[consultorId];
      
      if (!atendimentosPorConsultor[consultorId]) {
        atendimentosPorConsultor[consultorId] = {
          id: consultorId,
          nome: consultor ? consultor.nome : `Consultor ${consultorId}`,
          atendimentos: 0,
          conversoes: 0
        };
      }
      
      atendimentosPorConsultor[consultorId].atendimentos++;
    });
  }
  
  // Processar vendas para contabilizar conversões
  if (vendas?.data && Array.isArray(vendas.data)) {
    vendas.data.forEach((venda: any) => {
      if (!venda || !venda.funcionario_id) return;
      
      const consultorId = venda.funcionario_id.toString();
      const consultor = funcionariosPorId[consultorId];
      
      if (!atendimentosPorConsultor[consultorId]) {
        atendimentosPorConsultor[consultorId] = {
          id: consultorId,
          nome: consultor ? consultor.nome : `Consultor ${consultorId}`,
          atendimentos: 0,
          conversoes: 0
        };
      }
      
      atendimentosPorConsultor[consultorId].conversoes++;
    });
  }
  
  // Formatar dados para retorno, calculando taxa de conversão
  return Object.values(atendimentosPorConsultor)
    .map(consultor => ({
      id: consultor.id,
      nome: consultor.nome,
      atendimentos: consultor.atendimentos,
      conversoes: consultor.conversoes,
      taxaConversao: consultor.atendimentos > 0 ? consultor.conversoes / consultor.atendimentos : 0
    }))
    .filter(consultor => consultor.atendimentos > 0) // Remover consultores sem atendimentos
    .sort((a, b) => b.conversoes - a.conversoes); // Ordenar por conversões (decrescente)
}

function calcularTempoMedioResposta(clientes: any) {
  console.log("Calculando tempo médio de resposta");
  
  if (!clientes?.data || !Array.isArray(clientes.data)) {
    return 0;
  }
  
  let somaTempos = 0;
  let contagemValida = 0;
  
  clientes.data.forEach((cliente: any) => {
    if (!cliente) return;
    
    // Procurar dados de tempo de resposta na metadata
    let tempoResposta = 0;
    if (cliente.metadata?.tempo_resposta) {
      tempoResposta = parseFloat(cliente.metadata.tempo_resposta);
    } else if (cliente.metadata?.tempo_atendimento) {
      tempoResposta = parseFloat(cliente.metadata.tempo_atendimento);
    }
    
    // Verificar se o tempo é válido (valor numérico e maior que zero)
    if (!isNaN(tempoResposta) && tempoResposta > 0) {
      somaTempos += tempoResposta;
      contagemValida++;
    }
  });
  
  // Retornar tempo médio em minutos, arredondado
  return contagemValida > 0 ? Math.round(somaTempos / contagemValida) : 0;
}

function calcularTaxaAbandono(clientes: any, vendas: any) {
  console.log("Calculando taxa de abandono");
  
  if (!clientes?.data || !Array.isArray(clientes.data)) {
    return 0;
  }
  
  // Total de atendimentos
  const totalAtendimentos = clientes.data.length;
  
  // Mapear clientes que possuem vendas
  const clientesComVenda = new Set();
  if (vendas?.data && Array.isArray(vendas.data)) {
    vendas.data.forEach((venda: any) => {
      if (venda && venda.cliente_id) {
        clientesComVenda.add(venda.cliente_id.toString());
      }
    });
  }
  
  // Contar clientes que realizaram compra
  let clientesConvertidos = 0;
  clientes.data.forEach((cliente: any) => {
    if (cliente && cliente.id && clientesComVenda.has(cliente.id.toString())) {
      clientesConvertidos++;
    }
  });
  
  // Calcular taxa de abandono (clientes que não converteram)
  return totalAtendimentos > 0 ? 1 - (clientesConvertidos / totalAtendimentos) : 0;
}

function processarOrigemLeads(clientes: any) {
  console.log("Processando origem dos leads");
  
  if (!clientes?.data || !Array.isArray(clientes.data)) {
    return [];
  }
  
  const origens: Record<string, number> = {
    'Indicação': 0,
    'Google': 0,
    'Instagram': 0,
    'Facebook': 0,
    'Site': 0,
    'Outros': 0
  };
  
  clientes.data.forEach((cliente: any) => {
    if (!cliente) return;
    
    let origem = 'Outros';
    
    // Determinar origem com base nas informações do cliente
    if (cliente.metadata?.origem) {
      origem = cliente.metadata.origem;
    } else if (cliente.observacao && typeof cliente.observacao === 'string') {
      const obs = cliente.observacao.toLowerCase();
      if (obs.includes('indicação') || obs.includes('indicacao')) {
        origem = 'Indicação';
      } else if (obs.includes('google')) {
        origem = 'Google';
      } else if (obs.includes('instagram')) {
        origem = 'Instagram';
      } else if (obs.includes('facebook')) {
        origem = 'Facebook';
      } else if (obs.includes('site')) {
        origem = 'Site';
      }
    }
    
    // Garantir que a origem existe no contador
    if (!origens[origem]) {
      origens[origem] = 0;
    }
    
    origens[origem]++;
  });
  
  // Calcular total
  const total = Object.values(origens).reduce((a, b) => a + b, 0);
  
  // Formatar dados para retorno
  return Object.entries(origens)
    .filter(([_, quantidade]) => quantidade > 0) // Remover origens sem leads
    .map(([origem, quantidade]) => ({
      origem,
      quantidade,
      percentual: total > 0 ? quantidade / total : 0
    }))
    .sort((a, b) => b.quantidade - a.quantidade);
} 
