# Documentação de Autenticação

Este documento descreve os métodos de autenticação disponíveis no Conta Rápida e como eles foram implementados.

## Métodos de Autenticação

O Conta Rápida oferece múltiplos métodos de autenticação para garantir flexibilidade e segurança:

1. **Login com Email e Senha**: Método tradicional de autenticação
2. **Magic Link**: Autenticação sem senha, por meio de link enviado ao email
3. **Recuperação de Senha**: Processo para redefinir a senha em caso de esquecimento

## Implementação

A autenticação é implementada usando o [NextAuth.js](https://next-auth.js.org/) com os seguintes provedores:

### 1. Provider de Credenciais

Permite login com email e senha armazenados no banco de dados:

```typescript
CredentialsProvider({
  name: "Credentials",
  credentials: {
    email: { label: "E-mail", type: "email" },
    password: { label: "Senha", type: "password" },
  },
  async authorize(credentials) {
    // Lógica de autenticação com email/senha
  }
})
```

### 2. Provider de Email (Magic Link)

Permite login sem senha enviando um link para o email do usuário:

```typescript
EmailProvider({
  server: {
    host: process.env.EMAIL_SERVER_HOST,
    port: Number(process.env.EMAIL_SERVER_PORT),
    auth: {
      user: process.env.EMAIL_SERVER_USER,
      pass: process.env.EMAIL_SERVER_PASSWORD,
    },
  },
  from: process.env.EMAIL_FROM,
  async sendVerificationRequest({ identifier: email, url }) {
    // Personalização do email com template customizado
  }
})
```

## Fluxo de Autenticação

### Login com Email/Senha

1. Usuário insere email e senha no formulário
2. O sistema valida as credenciais no banco de dados
3. Se válidas, o usuário é redirecionado para o dashboard

### Login com Magic Link

1. Usuário acessa a opção "Entrar com Magic Link"
2. Informa seu email no formulário
3. Sistema envia um email com link de acesso único
4. Usuário é direcionado para uma página de confirmação (/auth/verify-request)
5. Usuário clica no link recebido por email
6. É redirecionado para a página de verificação (/auth/verify)
7. Após a verificação bem-sucedida, é redirecionado para o dashboard

### Recuperação de Senha

1. Usuário acessa "Esqueceu sua senha?"
2. Informa seu email cadastrado
3. Sistema envia um email com link para redefinição de senha
4. Usuário clica no link e acessa a página de redefinição (/auth/reset-password)
5. Define uma nova senha que atenda aos critérios de segurança
6. Após redefinir, é redirecionado para a tela de login

## Configuração

Para o funcionamento correto da autenticação, as seguintes variáveis de ambiente devem estar configuradas:

```
# NextAuth
NEXTAUTH_URL=https://seudominio.com
NEXTAUTH_SECRET=sua_chave_secreta

# Email (para Magic Link e recuperação de senha)
RESEND_API_KEY=sua_chave_resend
EMAIL_SERVER_HOST=smtp.resend.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=apikey
EMAIL_SERVER_PASSWORD=sua_chave_resend
EMAIL_FROM=noreply@seudominio.com
NEXT_PUBLIC_APP_URL=https://seudominio.com
```

## Estrutura de Páginas

O sistema de autenticação utiliza as seguintes páginas:

- `/auth` - Página principal que contém os formulários de login, cadastro, recuperação de senha e magic link
- `/auth/verify-request` - Página exibida após o envio do magic link, instruindo o usuário a verificar seu email
- `/auth/verify` - Página que processa a verificação do magic link e redireciona após sucesso
- `/auth/reset-password` - Página para definição de nova senha após recuperação

## Configuração no NextAuth

O NextAuth está configurado com as seguintes páginas personalizadas:

```typescript
pages: {
  signIn: "/auth",
  signOut: "/auth",
  error: "/auth/error",
  verifyRequest: "/auth/verify-request", // Página exibida após envio do magic link
},
callbacks: {
  // ...
  async redirect({ url, baseUrl }) {
    // Personalização de redirecionamentos para garantir o funcionamento do magic link
    if (url.startsWith('/api/auth/callback') || url.startsWith('/auth/verify')) {
      return `${baseUrl}/auth/verify`;
    }
    // ...
  },
}
```

## Segurança

- Senhas armazenadas com hash bcrypt
- Tokens de Magic Link e recuperação de senha expiram após 10 minutos
- Sessões protegidas com JWT
- CSRF protection habilitada
- Opção de "Lembrar-me" para estender a sessão
- Middleware configurado para proteger rotas específicas e permitir acesso às rotas de autenticação

## Modelos de Email

Os emails enviados para Magic Link e recuperação de senha possuem templates personalizados com a identidade visual do Conta Rápida, aumentando a confiança do usuário e melhorando a experiência:

1. **Magic Link**: Email com botão de acesso direto e instruções claras
2. **Recuperação de Senha**: Email com link para a página de redefinição de senha

## Tratamento de Erros

- Mensagens de erro específicas para cada problema de autenticação
- Tratamento de expiração de tokens
- Feedback visual durante o processo de verificação
- Redirecionamentos apropriados em caso de erro

## Considerações de UX

- Interface responsiva
- Mensagens de erro claras e específicas
- Indicador de força de senha
- Feedback visual durante operações assíncronas (loading states)
- Redirecionamentos automáticos para melhor fluxo do usuário 