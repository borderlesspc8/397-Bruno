import { NextRequest, NextResponse } from "next/server";
import { processarDatasURL } from "@/app/_utils/dates";
import { BetelTecnologiaService } from '@/app/_services/betelTecnologia';
import { writeFileSync } from 'fs';
import { join } from 'path';

// Configuração para forçar o comportamento dinâmico
export const dynamic = "force-dynamic";


/**
 * GET /api/gestao-click/produtos-mais-vendidos
 * Busca os produtos mais vendidos com base nas vendas do Gestão Click
 * Filtra produtos repetidos por nome ou ID e gera ranking dos mais vendidos
 */
export async function GET(req: NextRequest) {
  try {
    // Obter parâmetros da requisição
    const searchParams = req.nextUrl.searchParams;
    const userEmail = searchParams.get("userEmail");
    const dataInicio = searchParams.get("dataInicio");
    const dataFim = searchParams.get("dataFim");
    const debug = searchParams.get("debug") === "true";

    // Validar parâmetros obrigatórios
    if (!userEmail) {
      return NextResponse.json({ 
        erro: "Email do usuário não fornecido",
        produtos: [] 
      }, { status: 400 });
    }

    // Validar e processar parâmetros de data
    const resultadoDatas = processarDatasURL(dataInicio, dataFim);
    
    // Se houve erro no processamento das datas
    if (!resultadoDatas.success) {
      return NextResponse.json(
        { 
          erro: resultadoDatas.error,
          produtos: []
        },
        { status: 400 }
      );
    }

    console.log(`Buscando produtos mais vendidos para o usuário ${userEmail} de ${resultadoDatas.dataInicio?.toISOString()} até ${resultadoDatas.dataFim?.toISOString()}`);

    try {
      // Buscar vendas diretamente do serviço BetelTecnologiaService
      const vendasResult = await BetelTecnologiaService.buscarVendas({
        dataInicio: resultadoDatas.dataInicio!,
        dataFim: resultadoDatas.dataFim!
      });

      // Verificar se houve erro na busca das vendas
      if (vendasResult.erro) {
        return NextResponse.json({ 
          erro: `Erro ao buscar vendas: ${vendasResult.erro}`,
          produtos: [] 
        }, { status: 500 });
      }

      // Log para depuração da estrutura das vendas
      console.log(`Total de vendas encontradas: ${vendasResult.vendas.length}`);
      
      // Se o modo debug estiver ativado, salvar os dados para análise
      if (debug && vendasResult.vendas.length > 0) {
        const amostraVendas = vendasResult.vendas.slice(0, 5); // Limitar a 5 vendas para não sobrecarregar o log
        try {
          const jsonDados = JSON.stringify(amostraVendas, null, 2);
          console.log('===== AMOSTRA DE VENDAS PARA DIAGNÓSTICO =====');
          console.log(jsonDados.substring(0, 2000) + '...'); // Limitar a saída para não sobrecarregar o console
        } catch (e) {
          console.log('Erro ao serializar vendas para log:', e);
        }
      }
      
      // Verificar a estrutura real da primeira venda para debug
      if (vendasResult.vendas.length > 0) {
        const primeiraVenda = vendasResult.vendas[0];
        const vendasProdutos = {};
        
        // Adicionar estrutura para os produtos associados
        console.log('Estrutura da primeira venda:');
        console.log(JSON.stringify({
          id: primeiraVenda.id,
          propriedades: Object.keys(primeiraVenda)
        }, null, 2));
        
        // Encontrar campos que podem conter produtos
        Object.keys(primeiraVenda).forEach(prop => {
          const valor = primeiraVenda[prop];
          
          // Se for um array, pode ser uma lista de produtos
          if (Array.isArray(valor)) {
            vendasProdutos[prop] = { tipo: 'array', itens: valor.length };
            console.log(`Propriedade '${prop}' é um array com ${valor.length} itens`);
            
            if (valor.length > 0) {
              // Registrar as propriedades do primeiro item do array
              const primeiroItem = valor[0];
              if (typeof primeiroItem === 'object' && primeiroItem !== null) {
                vendasProdutos[prop].estrutura = {
                  propriedades: Object.keys(primeiroItem),
                  amostra: primeiroItem
                };
                console.log(`Estrutura do primeiro item de '${prop}':`, 
                  JSON.stringify({
                    propriedades: Object.keys(primeiroItem),
                    amostra: Object.keys(primeiroItem).reduce((acc, key) => {
                      acc[key] = typeof primeiroItem[key] === 'object' ? 
                        `[${typeof primeiroItem[key]}]` : 
                        primeiroItem[key];
                      return acc;
                    }, {})
                  }, null, 2)
                );
              } else {
                console.log(`Primeiro item de '${prop}' não é um objeto:`, primeiroItem);
              }
            }
          } 
          // Se for um objeto, pode ter produtos aninhados
          else if (typeof valor === 'object' && valor !== null) {
            vendasProdutos[prop] = { tipo: 'objeto', propriedades: Object.keys(valor) };
            console.log(`Propriedade '${prop}' é um objeto com propriedades:`, Object.keys(valor).join(', '));
            
            // Verificar se alguma propriedade do objeto é um array
            Object.keys(valor).forEach(subProp => {
              const subValor = valor[subProp];
              if (Array.isArray(subValor)) {
                vendasProdutos[prop][subProp] = { tipo: 'array', itens: subValor.length };
                console.log(`Propriedade '${prop}.${subProp}' é um array com ${subValor.length} itens`);
                
                if (subValor.length > 0) {
                  // Registrar as propriedades do primeiro item do array
                  const primeiroSubItem = subValor[0];
                  if (typeof primeiroSubItem === 'object' && primeiroSubItem !== null) {
                    vendasProdutos[prop][subProp].estrutura = {
                      propriedades: Object.keys(primeiroSubItem),
                      amostra: primeiroSubItem
                    };
                    console.log(`Estrutura do primeiro item de '${prop}.${subProp}':`, 
                      JSON.stringify({
                        propriedades: Object.keys(primeiroSubItem),
                        amostra: Object.keys(primeiroSubItem).reduce((acc, key) => {
                          acc[key] = typeof primeiroSubItem[key] === 'object' ? 
                            `[${typeof primeiroSubItem[key]}]` : 
                            primeiroSubItem[key];
                          return acc;
                        }, {})
                      }, null, 2)
                    );
                  }
                }
              }
            });
          }
        });
        
        // Resumo das estruturas encontradas
        console.log('Resumo das estruturas de produtos encontradas:', JSON.stringify(vendasProdutos, null, 2));
      }

      // Processar produtos das vendas com lógica corrigida
      const produtosMaisVendidos = processarProdutosMaisVendidos(vendasResult.vendas);
      
      // Log para debug dos valores unitários dos produtos
      if (debug) {
        console.log("===== VALORES UNITÁRIOS DOS PRODUTOS =====");
        produtosMaisVendidos.forEach(p => {
          const valorUnitario = p.quantidade > 0 ? (p.valor / p.quantidade) : 0;
          console.log(`${p.nome}: valor=${p.valor}, quantidade=${p.quantidade}, valorUnitario=${valorUnitario}`);
        });
      }
      
      // Verificar especificamente produtos de alto valor nas vendas originais
      if (debug) {
        console.log("===== BUSCANDO PRODUTOS DE ALTO VALOR NAS VENDAS ORIGINAIS =====");
        vendasResult.vendas.forEach((venda: any) => {
          if (venda.produtos && Array.isArray(venda.produtos)) {
            venda.produtos.forEach((produtoWrapper: any) => {
              if (produtoWrapper && produtoWrapper.produto) {
                const produto = produtoWrapper.produto;
                const nomeProduto = produto.nome_produto || produto.produto || produto.nome || '';
                const valorTotal = parseFloat(produto.valor_total || '0');
                const quantidade = parseFloat(produto.quantidade || '1');
                const valorUnitario = quantidade > 0 ? valorTotal / quantidade : 0;
                
                // Verificar se é um produto de alto valor ou contém termos de equipamentos
                const termosProcurados = ["ESTEIRA", "CROSS", "BIKE", "SPINNING", "LEG", "CADEIRA", "PUXADOR"];
                const contemTermoEquipamento = termosProcurados.some(termo => 
                  nomeProduto.toUpperCase().includes(termo)
                );
                
                if (valorUnitario >= 1000 || contemTermoEquipamento) {
                  console.log(`Produto de alto valor encontrado em venda original: "${nomeProduto}", valor unitário: ${valorUnitario}`);
                }
              }
            });
          }
        });
      }
      
      // Processar produtos individuais novamente para garantir que equipamentos sejam detectados
      const produtosIndividuaisVendas: any[] = [];
      
      // Extrair produtos individuais diretamente das vendas originais
      vendasResult.vendas.forEach((venda: any) => {
        if (venda.produtos && Array.isArray(venda.produtos)) {
          venda.produtos.forEach((produtoWrapper: any) => {
            if (produtoWrapper && produtoWrapper.produto) {
              const produto = produtoWrapper.produto;
              const nomeProduto = produto.nome_produto || produto.produto || produto.nome || '';
              const valorTotal = parseFloat(produto.valor_total || '0');
              const quantidade = parseFloat(produto.quantidade || '1');
              const valorCusto = parseFloat(produto.valor_custo || '0');
              const valorUnitario = quantidade > 0 ? valorTotal / quantidade : 0;
              
              // Adicionar ao array de produtos individuais
              produtosIndividuaisVendas.push({
                id: produto.produto_id || `auto-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                nome: nomeProduto,
                quantidade: quantidade,
                valor: valorTotal,
                valorUnitario: valorUnitario,
                custo: valorCusto * quantidade,
                margem: valorTotal - (valorCusto * quantidade),
                margemPercentual: valorTotal > 0 
                  ? Math.round(((valorTotal - (valorCusto * quantidade)) / valorTotal) * 100)
                  : 0
              });
            }
          });
        }
      });
      
      if (debug) {
        console.log(`Total de produtos individuais extraídos diretamente das vendas: ${produtosIndividuaisVendas.length}`);
        
        // Mostrar produtos com valor unitário alto
        const produtosAltoValor = produtosIndividuaisVendas.filter(p => p.valorUnitario >= 1000);
        console.log(`Produtos com valor unitário >= 1000: ${produtosAltoValor.length}`);
        produtosAltoValor.forEach(p => {
          console.log(`- ${p.nome}: valorUnitario=${p.valorUnitario}, valor=${p.valor}, quantidade=${p.quantidade}`);
        });
      }

      // Lista de termos para identificar equipamentos pelo nome
      const termosEquipamento = [
        "ESTEIRA", "BICICLETA", "BIKE", "BANCO", "SMITH", "CROSS", "MULTIESTAÇÃO",
        "LEG", "HACK", "EXTENSOR", "PECK DECK", "TORRE", "PUXADOR", "REMADA",
        "CADEIRA EXTENSORA", "CADEIRA FLEXORA", "ERGOMÉTRICA", "ELÍPTICO", "SPINNING",
        "SUPINO", "RACK", "APARELHO", "MULTIEXERCITADOR", "MÁQUINA", "MAQUINA"
      ];
      
      // Termos que indicam acessórios mesmo contendo palavras de equipamentos
      const termosAcessorios = [
        "SILICONE", "LUBRIFICANTE", "CAPA", "PROTETOR", "CORREIA", 
        "CHAVE", "PARAFUSO", "KIT", "ACESSÓRIO", "ACESSORIO", "PEÇA", "PECA"
      ];
      
      // Verificar se existem produtos específicos na lista que NÃO foram classificados corretamente
      const nomesEspeciais = ["ESTEIRA", "BIKE SPINNING", "CROSS SMITH", "LEG"];
      const produtosEspeciais = produtosMaisVendidos.filter(p => 
        nomesEspeciais.some(termo => p.nome.toUpperCase().includes(termo))
      );
      
      if (debug && produtosEspeciais.length > 0) {
        console.log("===== PRODUTOS ESPECIAIS ENCONTRADOS =====");
        produtosEspeciais.forEach(p => {
          console.log(`${p.nome}: valor=${p.valor}, quantidade=${p.quantidade}, valorUnitario=${p.valorUnitario}`);
        });
      }
      
      // Combinar produtos extraídos de vendas individuais com os já processados
      // Evitar duplicação verificando por nome
      const nomesExistentes = new Set(produtosMaisVendidos.map(p => p.nome.toLowerCase()));
      
      // Filtrar produtos individuais que não existem na lista principal
      const produtosIndividuaisUnicos = produtosIndividuaisVendas.filter(
        p => !nomesExistentes.has(p.nome.toLowerCase())
      );
      
      // Verificar produtos importantes para garantir que estão incluídos
      const produtosImportantes = produtosIndividuaisVendas.filter(p => 
        nomesEspeciais.some(termo => p.nome.toUpperCase().includes(termo))
      );
      
      if (debug) {
        console.log(`Produtos importantes encontrados nas vendas individuais: ${produtosImportantes.length}`);
        produtosImportantes.forEach(p => {
          console.log(`- ${p.nome}: valorUnitario=${p.valorUnitario}`);
        });
      }
      
      // Mesclar os produtos das duas fontes
      const produtosFinais = [...produtosMaisVendidos, ...produtosImportantes];
      
      // Identificar equipamentos por valor unitário OU nome do produto
      const equipamentos = produtosFinais.filter(p => {
        // Produtos sem quantidade válida não são considerados
        if (p.quantidade <= 0) return false;
        
        // Verificar valor unitário (valor por unidade)
        const valorUnitario = p.valorUnitario || (p.quantidade > 0 ? p.valor / p.quantidade : 0);
        const ehEquipamentoPorValor = valorUnitario >= 1000;
        
        // Se for equipamento pelo valor, sim, independente do nome
        if (ehEquipamentoPorValor) {
          if (debug) {
            console.log(`EQUIPAMENTO POR VALOR: ${p.nome}, valorUnitario=${valorUnitario}`);
          }
          return true;
        }
        
        // Se NÃO for equipamento pelo valor, verificar por nome
        // Mas só classificar como equipamento se não contiver termos de acessórios
        const nomeUpperCase = p.nome.toUpperCase();
        
        // Verificar primeiro se contém termos de acessórios
        const contemTermoAcessorio = termosAcessorios.some(termo => 
          nomeUpperCase.includes(termo)
        );
        
        // Se contém termos de acessórios, não é equipamento
        if (contemTermoAcessorio) {
          if (debug) {
            console.log(`NÃO É EQUIPAMENTO (TERMO ACESSÓRIO): ${p.nome}`);
          }
          return false;
        }
        
        // Agora verificar se contém termos de equipamentos
        const contemTermoEquipamento = termosEquipamento.some(termo => 
          // Verificar se o termo é uma palavra completa ou parte bem definida do nome
          // Evitar falsos positivos como "SILICONE PARA ESTEIRA" que não é um equipamento
          nomeUpperCase.includes(` ${termo} `) || 
          nomeUpperCase.startsWith(`${termo} `) || 
          nomeUpperCase.endsWith(` ${termo}`) ||
          nomeUpperCase === termo
        );
        
        // Para debug
        if (debug && contemTermoEquipamento) {
          console.log(`EQUIPAMENTO POR NOME: ${p.nome}, valorUnitario=${valorUnitario}`);
        }
        
        return contemTermoEquipamento;
      });
      
      // Produtos que não são equipamentos são classificados como acessórios
      const acessorios = produtosFinais.filter(p => {
        // Produtos sem quantidade válida não são considerados
        if (p.quantidade <= 0) return false;
        
        // Verificar valor unitário (valor por unidade)
        const valorUnitario = p.valorUnitario || (p.quantidade > 0 ? p.valor / p.quantidade : 0);
        const ehEquipamentoPorValor = valorUnitario >= 1000;
        
        // Se for equipamento pelo valor, não é acessório
        if (ehEquipamentoPorValor) {
          return false;
        }
        
        // Verificar por nome (mesma lógica do equipamento, mas invertida)
        const nomeUpperCase = p.nome.toUpperCase();
        
        // Verificar primeiro se contém termos de acessórios
        const contemTermoAcessorio = termosAcessorios.some(termo => 
          nomeUpperCase.includes(termo)
        );
        
        // Se contém termos de acessórios, é acessório
        if (contemTermoAcessorio) {
          return true;
        }
        
        // Verificar se contém termos de equipamentos
        const contemTermoEquipamento = termosEquipamento.some(termo => 
          nomeUpperCase.includes(` ${termo} `) || 
          nomeUpperCase.startsWith(`${termo} `) || 
          nomeUpperCase.endsWith(` ${termo}`) ||
          nomeUpperCase === termo
        );
        
        // Se não contém termos de equipamentos, é acessório
        return !contemTermoEquipamento;
      });
      
      // Remover duplicados por nome
      const equipamentosUnicos = removerDuplicadosPorNome(equipamentos);
      const acessoriosUnicos = removerDuplicadosPorNome(acessorios);
      
      // Adicionar dados de debug
      const dadosRetorno = {
        produtos: produtosFinais,
        equipamentos: equipamentosUnicos,
        acessorios: acessoriosUnicos,
        totalProdutos: produtosFinais.length,
        totalVendas: vendasResult.totalVendas,
        totalFaturamento: produtosFinais.reduce((acc, produto) => acc + produto.valor, 0)
      };
      
      if (debug) {
        Object.assign(dadosRetorno, {
          debug: {
            totalEquipamentos: equipamentosUnicos.length,
            totalAcessorios: acessoriosUnicos.length,
            totalProdutosFinais: produtosFinais.length
          }
        });
      }
      
      // Retornar dados formatados para o componente
      return NextResponse.json(dadosRetorno);
    } catch (error) {
      console.error("Erro ao processar produtos mais vendidos:", error);
      return NextResponse.json({ 
        erro: error instanceof Error ? error.message : "Erro ao buscar produtos mais vendidos",
        produtos: [] 
      }, { status: 500 });
    }
  } catch (error) {
    console.error("Erro na rota de produtos mais vendidos:", error);
    return NextResponse.json({ 
      erro: error instanceof Error ? error.message : "Erro interno no servidor",
      produtos: [] 
    }, { status: 500 });
  }
}

/**
 * Processa todas as vendas para obter produtos mais vendidos
 * Filtra produtos repetidos por nome ou ID
 */
function processarProdutosMaisVendidos(vendas: any[]) {
  // Inicializar map para contagem de produtos
  const produtosContagem = new Map();
  const produtosPorNome = new Map();
  
  let totalProdutosProcessados = 0;
  
  // Processar todas as vendas
  vendas.forEach((venda, indexVenda) => {
    // Caso específico: Verificar a propriedade "produtos" com formato { produto: {...} }
    if (venda.produtos && Array.isArray(venda.produtos)) {
      venda.produtos.forEach((produtoWrapper: any) => {
        if (produtoWrapper && produtoWrapper.produto) {
          // Incrementar contador de processamento
          totalProdutosProcessados++;
          
          // Extrair o produto do wrapper
          const produto = produtoWrapper.produto;
          
          // Extrair valores diretos da estrutura conhecida
          let produtoId = produto.produto_id?.toString() || produto.id?.toString();
          let nomeProduto = produto.nome_produto || produto.produto || produto.nome;
          let quantidade = parseFloat(produto.quantidade || "1");
          
          // Extrair valores específicos de custo e venda
          let valorVenda = parseFloat(produto.valor_venda || produto.valor_unitario || "0");
          let valorCusto = parseFloat(produto.valor_custo || "0"); 
          
          // Calcular valores totais
          let valorTotal = produto.valor_total 
            ? parseFloat(produto.valor_total) 
            : quantidade * valorVenda;
            
          let custoTotal = valorCusto > 0 
            ? valorCusto * quantidade 
            : 0;
          
          let categoria = produto.categoria || "Não categorizado";
          
          // Valor unitário = valor total dividido pela quantidade
          let valorUnitario = quantidade > 0 ? valorTotal / quantidade : 0;
          
          // Log para debug - identificar valores unitários altos
          if (valorUnitario >= 1000) {
            console.log(`Potencial equipamento encontrado: ${nomeProduto}, valor unitário: ${valorUnitario}`);
          }
          
          // Definir chave de identificação
          const chaveIdentificacao = (produtoId ? produtoId.toString() : '') || nomeProduto.toLowerCase().trim();
          
          // Verificar se já existe um produto com este nome em outra chave
          if (!produtoId && produtosPorNome.has(nomeProduto.toLowerCase().trim())) {
            // Usar a chave existente em vez de criar uma nova
            const chaveExistente = produtosPorNome.get(nomeProduto.toLowerCase().trim());
            
            if (chaveExistente && produtosContagem.has(chaveExistente)) {
              const produtoExistente = produtosContagem.get(chaveExistente);
              produtoExistente.quantidade += quantidade;
              produtoExistente.valor += valorTotal;
              
              // Calcular custo, margem e margem percentual baseados na disponibilidade do custo real
              if (valorCusto > 0) {
                // Usar valor de custo real disponível
                produtoExistente.custo += custoTotal;
                
                // Calcular margem e margem percentual
                produtoExistente.margem = produtoExistente.valor - produtoExistente.custo;
                produtoExistente.margemPercentual = produtoExistente.valor > 0 
                  ? Math.round((produtoExistente.margem / produtoExistente.valor) * 100) 
                  : 0;
              } else {
                // Quando não há custo informado, usar "N/A" para a margem percentual
                produtoExistente.margem = 0;
                produtoExistente.margemPercentual = 'N/A';
              }
              return;
            }
          }
          
          // Se não existe um produto com esta chave, criar novo
          if (!produtosContagem.has(chaveIdentificacao)) {
            produtosContagem.set(chaveIdentificacao, {
              id: produtoId || `auto-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
              nome: nomeProduto,
              categoria: categoria,
              quantidade: 0,
              valor: 0,
              custo: 0,
              margem: 0,
              margemPercentual: 'N/A', // Valor padrão quando não há informação de custo
              valorUnitario: 0 // Inicializa o valorUnitario
            });
            
            // Registrar o nome do produto para facilitar a detecção de duplicatas
            if (nomeProduto) {
              produtosPorNome.set(nomeProduto.toLowerCase().trim(), chaveIdentificacao);
            }
          }
          
          // Atualizar contagem e valor do produto
          const produtoInfo = produtosContagem.get(chaveIdentificacao);
          produtoInfo.quantidade += quantidade;
          produtoInfo.valor += valorTotal;
          
          // Atualizar o valorUnitario a cada adição
          produtoInfo.valorUnitario = produtoInfo.quantidade > 0 ? produtoInfo.valor / produtoInfo.quantidade : 0;
          
          // Calcular custo, margem e margem percentual baseados na disponibilidade do custo real
          if (valorCusto > 0) {
            // Usar valor de custo real disponível
            produtoInfo.custo += custoTotal;
            
            // Calcular margem e margem percentual
            produtoInfo.margem = produtoInfo.valor - produtoInfo.custo;
            produtoInfo.margemPercentual = produtoInfo.valor > 0 
              ? Math.round((produtoInfo.margem / produtoInfo.valor) * 100) 
              : 0;
          } else {
            // Quando não há custo informado, usar "N/A" para a margem percentual
            produtoInfo.margem = 0;
            produtoInfo.margemPercentual = 'N/A';
          }
        }
      });
    }
    
    // Continue verificando outras propriedades genéricas da venda
    Object.keys(venda).forEach(propriedade => {
      // Ignorar a propriedade "produtos" que já foi processada acima
      if (propriedade === 'produtos') return;
      
      const valorPropriedade = venda[propriedade];
      
      // Caso 1: A propriedade é um array (lista de produtos/itens)
      if (Array.isArray(valorPropriedade)) {
        processarArrayProdutos(valorPropriedade, produtosContagem, produtosPorNome, totalProdutosProcessados, indexVenda === 0, propriedade);
      } 
      // Caso 2: A propriedade é um objeto que pode conter lista de produtos
      else if (typeof valorPropriedade === 'object' && valorPropriedade !== null) {
        // Verificar se há alguma propriedade que seja um array dentro deste objeto
        Object.keys(valorPropriedade).forEach(subProp => {
          const subValor = valorPropriedade[subProp];
          if (Array.isArray(subValor)) {
            // Pode ser uma lista de produtos aninhada
            const caminho = `${propriedade}.${subProp}`;
            processarArrayProdutos(subValor, produtosContagem, produtosPorNome, totalProdutosProcessados, indexVenda === 0, caminho);
          }
        });
      }
    });
  });
  
  console.log(`Total de produtos processados: ${totalProdutosProcessados}`);
  console.log(`Total de produtos únicos encontrados: ${produtosContagem.size}`);
  
  // Converter para array e ordenar por quantidade (decrescente)
  const result = Array.from(produtosContagem.values())
    .sort((a, b) => b.quantidade - a.quantidade)
    .slice(0, 15); // Retornar os 15 mais vendidos
  
  return result;
}

/**
 * Processa um array que pode conter produtos
 */
function processarArrayProdutos(
  array: any[], 
  produtosContagem: Map<string, any>, 
  produtosPorNome: Map<string, string>,
  totalProcessados: number,
  logDetalhes: boolean = false,
  caminho: string = 'desconhecido'
) {
  if (!Array.isArray(array) || array.length === 0) return;
  
  if (logDetalhes) {
    console.log(`Analisando possíveis produtos em '${caminho}' (${array.length} itens)`);
    console.log(`Exemplo de item:`, JSON.stringify(array[0], null, 2));
  }
  
  // Verifica se os itens do array parecem ser produtos (tem pelo menos uma das propriedades típicas)
  const primeiroItem = array[0];
  const temPropriedadesDeProduto = verificarSeEProduto(primeiroItem);
  
  if (!temPropriedadesDeProduto) {
    if (logDetalhes) {
      console.log(`Os itens em '${caminho}' não parecem ser produtos.`);
    }
    return;
  }
  
  if (logDetalhes) {
    console.log(`Os itens em '${caminho}' parecem ser produtos. Processando...`);
  }
  
  // Processar cada item no array como produto
  array.forEach(produto => {
    if (!produto || typeof produto !== 'object') return;
    
    totalProcessados++;
    
    // Extrair valores, lidando com possíveis estruturas aninhadas
    let produtoId = extrairValorProduto(produto, ['produto_id', 'id', 'product_id', 'code', 'codigo']);
    let nomeProduto = extrairValorProduto(produto, ['produto_nome', 'nome', 'name', 'descricao', 'description', 'produto', 'product']);
    let quantidade = extrairValorNumerico(produto, ['quantidade', 'quantity', 'qtd', 'amount']);

    // Extrair valores específicos de venda e custo
    let valorVenda = extrairValorNumerico(produto, ['valor_venda', 'valor_unitario', 'preco_unitario', 'preco', 'price', 'unit_price', 'unit_value']);
    let valorCusto = extrairValorNumerico(produto, ['valor_custo', 'custo', 'preco_custo', 'cost', 'cost_price', 'cost_value']);

    // Calcular valores totais
    let valorTotal = extrairValorNumerico(produto, ['valor_total', 'total', 'price_total', 'total_value']);
    if (!valorTotal || isNaN(valorTotal)) {
      valorTotal = quantidade * valorVenda;
    }

    let custoTotal = valorCusto > 0 ? valorCusto * quantidade : 0;
    let categoria = extrairValorProduto(produto, ['categoria', 'category', 'grupo', 'group']);
    
    // Se for um objeto no formato não esperado, verificar subpropriedades
    if (typeof produto === 'object' && (!nomeProduto || nomeProduto === '[object Object]')) {
      for (const chave in produto) {
        const subValor = produto[chave];
        if (typeof subValor === 'object' && subValor !== null) {
          // Tentar encontrar nome do produto em subpropriedades
          const subNome = extrairValorProduto(subValor, ['produto_nome', 'nome', 'name', 'descricao', 'description', 'produto', 'product']);
          if (subNome && subNome !== '[object Object]') {
            nomeProduto = subNome;
            // Verificar outras propriedades importantes no mesmo nível
            if (!produtoId) produtoId = extrairValorProduto(subValor, ['produto_id', 'id', 'product_id', 'code', 'codigo']);
            if (!quantidade) quantidade = extrairValorNumerico(subValor, ['quantidade', 'quantity', 'qtd', 'amount']);
            if (!valorVenda) valorVenda = extrairValorNumerico(subValor, ['valor_venda', 'valor_unitario', 'preco_unitario', 'preco', 'price', 'unit_price', 'unit_value']);
            if (!valorCusto) valorCusto = extrairValorNumerico(subValor, ['valor_custo', 'custo', 'preco_custo', 'cost', 'cost_price', 'cost_value']);
            if (!valorTotal) valorTotal = extrairValorNumerico(subValor, ['valor_total', 'total', 'price_total', 'total_value']);
            if (!custoTotal) custoTotal = valorCusto > 0 ? valorCusto * quantidade : 0;
            if (!categoria) categoria = extrairValorProduto(subValor, ['categoria', 'category', 'grupo', 'group']);
            break;
          }
        }
      }
    }
    
    // Valores padrão para campos não encontrados
    if (!nomeProduto || nomeProduto === '[object Object]') {
      nomeProduto = "Produto sem nome " + (produtoId || Math.random().toString(36).substring(2, 9));
    }
    
    if (!quantidade || isNaN(quantidade)) quantidade = 1;
    if (!valorVenda || isNaN(valorVenda)) valorVenda = 0;
    
    // Calcular valor total se não encontrado
    if (!valorTotal || isNaN(valorTotal)) {
      valorTotal = quantidade * valorVenda;
    }
    
    if (!categoria) categoria = "Não categorizado";
          
          // Definir chave de identificação (preferência para ID, mas uso do nome se não houver ID)
          const chaveIdentificacao = (produtoId ? produtoId.toString() : '') || nomeProduto.toLowerCase().trim();
          
          // Verificar se já existe um produto com este nome em outra chave
          if (!produtoId && produtosPorNome.has(nomeProduto.toLowerCase().trim())) {
            // Usar a chave existente em vez de criar uma nova
            const chaveExistente = produtosPorNome.get(nomeProduto.toLowerCase().trim());
            
            if (chaveExistente && produtosContagem.has(chaveExistente)) {
              const produtoExistente = produtosContagem.get(chaveExistente);
              produtoExistente.quantidade += quantidade;
              produtoExistente.valor += valorTotal;
              
              // Calcular custo, margem e margem percentual baseados na disponibilidade do custo real
              if (valorCusto > 0) {
                // Usar valor de custo real disponível
                produtoExistente.custo += custoTotal;
                
                // Calcular margem e margem percentual
                produtoExistente.margem = produtoExistente.valor - produtoExistente.custo;
                produtoExistente.margemPercentual = produtoExistente.valor > 0 
                  ? Math.round((produtoExistente.margem / produtoExistente.valor) * 100) 
                  : 0;
              } else {
                // Quando não há custo informado, usar "N/A" para a margem percentual
                produtoExistente.margem = 0;
                produtoExistente.margemPercentual = 'N/A';
              }
              return;
            }
          }
          
          // Se não existe um produto com esta chave, criar novo
          if (!produtosContagem.has(chaveIdentificacao)) {
            produtosContagem.set(chaveIdentificacao, {
              id: produtoId || `auto-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
              nome: nomeProduto,
              categoria: categoria,
              quantidade: 0,
              valor: 0,
              custo: 0,
              margem: 0,
              margemPercentual: 'N/A', // Valor padrão quando não há informação de custo
              valorUnitario: 0 // Inicializa o valorUnitario
            });
            
            // Registrar o nome do produto para facilitar a detecção de duplicatas
            if (nomeProduto) {
              produtosPorNome.set(nomeProduto.toLowerCase().trim(), chaveIdentificacao);
            }
          }
          
          // Atualizar contagem e valor do produto
          const produtoInfo = produtosContagem.get(chaveIdentificacao);
          produtoInfo.quantidade += quantidade;
          produtoInfo.valor += valorTotal;
          
          // Atualizar o valorUnitario a cada adição
          produtoInfo.valorUnitario = produtoInfo.quantidade > 0 ? produtoInfo.valor / produtoInfo.quantidade : 0;
          
          // Calcular custo, margem e margem percentual baseados na disponibilidade do custo real
          if (valorCusto > 0) {
            // Usar valor de custo real disponível
            produtoInfo.custo += custoTotal;
            
            // Calcular margem e margem percentual
            produtoInfo.margem = produtoInfo.valor - produtoInfo.custo;
            produtoInfo.margemPercentual = produtoInfo.valor > 0 
              ? Math.round((produtoInfo.margem / produtoInfo.valor) * 100) 
              : 0;
          } else {
            // Quando não há custo informado, usar "N/A" para a margem percentual
            produtoInfo.margem = 0;
            produtoInfo.margemPercentual = 'N/A';
          }
        });
      }

/**
 * Verifica se um objeto tem características de um produto
 */
function verificarSeEProduto(item: any): boolean {
  if (!item || typeof item !== 'object') return false;
  
  // Lista de propriedades típicas de produtos
  const propriedadesProduto = [
    'produto_id', 'id', 'product_id', 'code', 'codigo',
    'produto_nome', 'nome', 'name', 'descricao', 'description', 'produto', 'product',
    'quantidade', 'quantity', 'qtd', 'amount',
    'valor_unitario', 'preco_unitario', 'preco', 'price', 'unit_price', 'unit_value',
    'valor_total', 'total', 'price_total', 'total_value',
    'categoria', 'category', 'grupo', 'group'
  ];
  
  // Verifica se o objeto tem pelo menos uma dessas propriedades
  for (const prop of propriedadesProduto) {
    if (item[prop] !== undefined) {
      return true;
    }
  }
  
  // Verificar subpropriedades para casos de objetos aninhados
  for (const chave in item) {
    const valor = item[chave];
    if (typeof valor === 'object' && valor !== null) {
      for (const prop of propriedadesProduto) {
        if (valor[prop] !== undefined) {
          return true;
        }
      }
    }
  }
  
  return false;
}

/**
 * Extrai valor de texto de um objeto, verificando múltiplos campos possíveis
 */
function extrairValorProduto(objeto: any, camposPossiveis: string[]): string {
  if (!objeto || typeof objeto !== 'object') return '';
  
  for (const campo of camposPossiveis) {
    if (objeto[campo] !== undefined && objeto[campo] !== null) {
      // Se for um objeto, tenta extrair um valor útil dele
      if (typeof objeto[campo] === 'object') {
        // Para objetos, tenta encontrar uma propriedade que pareça um nome ou descrição
        const subObjeto = objeto[campo];
        const subCampos = ['nome', 'name', 'descricao', 'description', 'texto', 'text', 'value', 'valor'];
        
        for (const subCampo of subCampos) {
          if (subObjeto[subCampo] !== undefined && typeof subObjeto[subCampo] !== 'object') {
            return String(subObjeto[subCampo]);
          }
        }
        
        // Se não encontrou nenhum subcampo útil, retorna uma string representando o objeto
        return '[object Object]';
      }
      
      return String(objeto[campo]);
    }
  }
  
  return '';
}

/**
 * Extrai valor numérico de um objeto, verificando múltiplos campos possíveis
 */
function extrairValorNumerico(objeto: any, camposPossiveis: string[]): number {
  if (!objeto || typeof objeto !== 'object') return 0;
  
  for (const campo of camposPossiveis) {
    if (objeto[campo] !== undefined && objeto[campo] !== null) {
      const valor = objeto[campo];
      
      // Tentar converter para número
      if (typeof valor === 'number') {
        return valor;
      } else if (typeof valor === 'string') {
        const numero = parseFloat(valor.replace(',', '.'));
        if (!isNaN(numero)) {
          return numero;
        }
      }
    }
  }
  
  return 0;
}

/**
 * Remove produtos duplicados pelo nome
 */
function removerDuplicadosPorNome(produtos: any[]): any[] {
  const mapaDeNomes = new Map();
  
  produtos.forEach(produto => {
    const nomeLowerCase = produto.nome.toLowerCase();
    
    // Se este nome já existe, mantenha o produto com maior valor
    if (mapaDeNomes.has(nomeLowerCase)) {
      const produtoExistente = mapaDeNomes.get(nomeLowerCase);
      
      // Substitua somente se o novo produto tiver maior valor
      if (produto.valor > produtoExistente.valor) {
        mapaDeNomes.set(nomeLowerCase, produto);
      }
    } else {
      mapaDeNomes.set(nomeLowerCase, produto);
    }
  });
  
  return Array.from(mapaDeNomes.values());
} 
