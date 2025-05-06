# Layout Protegido com Verificação de Perfil

Este documento descreve a implementação do layout protegido para rotas autenticadas, que inclui a verificação de existência do perfil do usuário e o redirecionamento para login quando necessário.

## Componentes Implementados

### 1. Hook useUserProfile

Este hook personalizado gerencia o carregamento do perfil do usuário e lida com diferentes respostas da API:

- **Função**: Buscar o perfil do usuário autenticado e gerenciar estados de carregamento e erro
- **Tratamento de Erros**:
  - **404**: Quando o usuário existe na autenticação mas não no banco de dados - força o logout e redireciona para login
  - **401**: Usuário não autenticado - apenas define o estado como não carregado para o componente pai lidar
- **Retorno**: Estado do perfil de usuário, estado de carregamento e erro

### 2. Componente ProtectedLayout

Este componente envolve rotas que exigem autenticação:

- **Função**: Proteger rotas, verificando tanto a autenticação quanto a existência do perfil
- **Comportamento**:
  - Renderiza um spinner de carregamento enquanto verifica a sessão
  - Redireciona para a página de login se não houver sessão
  - Usa o hook `useUserProfile` para verificar se o usuário existe no banco de dados
  - Força logout e redireciona para login quando o usuário não é encontrado (404)

### 3. Layout das Rotas Autenticadas

O layout das rotas autenticadas foi atualizado para usar o ProtectedLayout:

- **Arquivo**: `app/(auth-routes)/layout.tsx`
- **Estrutura**:
  - Usa o componente `ProtectedLayout` como wrapper
  - Mantém a navegação padrão com `Navbar` e `Sidebar`
  - Inclui o `Toaster` para notificações do sistema

## Fluxo de Autenticação

1. Usuário tenta acessar uma rota protegida
2. `ProtectedLayout` verifica se há uma sessão NextAuth ativa
3. Se não houver sessão, redireciona para `/auth/login`
4. Se houver sessão, o hook `useUserProfile` busca os dados do perfil na API
5. Se a API retornar 404 (usuário não encontrado):
   - Exibe uma notificação informando que a conta não foi encontrada
   - Executa logout via `signOut()`
   - Redireciona para a página de login
6. Se o perfil for carregado com sucesso, renderiza a rota protegida

## Como Testar

Para testar o funcionamento do layout protegido:

1. Faça login na aplicação com credenciais válidas
2. Navegue para diferentes rotas protegidas para verificar se o acesso está funcionando
3. Acesse `/teste-protecao` para visualizar os detalhes da sessão
4. Para simular um erro 404 (apenas teste):
   - Remova temporariamente o usuário do banco de dados
   - Tente acessar uma rota protegida (você deve ser redirecionado para login)

## Considerações de Segurança

- Usuários não autenticados nunca conseguem acessar conteúdo protegido
- Usuários autenticados cujos perfis não existem no banco de dados são automaticamente desconectados
- As verificações ocorrem tanto no cliente quanto no servidor para garantir segurança em camadas

## Manutenção e Expansão

Para adicionar novas rotas protegidas:

1. Coloque-as dentro do diretório `app/(auth-routes)/`
2. O layout protegido será automaticamente aplicado
3. Para rotas com requisitos específicos, implemente verificações adicionais no nível da página 