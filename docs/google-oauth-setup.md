# Configuração do Google OAuth

Este guia explica como configurar a autenticação com o Google (OAuth) para o Conta Rápida.

## Pré-requisitos

- Conta Google (preferencialmente associada ao domínio da empresa)
- Acesso ao [Google Cloud Console](https://console.cloud.google.com/)

## Passo a Passo

### 1. Criar um Projeto no Google Cloud

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/)
2. Clique em "Selecionar Projeto" no topo da página
3. Clique em "Novo Projeto"
4. Dê um nome ao projeto (ex: "Conta Rápida")
5. Clique em "Criar"

### 2. Configurar o OAuth Consent Screen

1. No menu lateral, vá para "APIs e Serviços" > "Tela de consentimento OAuth"
2. Selecione o tipo de usuário (externo ou interno)
3. Preencha as informações obrigatórias:
   - Nome do aplicativo
   - Email de suporte do usuário
   - Email do desenvolvedor
4. Clique em "Salvar e Continuar"
5. Na seção "Escopos", adicione os escopos necessários:
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
6. Clique em "Salvar e Continuar"
7. Adicione usuários de teste se necessário
8. Clique em "Salvar e Continuar"
9. Revise as informações e clique em "Voltar para o Painel"

### 3. Criar Credenciais OAuth

1. No menu lateral, vá para "APIs e Serviços" > "Credenciais"
2. Clique em "Criar Credenciais" > "ID do Cliente OAuth"
3. Selecione "Aplicativo da Web" como tipo de aplicativo
4. Dê um nome à credencial (ex: "Conta Rápida Web")
5. Em "Origens JavaScript autorizadas", adicione:
   - `http://localhost:3000` (para desenvolvimento)
   - `https://seu-dominio.com` (para produção)
6. Em "URIs de redirecionamento autorizados", adicione:
   - `http://localhost:3000/api/auth/callback/google` (para desenvolvimento)
   - `https://seu-dominio.com/api/auth/callback/google` (para produção)
7. Clique em "Criar"
8. Anote o Client ID e Client Secret gerados

### 4. Configurar Variáveis de Ambiente

Adicione as seguintes variáveis ao seu arquivo `.env`:

```
GOOGLE_CLIENT_ID=seu_client_id
GOOGLE_CLIENT_SECRET=seu_client_secret
```

### 5. Testar a Autenticação

1. Inicie sua aplicação em modo de desenvolvimento
2. Acesse a página de login
3. Clique no botão "Continuar com Google"
4. Verifique se o fluxo de autenticação funciona corretamente

## Solução de Problemas

### Erro: "Error: redirect_uri_mismatch"

- Verifique se a URI de redirecionamento configurada no Google Cloud Console corresponde exatamente à URI usada pela aplicação
- Certifique-se de incluir `/api/auth/callback/google` no final da URL

### Erro: "Error: invalid_client"

- Verifique se o Client ID e Client Secret estão corretos no arquivo `.env`
- Certifique-se de que as credenciais não expiraram ou foram revogadas

### Erro: "Error: access_denied"

- O usuário negou acesso à conta
- Verifique se os escopos solicitados são adequados 