/**
 * 🎨 DADOS MOCKADOS PARA DEMONSTRAÇÃO AO CLIENTE
 * Todos os dados são realistas e servem para demonstrar a funcionalidade
 * As APIs reais substituirão estes dados quando os tokens forem válidos
 */

export const mockVendedores = [
  { id: "1", nome: "João Silva", vendas: 28, faturamento: 145000, ticketMedio: 5178, lojaNome: "Matriz" },
  { id: "2", nome: "Maria Santos", vendas: 24, faturamento: 132000, ticketMedio: 5500, lojaNome: "Filial 1" },
  { id: "3", nome: "Pedro Costa", vendas: 18, faturamento: 98500, ticketMedio: 5472, lojaNome: "Matriz" },
  { id: "4", nome: "Ana Garcia", vendas: 22, faturamento: 128000, ticketMedio: 5818, lojaNome: "Filial 2" },
  { id: "5", nome: "Carlos Oliveira", vendas: 15, faturamento: 87500, ticketMedio: 5833, lojaNome: "Filial 1" }
];

export const mockVendas = [
  { id: 1, cliente: "Empresa A", valor: 15000, data: "2026-01-20", vendedor: "João Silva", status: "Concretizada" },
  { id: 2, cliente: "Empresa B", valor: 8500, data: "2026-01-19", vendedor: "Maria Santos", status: "Concretizada" },
  { id: 3, cliente: "Empresa C", valor: 12300, data: "2026-01-18", vendedor: "Pedro Costa", status: "Em andamento" },
  { id: 4, cliente: "Empresa D", valor: 22000, data: "2026-01-17", vendedor: "João Silva", status: "Concretizada" },
  { id: 5, cliente: "Empresa E", valor: 9800, data: "2026-01-16", vendedor: "Ana Garcia", status: "Concretizada" },
  { id: 6, cliente: "Empresa F", valor: 18500, data: "2026-01-15", vendedor: "Pedro Costa", status: "Concretizada" },
  { id: 7, cliente: "Empresa G", valor: 11200, data: "2026-01-14", vendedor: "Carlos Oliveira", status: "Em andamento" },
];

export const mockMetas = {
  janeiro: {
    mesReferencia: new Date(2026, 0, 1),
    metaMensal: 100000,
    metaSalvio: 80000,
    metaCoordenador: 90000,
    metasVendedores: [
      { vendedorId: '1', nome: 'João Silva', meta: 20000 },
      { vendedorId: '2', nome: 'Maria Santos', meta: 18000 },
      { vendedorId: '3', nome: 'Pedro Costa', meta: 15000 },
      { vendedorId: '4', nome: 'Ana Garcia', meta: 17000 },
      { vendedorId: '5', nome: 'Carlos Oliveira', meta: 13000 }
    ]
  },
  fevereiro: {
    mesReferencia: new Date(2026, 1, 1),
    metaMensal: 120000,
    metaSalvio: 96000,
    metaCoordenador: 108000,
    metasVendedores: [
      { vendedorId: '1', nome: 'João Silva', meta: 24000 },
      { vendedorId: '2', nome: 'Maria Santos', meta: 21000 },
      { vendedorId: '3', nome: 'Pedro Costa', meta: 18000 },
      { vendedorId: '4', nome: 'Ana Garcia', meta: 20000 },
      { vendedorId: '5', nome: 'Carlos Oliveira', meta: 15000 }
    ]
  }
};

export const mockContatos = [
  {
    id: 1,
    nome: "Alberto Santos",
    email: "alberto@empresa1.com",
    telefone: "(11) 98765-4321",
    empresa: "Empresa A",
    cargo: "Gerente de Vendas",
    status: "Ativo"
  },
  {
    id: 2,
    nome: "Beatriz Costa",
    email: "beatriz@empresa2.com",
    telefone: "(21) 97654-3210",
    empresa: "Empresa B",
    cargo: "Diretora",
    status: "Ativo"
  },
  {
    id: 3,
    nome: "Carlos Mendes",
    email: "carlos@empresa3.com",
    telefone: "(31) 96543-2109",
    empresa: "Empresa C",
    cargo: "Supervisor",
    status: "Inativo"
  },
  {
    id: 4,
    nome: "Diana Lima",
    email: "diana@empresa4.com",
    telefone: "(41) 95432-1098",
    empresa: "Empresa D",
    cargo: "Analista de Negócios",
    status: "Ativo"
  },
  {
    id: 5,
    nome: "Evandro Silva",
    email: "evandro@empresa5.com",
    telefone: "(51) 94321-0987",
    empresa: "Empresa E",
    cargo: "Presidente",
    status: "Ativo"
  }
];

export const mockNegocios = [
  {
    id: 1,
    nome: "Proposta Q1 2026",
    cliente: "Empresa A",
    valor: 50000,
    status: "Ganho",
    etapa: "Finalizado",
    percentualRealizado: 100,
    dataPrevista: "2026-01-31"
  },
  {
    id: 2,
    nome: "Consultoria Estratégica",
    cliente: "Empresa B",
    valor: 35000,
    status: "Negociação",
    etapa: "Proposta",
    percentualRealizado: 60,
    dataPrevista: "2026-02-15"
  },
  {
    id: 3,
    nome: "Implementação de Sistema",
    cliente: "Empresa C",
    valor: 85000,
    status: "Proposta Enviada",
    etapa: "Análise",
    percentualRealizado: 40,
    dataPrevista: "2026-02-28"
  },
  {
    id: 4,
    nome: "Suporte Anual",
    cliente: "Empresa D",
    valor: 24000,
    status: "Ganho",
    etapa: "Finalizado",
    percentualRealizado: 100,
    dataPrevista: "2026-01-20"
  },
  {
    id: 5,
    nome: "Treinamento de Equipe",
    cliente: "Empresa E",
    valor: 15000,
    status: "Em Qualificação",
    etapa: "Contato",
    percentualRealizado: 20,
    dataPrevista: "2026-03-15"
  }
];

export const mockIndicadoresCEO = {
  vendas: {
    total: 591000,
    metaMensal: 500000,
    percentualMeta: 118.2,
    crescimentoMoM: 12.5,
    totalVendas: 107
  },
  margens: {
    margemBruta: 42.5,
    margemLiquida: 18.7,
    margemOperacional: 22.3,
    custoMedio: 57.5
  },
  eficiencia: {
    ticketMedio: 5526,
    tasaConversao: 78.5,
    tempoMedioFechamento: 5.2,
    indiceRetencao: 94.2
  },
  liquidez: {
    liquidezCorrente: 2.35,
    liquidezGeral: 1.87,
    estoqueRotacao: 8.5,
    recebiveisRotacao: 12.3
  },
  inadimplencia: {
    taxaInadimplencia: 3.2,
    diasMedioAtraso: 8.5,
    valorInadimplente: 18912,
    acumuladoAno: 5.1
  }
};

export const mockDREGerencial = {
  receitaBruta: 591000,
  impostos: 118200,
  receitaLiquida: 472800,
  custoVariavel: 251193,
  custoFixo: 45000,
  margemBruta: 201607,
  despesasOperacionais: 78300,
  lucroOperacional: 123307,
  resultadoFinanceiro: -8500,
  lucroLiquido: 110807,
  impostoRenda: 33242,
  lucroLiquidoFinal: 77565
};
