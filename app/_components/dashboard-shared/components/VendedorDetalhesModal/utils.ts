// Função utilitária para formatar datas considerando o fuso horário brasileiro
export const formatarDataBrasileira = (dataString: string): string => {
  if (!dataString) return "Data não disponível";
  
  try {
    let data: Date;
    
    if (dataString.includes('T') || dataString.includes('Z')) {
      data = new Date(dataString);
    } else if (dataString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [ano, mes, dia] = dataString.split('-').map(Number);
      data = new Date(ano, mes - 1, dia);
    } else {
      data = new Date(dataString);
    }
    
    if (isNaN(data.getTime())) {
      return "Data inválida";
    }
    
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'America/Sao_Paulo'
    });
  } catch (error) {
    console.error('Erro ao formatar data:', error, { dataString });
    return "Data inválida";
  }
};

// Função para extrair dados de venda com fallbacks robustos
export const extrairDadosVenda = (venda: any) => {
  const dataVenda = venda.data_venda || 
                   venda.data_criacao || 
                   venda.data_atualizacao || 
                   venda.data_inclusao || 
                   venda.data || 
                   null;

  const nomeCliente = venda.nome_cliente || 
                     venda.cliente_nome || 
                     venda.cliente || 
                     'Cliente não identificado';

  const valorTotal = venda.valor_total || '0';

  return {
    dataVenda,
    nomeCliente,
    valorTotal
  };
};

// Função para extrair "Como nos conheceu" dos atributos
export const extrairComoNosConheceu = (venda: any): string | null => {
  if (!venda.metadata?.atributos || !Array.isArray(venda.metadata.atributos)) {
    return null;
  }

  const atributoComoConheceu = venda.metadata.atributos.find((attr: any) => 
    attr.atributo && 
    attr.atributo.descricao && 
    attr.atributo.descricao.toLowerCase().includes('como nos conheceu')
  );

  return atributoComoConheceu?.atributo?.conteudo || null;
};

