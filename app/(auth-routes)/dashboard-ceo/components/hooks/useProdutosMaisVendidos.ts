import { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { useAuth } from "@/app/_hooks/useAuth";

// Tipos
export type OrdenacaoTipo = "quantidade" | "valor" | "margem";
export type VisualizacaoTipo = "grafico" | "tabela";

export interface ProdutoItem {
  id: string;
  nome: string;
  quantidade: number;
  valor: number;
  valorUnitario: number;
  margem: number;
  margemPercentual: number;
}


// Cache para reduzir requisições desnecessárias
// const CACHE_TTL = 5 * 60 * 1000; // 5 minutos
// const produtosCache = new Map<string, { data: any, timestamp: number }>();

interface UseProdutosMaisVendidosProps {
  dataInicio: Date;
  dataFim: Date;
  vendas?: any[]; // Receber vendas diretamente do componente pai
}

export const useProdutosMaisVendidos = ({ dataInicio, dataFim, vendas }: UseProdutosMaisVendidosProps) => {
  const { user } = useAuth();
  const userEmail = user?.email;

  const [produtos, setProdutos] = useState<ProdutoItem[]>([]);
  const [equipamentos, setEquipamentos] = useState<ProdutoItem[]>([]);
  const [acessorios, setAcessorios] = useState<ProdutoItem[]>([]);
  const [acessoriosEspeciais, setAcessoriosEspeciais] = useState<ProdutoItem[]>([]);
  const [acessoriosSextavados, setAcessoriosSextavados] = useState<ProdutoItem[]>([]);
  const [acessoriosEmborrachados, setAcessoriosEmborrachados] = useState<ProdutoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [ordenacao, setOrdenacao] = useState<OrdenacaoTipo>("quantidade");
  const [visualizacao, setVisualizacao] = useState<VisualizacaoTipo>("grafico");
  
  // Estados para o modal de detalhes do produto
  const [modalAberto, setModalAberto] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState<ProdutoItem | null>(null);
  const [vendaModalAberto, setVendaModalAberto] = useState(false);
  const [vendaSelecionada, setVendaSelecionada] = useState<any>(null);

  // Gera uma chave de cache com base nos parâmetros da consulta
  const getCacheKey = useCallback((dataInicio: Date, dataFim: Date, userEmail?: string) => {
    return `produtos-vendidos:${dataInicio.toISOString()}-${dataFim.toISOString()}-${userEmail}`;
  }, []);


  // Processar produtos localmente quando vendas são fornecidas
  useEffect(() => {
    const processarProdutosLocalmente = () => {
      if (!vendas || !Array.isArray(vendas)) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setErro(null);

        console.log('🔍 [useProdutosMaisVendidos] Processando produtos localmente:', {
          totalVendas: vendas.length,
          primeirasVendas: vendas.slice(0, 3).map(v => ({
            id: v.id,
            produtos: v.produtos?.length || 0
          }))
        });

        // Processar produtos das vendas
        const produtosMap = new Map<string, {
          id: string;
          nome: string;
          quantidade: number;
          valor: number;
          valorUnitario: number;
          margem: number;
          margemPercentual: number;
        }>();

        vendas.forEach((venda: any, vendaIndex: number) => {
          if (venda.produtos && Array.isArray(venda.produtos)) {
            console.log(`🔍 [useProdutosMaisVendidos] Venda ${vendaIndex + 1} (ID: ${venda.id}):`, {
              totalProdutos: venda.produtos.length,
              primeiroProduto: venda.produtos[0] ? {
                id: venda.produtos[0].id,
                nome: venda.produtos[0].nome,
                descricao: venda.produtos[0].descricao,
                produto: venda.produtos[0].produto,
                tipoNome: typeof venda.produtos[0].nome,
                nomeExtraido: venda.produtos[0].nome && typeof venda.produtos[0].nome === 'object' 
                  ? venda.produtos[0].nome.nome_produto || venda.produtos[0].nome.nome 
                  : venda.produtos[0].nome,
                // Campos de valor
                preco_unitario: venda.produtos[0].preco_unitario,
                valor_unitario: venda.produtos[0].valor_unitario,
                valor_venda: venda.produtos[0].valor_venda,
                total: venda.produtos[0].total,
                quantidade: venda.produtos[0].quantidade,
                valor_custo: venda.produtos[0].valor_custo,
                camposDisponiveis: Object.keys(venda.produtos[0])
              } : null
            });

            venda.produtos.forEach((produto: any, produtoIndex: number) => {
              // Extrair ID do produto - pode estar no objeto nome
              let produtoId = produto.id || produto.produto_id || `produto-${vendaIndex}-${produtoIndex}`;
              if (produto.nome && typeof produto.nome === 'object' && produto.nome.produto_id) {
                produtoId = produto.nome.produto_id;
              }
              // Garantir que o nome seja uma string - extrair do objeto se necessário
              let nomeProduto = 'Produto não informado';
              if (produto.nome) {
                if (typeof produto.nome === 'string') {
                  nomeProduto = produto.nome;
                } else if (typeof produto.nome === 'object' && produto.nome.nome_produto) {
                  nomeProduto = produto.nome.nome_produto;
                } else if (typeof produto.nome === 'object' && produto.nome.nome) {
                  nomeProduto = produto.nome.nome;
                }
              } else if (produto.descricao) {
                nomeProduto = produto.descricao;
              } else if (produto.produto) {
                nomeProduto = produto.produto;
              }

              // Extrair quantidade - pode estar no objeto nome
              let quantidade = 1;
              if (produto.quantidade) {
                quantidade = parseInt(produto.quantidade);
              } else if (produto.nome && typeof produto.nome === 'object' && produto.nome.quantidade) {
                quantidade = parseInt(produto.nome.quantidade);
              }
              
              // Extrair valor unitário - tentar vários campos possíveis, incluindo o objeto nome
              let valorUnitario = 0;
              if (produto.preco_unitario) {
                valorUnitario = parseFloat(produto.preco_unitario);
              } else if (produto.valor_unitario) {
                valorUnitario = parseFloat(produto.valor_unitario);
              } else if (produto.valor_venda) {
                valorUnitario = parseFloat(produto.valor_venda);
              } else if (produto.nome && typeof produto.nome === 'object' && produto.nome.valor_venda) {
                valorUnitario = parseFloat(produto.nome.valor_venda);
              } else if (produto.total && quantidade > 0) {
                // Se não tem valor unitário, calcular a partir do total
                valorUnitario = parseFloat(produto.total) / quantidade;
              } else if (produto.nome && typeof produto.nome === 'object' && produto.nome.valor_total && quantidade > 0) {
                // Se o valor total está no objeto nome, calcular o unitário
                valorUnitario = parseFloat(produto.nome.valor_total) / quantidade;
              }
              
              const valorTotal = quantidade * valorUnitario;
              
              console.log(`💰 [useProdutosMaisVendidos] Produto processado:`, {
                produtoId,
                nomeProduto: nomeProduto,
                quantidade,
                valorUnitario,
                valorTotal,
                camposValor: {
                  preco_unitario: produto.preco_unitario,
                  valor_unitario: produto.valor_unitario,
                  valor_venda: produto.valor_venda,
                  total: produto.total,
                  // Valores do objeto nome
                  nome_valor_venda: produto.nome && typeof produto.nome === 'object' ? produto.nome.valor_venda : null,
                  nome_valor_total: produto.nome && typeof produto.nome === 'object' ? produto.nome.valor_total : null,
                  nome_quantidade: produto.nome && typeof produto.nome === 'object' ? produto.nome.quantidade : null
                }
              });

              if (produtosMap.has(produtoId)) {
                const produtoExistente = produtosMap.get(produtoId)!;
                produtoExistente.quantidade += quantidade;
                produtoExistente.valor += valorTotal;
                produtoExistente.valorUnitario = produtoExistente.valor / produtoExistente.quantidade;
              } else {
                produtosMap.set(produtoId, {
                  id: produtoId,
                  nome: nomeProduto,
                  quantidade,
                  valor: valorTotal,
                  valorUnitario,
                  margem: 0, // TODO: Calcular margem se tiver dados de custo
                  margemPercentual: 0
                });
              }
            });
          }
        });

        const produtosProcessados = Array.from(produtosMap.values());

        // Categorizar produtos
        const equipamentosProcessados: ProdutoItem[] = [];
        const acessoriosProcessados: ProdutoItem[] = [];
        const acessoriosEspeciaisProcessados: ProdutoItem[] = [];
        const acessoriosSextavadosProcessados: ProdutoItem[] = [];
        const acessoriosEmborrachadosProcessados: ProdutoItem[] = [];

        produtosProcessados.forEach(produto => {
          const nomeLower = String(produto.nome || '').toLowerCase();
          const nomeUpper = String(produto.nome || '').toUpperCase();
          
          // Lógica baseada no arquivo Python:
          // 1. Primeiro verificar categorias especiais (ANILHA, HALTER, CABO DE AÇO, KETTLEBELL, PAR DE CANELEIRAS)
          const categoriasEspeciais = ["ANILHA", "HALTER", "CABO DE AÇO", "KETTLEBELL", "PAR DE CANELEIRAS"];
          const isCategoriaEspecial = categoriasEspeciais.some(cat => nomeUpper.includes(cat));
          
          if (isCategoriaEspecial) {
            acessoriosEspeciaisProcessados.push(produto);
          } else if (nomeLower.includes('sextavado')) {
            acessoriosSextavadosProcessados.push(produto);
          } else if (nomeLower.includes('emborrachado')) {
            acessoriosEmborrachadosProcessados.push(produto);
          } else {
            // 2. Classificar por valor unitário (baseado na lógica Python: ticket < 1000 = acessórios)
            if (produto.valorUnitario < 1000) {
              acessoriosProcessados.push(produto);
            } else {
              equipamentosProcessados.push(produto);
            }
          }
        });

        console.log('💰 [useProdutosMaisVendidos] Produtos processados:', {
          total: produtosProcessados.length,
          equipamentos: equipamentosProcessados.length,
          acessorios: acessoriosProcessados.length,
          acessoriosEspeciais: acessoriosEspeciaisProcessados.length,
          acessoriosSextavados: acessoriosSextavadosProcessados.length,
          acessoriosEmborrachados: acessoriosEmborrachadosProcessados.length,
          // Mostrar alguns exemplos de cada categoria
          exemplosEquipamentos: equipamentosProcessados.slice(0, 3).map(p => ({ nome: p.nome, valor: p.valorUnitario })),
          exemplosAcessorios: acessoriosProcessados.slice(0, 3).map(p => ({ nome: p.nome, valor: p.valorUnitario })),
          exemplosEspeciais: acessoriosEspeciaisProcessados.slice(0, 3).map(p => ({ nome: p.nome, valor: p.valorUnitario }))
        });

        setProdutos(produtosProcessados);
        setEquipamentos(equipamentosProcessados);
        setAcessorios(acessoriosProcessados);
        setAcessoriosEspeciais(acessoriosEspeciaisProcessados);
        setAcessoriosSextavados(acessoriosSextavadosProcessados);
        setAcessoriosEmborrachados(acessoriosEmborrachadosProcessados);
        setLoading(false);
      } catch (error) {
        console.error('Erro ao processar produtos localmente:', error);
        setErro(error instanceof Error ? error.message : 'Erro ao processar produtos');
        setLoading(false);
      }
    };

    // Se temos vendas, processar localmente
    if (vendas) {
      processarProdutosLocalmente();
      return;
    }

    // Caso contrário, buscar via API (lógica original)
    const buscarProdutos = async () => {
      if (!userEmail) {
        setErro("Usuário não identificado. Faça login novamente.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setErro(null);

        // Ajustar as datas para considerar o fuso horário local
        const dataInicioAjustada = new Date(dataInicio);
        dataInicioAjustada.setHours(0, 0, 0, 0);
        
        const dataFimAjustada = new Date(dataFim);
        dataFimAjustada.setHours(23, 59, 59, 999);
        
        // Formatar datas no formato YYYY-MM-DD
        const dataInicioFormatada = dataInicioAjustada.toLocaleDateString('en-CA'); // Formato YYYY-MM-DD
        const dataFimFormatada = dataFimAjustada.toLocaleDateString('en-CA'); // Formato YYYY-MM-DD

        console.log(`Buscando produtos de ${dataInicioFormatada} até ${dataFimFormatada}`);

        const response = await axios.get(`/api/gestao-click/produtos-mais-vendidos`, {
          params: {
            userEmail,
            dataInicio: dataInicioFormatada,
            dataFim: dataFimFormatada
          }
        });
        
        if (response.data) {
          // A nova API já retorna as categorias separadas
          setEquipamentos(response.data.equipamentos || []);
          setAcessorios(response.data.acessorios || []);
          setAcessoriosEspeciais(response.data.acessoriosEspeciais || []);
          setAcessoriosSextavados(response.data.acessoriosSextavados || []);
          setAcessoriosEmborrachados(response.data.acessoriosEmborrachados || []);
          
          // Manter compatibilidade com o código existente
          const todosProdutos = [
            ...(response.data.equipamentos || []),
            ...(response.data.acessorios || []),
            ...(response.data.acessoriosEspeciais || []),
            ...(response.data.acessoriosSextavados || []),
            ...(response.data.acessoriosEmborrachados || [])
          ];
          setProdutos(todosProdutos);
        } else {
          setErro("Formato de dados inválido");
        }
      } catch (error) {
        console.error("Erro ao buscar produtos mais vendidos:", error);
        setErro(error instanceof Error ? error.message : "Erro ao buscar produtos");
      } finally {
        setLoading(false);
      }
    };

    buscarProdutos();
  }, [dataInicio, dataFim, userEmail, getCacheKey, vendas]);
  
  // Formatação de valores monetários
  const formatarDinheiro = useCallback((valor: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
  }, []);

  // Formatação de margem percentual
  const formatarMargem = useCallback((valor: number | string) => {
    if (valor === undefined || valor === null) return "N/A";
    
    // Se for string 'N/A', mantém assim
    if (typeof valor === 'string') return valor;
    
    // Se for número negativo, significa que não há margem calculável
    if (typeof valor === 'number' && valor < 0) return "N/A";
    
    // Formatar como percentual
    return new Intl.NumberFormat('pt-BR', { 
      style: 'percent', 
      minimumFractionDigits: 1, 
      maximumFractionDigits: 1 
    }).format(valor / 100);
  }, []);

  // Memorizar produtos ordenados para evitar reordenações frequentes
  const ordenarProdutos = useCallback((produtos: ProdutoItem[], criterio: OrdenacaoTipo, limite: number = 15) => {
    if (!produtos.length) return [];
    
    return [...produtos]
      .sort((a, b) => {
        switch (criterio) {
          case "quantidade":
            // Critério de desempate: se as quantidades forem iguais, ordena por valor maior
            if (a.quantidade === b.quantidade) {
              return b.valor - a.valor;
            }
            return b.quantidade - a.quantidade;
          case "valor":
            return b.valor - a.valor;
          case "margem":
            // Tratar margens não calculáveis (valor -1)
            const margemA = a.margem ?? 0;
            const margemB = b.margem ?? 0;
            if (margemA < 0) return 1; // Colocar produtos sem margem no final
            if (margemB < 0) return -1;
            return margemB - margemA;
          default:
            // Para ordenação padrão, também aplica o critério de desempate
            if (a.quantidade === b.quantidade) {
              return b.valor - a.valor;
            }
            return b.quantidade - a.quantidade;
        }
      })
      .slice(0, limite);
  }, []);

  // Produtos ordenados memoizados para evitar cálculos desnecessários
  const produtosOrdenados = useMemo(() => {
    return {
      equipamentos: ordenarProdutos(equipamentos, ordenacao),
      acessorios: ordenarProdutos(acessorios, ordenacao),
      acessoriosEspeciais: ordenarProdutos(acessoriosEspeciais, ordenacao),
      acessoriosSextavados: ordenarProdutos(acessoriosSextavados, ordenacao),
      acessoriosEmborrachados: ordenarProdutos(acessoriosEmborrachados, ordenacao)
    };
  }, [equipamentos, acessorios, acessoriosEspeciais, acessoriosSextavados, acessoriosEmborrachados, ordenacao, ordenarProdutos]);

  // Funções para manipular estados
  const mudarVisualizacao = useCallback((tipo: VisualizacaoTipo) => {
    setVisualizacao(tipo);
  }, []);
  
  const mudarOrdenacao = useCallback((tipo: OrdenacaoTipo) => {
    setOrdenacao(tipo);
  }, []);
  
  // Função para abrir o modal de detalhes do produto
  const abrirDetalhesProduto = useCallback((produto: ProdutoItem) => {
    // Criar uma cópia para não alterar o objeto original
    const produtoCopy = { ...produto };
    
    // Garantir que temos um ID (podemos substituir por nome se necessário)
    if (!produtoCopy.id) {
      produtoCopy.id = produtoCopy.nome.replace(/\s+/g, '_').toLowerCase();
    }
    
    setProdutoSelecionado(produtoCopy);
    setModalAberto(true);
  }, []);
  
  // Função para abrir o modal de detalhes da venda
  const abrirDetalhesVenda = useCallback((venda: any) => {
    setVendaSelecionada(venda);
    setVendaModalAberto(true);
  }, []);

  return {
    // Estados
    loading,
    erro,
    ordenacao,
    visualizacao,
    modalAberto,
    produtoSelecionado,
    vendaModalAberto,
    vendaSelecionada,
    
    // Dados
    produtos,
    equipamentos,
    acessorios,
    acessoriosEspeciais,
    acessoriosSextavados,
    acessoriosEmborrachados,
    
    // Produtos pré-ordenados para melhor performance
    produtosOrdenados,
    
    // Funções de ordenação
    ordenarProdutos,
    
    // Formatadores
    formatarDinheiro,
    formatarMargem,
    
    // Manipuladores de estado
    setModalAberto,
    setVendaModalAberto,
    mudarVisualizacao,
    mudarOrdenacao,
    abrirDetalhesProduto,
    abrirDetalhesVenda
  };
}; 