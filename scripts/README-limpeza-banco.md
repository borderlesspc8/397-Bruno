# Guia de Limpeza do Banco de Dados

Este documento fornece instruções detalhadas sobre como limpar dados do banco de dados da aplicação Conta Rápida de forma segura.

## ⚠️ Aviso Importante

**As operações descritas neste documento são irreversíveis.** Sempre faça backup do banco de dados antes de executar qualquer operação de limpeza.

## Ferramentas disponíveis

### 1. Script para excluir todas as transações

O script `delete-all-transactions.js` permite excluir transações do banco de dados com várias opções de segurança.

#### Pré-requisitos

- Acesso ao ambiente de desenvolvimento
- Permissões para executar scripts npm
- Conhecimento do ID de usuário (opcional, se quiser limitar a exclusão a um usuário específico)

#### Opções disponíveis

O script oferece várias opções para garantir segurança:

| Opção | Descrição | Exemplo |
|-------|-----------|---------|
| `dryRun` | Executar em modo simulação, sem fazer alterações | `--dryRun=true` |
| `confirm` | Código de confirmação para executar exclusões reais | `--confirm=DELETAR_TODAS_TRANSACOES` |
| `userId` | Restringir exclusão a um usuário específico | `--userId=123e4567-e89b-12d3-a456-426614174000` |
| `exportData` | Exportar dados para JSON antes de excluir | `--exportData=true` |

#### Exemplos de uso

1. **Simulação (recomendado como primeiro passo)**
   ```bash
   npm run delete-transactions -- dryRun=true
   ```

2. **Excluir todas as transações (todos os usuários)**
   ```bash
   npm run delete-transactions -- confirm=DELETAR_TODAS_TRANSACOES
   ```

3. **Excluir transações de um usuário específico**
   ```bash
   npm run delete-transactions -- userId=ID_DO_USUARIO confirm=DELETAR_TODAS_TRANSACOES
   ```

4. **Backup dos dados antes de excluir**
   ```bash
   npm run delete-transactions -- exportData=true confirm=DELETAR_TODAS_TRANSACOES
   ```

#### Exportação de dados

Quando a opção `exportData=true` é usada, o script cria um arquivo JSON na pasta `exports/` com todas as transações antes de excluí-las. Este arquivo pode ser usado para restaurar dados manualmente se necessário.

### 2. Endpoint de API para Administradores

Para situações em que você não pode executar diretamente o script (como em ambientes de produção), há um endpoint de API seguro disponível para administradores:

```
/api/admin/transactions/cleanup
```

#### Requisitos

- O usuário deve estar autenticado e ter permissão de administrador (role = 'ADMIN')
- A operação deve ser autorizada com um código de confirmação específico

#### Uso do Endpoint

1. **Analisar transações (GET)**
   
   Faça uma solicitação GET para analisar as transações antes de excluí-las:
   
   ```http
   GET /api/admin/transactions/cleanup?userId={ID_OPCIONAL}&limit=100
   ```
   
   Parâmetros de consulta:
   - `userId` (opcional): ID do usuário específico
   - `limit` (opcional, padrão 100): Número de transações de amostra para visualizar

2. **Excluir transações (POST)**
   
   Faça uma solicitação POST com as seguintes opções:
   
   ```http
   POST /api/admin/transactions/cleanup
   Content-Type: application/json
   
   {
     "userId": "ID_OPCIONAL",
     "dryRun": true,
     "confirmationCode": "DELETAR_TODAS_TRANSACOES"
   }
   ```
   
   Corpo da requisição:
   - `userId` (opcional): Para limitar a exclusão a um usuário específico
   - `dryRun` (padrão: `true`): Defina como `false` para realmente excluir
   - `confirmationCode`: Necessário quando `dryRun` é `false`

#### Exemplo de resposta (simulação):

```json
{
  "success": true,
  "dryRun": true,
  "deleted": 0,
  "wouldDelete": 1875,
  "targetUserId": "todos",
  "message": "Simulação: 1875 transações seriam excluídas"
}
```

## Melhores Práticas

1. **Sempre faça backup** do banco de dados inteiro antes de executar operações de limpeza
2. **Execute primeiro em modo simulação** (`dryRun=true`) para verificar exatamente o que será excluído
3. **Prefira limitar as exclusões** a um usuário específico quando possível
4. **Notifique os usuários** antes de executar limpezas em ambiente de produção
5. **Documente todas as execuções** de limpeza, incluindo data, motivo e escopo

## Recuperação de Dados

A exclusão de dados com estes scripts é permanente e não pode ser revertida automaticamente. 

Opções para recuperação em caso de exclusão acidental:
1. **Restaure o backup** do banco de dados (se disponível)
2. **Use os arquivos de exportação JSON** criados pela opção `exportData=true`
3. **Contate o administrador do sistema** se nenhuma das opções acima estiver disponível

## Troubleshooting

### Problemas comuns

1. **Erro de permissão**: Verifique se você tem permissões adequadas no banco de dados.
2. **Confirmação inválida**: Certifique-se de usar exatamente o código `DELETAR_TODAS_TRANSACOES`.
3. **Usuário não encontrado**: Confirme se o ID do usuário está correto.

Para problemas não documentados aqui, entre em contato com a equipe de desenvolvimento. 