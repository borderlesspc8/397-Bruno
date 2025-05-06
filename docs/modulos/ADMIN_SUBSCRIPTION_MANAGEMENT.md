# Documentação: Gerenciamento de Assinaturas

## Visão Geral

O módulo de Gerenciamento de Assinaturas foi desenvolvido para permitir que o administrador da plataforma (usuário com email mvcas95@gmail.com) gerencie os planos de acesso de outros usuários do sistema. Essa funcionalidade é exclusiva e permite atualizar os planos de assinatura e status de ativação de qualquer usuário da plataforma.

## Acesso

Esta funcionalidade está disponível exclusivamente para o usuário administrador com o email mvcas95@gmail.com, através do menu "Gerenciar Assinaturas" disponível na barra de navegação da área logada. Para os demais usuários, esta opção não aparece no menu.

### Caminho de acesso
```
URL: /gerenciar-assinaturas
```

## Funcionalidades

### 1. Visualização de Todos os Usuários

- Lista completa dos usuários cadastrados na plataforma
- Informações exibidas:
  - Nome
  - Email
  - Plano de assinatura atual
  - Status de ativação
  - Status de verificação de email

### 2. Gerenciamento de Planos

O administrador pode alterar o plano de assinatura de qualquer usuário entre as opções:

- **FREE**: Acesso apenas ao Dashboard básico
- **BASIC**: Acesso a recursos básicos como carteiras e transações
- **PREMIUM**: Acesso a recursos avançados como relatórios e metas
- **ENTERPRISE**: Acesso completo a todas as funcionalidades

### 3. Gerenciamento de Status

O administrador pode:

- **Ativar usuários**: Permitir acesso à plataforma
- **Desativar usuários**: Bloquear acesso à plataforma temporariamente

**Observação**: O administrador principal (mvcas95@gmail.com) não pode desativar sua própria conta.

### 4. Busca e Filtragem

- Campo de busca para filtrar usuários por nome ou email
- Feedback visual para diferentes status (verificado, não verificado, ativo, inativo)

## Implementação Técnica

### Arquitetura

O sistema utiliza uma abordagem modular com:

1. **Frontend**: Página React com componentes para listar e gerenciar usuários
2. **APIs**: Endpoints REST protegidos para operações de administração
3. **Middlewares**: Verificação de autorização em cada operação

### Endpoints da API

```
GET /api/admin/users
- Lista todos os usuários da plataforma
- Requer autenticação como mvcas95@gmail.com

PATCH /api/admin/users/{userId}/subscription
- Atualiza o plano de assinatura de um usuário
- Requer autenticação como mvcas95@gmail.com
- Parâmetros: { plan: SubscriptionPlan }

PATCH /api/admin/users/{userId}/status
- Ativa ou desativa um usuário na plataforma
- Requer autenticação como mvcas95@gmail.com
- Parâmetros: { isActive: boolean }
```

## Segurança

Diversas camadas de segurança foram implementadas:

1. **Verificação de identidade**: Verifica se o email do usuário autenticado é mvcas95@gmail.com
2. **Proteção de rotas**: Frontend e API protegidos contra acesso não autorizado
3. **Prevenção de auto-desativação**: O administrador não pode desativar sua própria conta
4. **Validação de dados**: Todos os parâmetros recebidos são validados antes do processamento

## Impacto nas Restrições de Assinatura

Quando o administrador altera o plano de um usuário:

1. As alterações entram em vigor imediatamente
2. O usuário terá acesso (ou perderá acesso) às funcionalidades conforme seu novo plano
3. O middleware de verificação de plano verificará o novo plano em todas as requisições subsequentes

## Como Usar

1. Acesse `/gerenciar-assinaturas` como o usuário administrador (mvcas95@gmail.com)
2. Use o campo de busca para encontrar usuários específicos
3. Utilize o seletor de plano para alterar o plano de assinatura de um usuário
4. Clique no status ou no botão "Ativar/Desativar" para alterar o status de um usuário
5. As alterações são aplicadas em tempo real e refletidas imediatamente na interface 