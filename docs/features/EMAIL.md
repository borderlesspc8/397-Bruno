# Sistema de Emails do Conta Rápida

## Visão Geral

O Conta Rápida utiliza o serviço Resend para envio de emails transacionais, incluindo:

- Emails de verificação (magic link)
- Emails de recuperação de senha
- Notificações (futuramente)

## Configuração

O sistema de emails requer as seguintes variáveis de ambiente:

```
RESEND_API_KEY=sua_chave_api_do_resend
EMAIL_SERVER_HOST=smtp.resend.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=apikey
EMAIL_SERVER_PASSWORD=sua_chave_api_do_resend
EMAIL_FROM=noreply@acceleracrm.com.br
NEXT_PUBLIC_APP_URL=https://seudominio.com
```

**Importante**: `EMAIL_SERVER_PASSWORD` deve ter o mesmo valor que `RESEND_API_KEY`.

## Implementação

O sistema de emails está implementado em `app/_lib/email.ts` e oferece:

1. Uma função genérica para envio de emails
2. Templates específicos para diferentes tipos de emails
3. Funções dedicadas para cada caso de uso

### Recuperação de Senha

O fluxo de recuperação de senha funciona da seguinte forma:

1. Usuário solicita recuperação em `/auth` (modo "forgot-password")
2. A API `/api/auth/forgot-password` processa a solicitação
3. Um token único é gerado e armazenado no banco de dados
4. Um email estilizado é enviado usando o Resend com um link para redefinição
5. O usuário clica no link e é redirecionado para a página de redefinição
6. Após redefinir a senha, o token é invalidado

### Template do Email

Os emails são enviados com templates HTML responsivos e estilizados, garantindo:

- Visual consistente com a identidade da marca
- Botões de ação claros
- Instruções detalhadas
- Design responsivo que funciona em diferentes clientes de email

## Teste

Para testar o envio de emails em ambiente de desenvolvimento, utilize o endpoint:

```
POST /api/test/email
Body: { "email": "seu@email.com" }
```

Este endpoint está disponível apenas em ambiente de desenvolvimento.

## Troubleshooting

### Emails não estão sendo enviados

1. Verifique se as credenciais do Resend estão corretas
2. Confirme que `EMAIL_SERVER_PASSWORD` é exatamente igual a `RESEND_API_KEY`
3. Verifique se o domínio está verificado no painel do Resend
4. Consulte os logs do servidor para possíveis erros
5. Verifique o painel do Resend para status dos envios

### Problemas de Formatação

Se os emails estiverem sendo enviados mas com problemas de formatação:

1. Verifique o template HTML em `getPasswordResetTemplate`
2. Teste o email em diferentes clientes (Gmail, Outlook, etc.)
3. Use ferramentas como Email on Acid para verificar compatibilidade 