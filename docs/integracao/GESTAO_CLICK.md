# Integração com Gestão Click

Este documento descreve o funcionamento da integração com o Gestão Click, incluindo o processo de importação de transações e o mapeamento de categorias.

## Mapeamento de Categorias

A importação de transações do Gestão Click requer um mapeamento entre as categorias textuais do Gestão Click e as strings de categoria utilizadas no sistema. Este mapeamento é realizado através do método `mapCategoryToEnum` no serviço `GestaoClickService`.

### Funcionamento do Mapeamento

1. **Normalização**: As categorias recebidas do Gestão Click são normalizadas (removidos acentos, convertidas para minúsculas, etc.) para facilitar o mapeamento.

2. **Correspondência Exata**: O sistema verifica primeiro se há uma correspondência exata da categoria no mapeamento predefinido.

3. **Correspondência Parcial**: Se não houver correspondência exata, o sistema procura por correspondências parciais (se o texto da categoria contém uma das chaves do mapeamento).

4. **Categoria Padrão**: Se nenhuma correspondência for encontrada, o sistema retorna a categoria padrão (`OTHER`).

### Persistência de Mapeamentos

Os mapeamentos são armazenados na tabela `CategoryMapping` para permitir personalização futura:

1. Ao processar uma categoria, o sistema verifica se já existe um mapeamento para aquela categoria externa.

2. Se existir, utiliza o mapeamento existente.

3. Se não existir, cria um novo mapeamento usando a categoria mapeada pelo algoritmo.

### Mapeamento Predefinido

O sistema inclui um conjunto extenso de categorias comuns do Gestão Click mapeadas para os valores correspondentes de string de categoria, incluindo:

- Categorias de vendas (balcão, produtos, delivery)
- Categorias de funcionários e encargos (salários, FGTS, comissões)
- Categorias de estoque e equipamentos
- Categorias de utilidades e serviços (energia, água, telefonia)

## Importação de Transações

O processo de importação de transações do Gestão Click segue estas etapas:

1. Autenticação na API do Gestão Click usando as credenciais configuradas.
2. Obtenção das transações para o período especificado.
3. Mapeamento das categorias utilizando o sistema descrito acima.
4. Criação das transações no banco de dados local.
5. Registro de centro de custos quando aplicável.

## Resolução de Conflitos

Durante a importação, o sistema verifica transações existentes para evitar duplicatas, usando os seguintes critérios:
- ID externo da transação
- Data e valor
- Carteira de destino

## Configuração

Para configurar a integração com o Gestão Click, são necessários:

1. API Key (obrigatório)
2. Secret Token (opcional)
3. API URL (opcional, usa a URL padrão se não for fornecida)

## Solução de Problemas

Se ocorrerem erros durante a importação de transações do Gestão Click, verifique:

1. **Credenciais**: Certifique-se de que as credenciais de API estão corretas.
2. **Categorias**: Verifique os logs para identificar categorias não mapeadas.
3. **Mapeamentos**: Você pode adicionar mapeamentos personalizados através da interface administrativa.

## Importações Completas e Limites

### Problema: Transações faltando na importação

Se você perceber que nem todas as transações estão sendo importadas do Gestão Click, isso pode ser devido aos limites de paginação e quantidade máxima de transações. Por padrão, o sistema limita a quantidade de transações para evitar sobrecarga.

### Como importar todas as transações:

1. **Ajuste os limites avançados**:
   - Acesse a tela de importação do Gestão Click
   - Expanda a seção "Filtros Avançados"
   - Aumente o "Limite por Página" para 500 (recomendado)
   - Aumente o "Máximo Total" para 20000 ou mais, dependendo do volume de transações

2. **Divida em períodos menores**:
   - Se o período total for muito grande, divida a importação em períodos menores
   - Por exemplo, em vez de importar um ano inteiro, importe três meses de cada vez

3. **Verifique os logs de importação**:
   - Após a importação, verifique quantas páginas foram processadas
   - Se o número de páginas for igual ao limite configurado (100), significa que pode haver mais transações para importar

### Exemplo de configuração para grandes volumes:

Para empresas com muitas transações, recomendamos:
- Limite por Página: 500
- Máximo Total: 20000
- Período máximo: 3 meses por importação

### Nota sobre performance:

Importações muito grandes podem demorar mais tempo para processar. O sistema foi otimizado para processar até 100 páginas de transações (com 500 transações por página) para cada tipo (pagamentos e recebimentos), totalizando potencialmente 100.000 transações em uma única importação.

---

## Atualizações

### 15 de setembro de 2023
- Documentação inicial para a integração

### Atualizado em: 30 de junho de 2024
- Corrigido o fluxo de automação para importar movimentações dos últimos 5 anos
- Anteriormente, as importações automáticas estavam limitadas apenas a movimentações recentes
- Ajustado o período de importação para garantir a busca completa (últimos 5 anos)
- Aumentado o limite de transações por requisição para melhorar a performance das importações
- Removida a restrição de status "liquidado" para permitir importação de transações pendentes

## Solução de Problemas

### Não estou vendo movimentações de anos anteriores

Se você não está vendo movimentações de anos anteriores a 2024, após a última atualização:

1. **Tente executar novamente a importação automática**:
   - Acesse o menu "Configurações"
   - Escolha "Integrações"
   - Em "Gestão Click", clique em "Executar Importação Automática"
   - Marque a opção "Importar histórico completo"

2. **Verifique as configurações**:
   - Certifique-se de que seu ERP Gestão Click possui dados disponíveis do período desejado
   - Confirme que as contas bancárias estão configuradas corretamente no Gestão Click

3. **Processe em partes**:
   - Se você tem muitos dados, tente importar períodos menores de cada vez
   - Por exemplo, importe um ano por vez em vez de todos os 5 anos juntos

4. **Contate o suporte**:
   - Se ainda tiver problemas, entre em contato com o suporte técnico

---

*Última atualização: 15 de setembro de 2023* 