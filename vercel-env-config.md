# Configuração de Variáveis de Ambiente para Vercel

## 🔧 Variáveis Obrigatórias para Deploy

### 1. **Supabase (Autenticação e Banco de Dados)**
```
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. **API Externa (Gestão Click)**
```
GESTAO_CLICK_API_URL=https://api.beteltecnologia.com
GESTAO_CLICK_ACCESS_TOKEN=35f6a...
GESTAO_CLICK_SECRET_TOKEN=823e5...
```

### 3. **Configurações de Produção**
```
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://seu-app.vercel.app
```

### 4. **APIs Externas (Opcionais)**
```
RESEND_API_KEY=re_...
GROQ_API_KEY=gsk_...
OPENAI_API_KEY=sk-...
```

## 🚀 Como Configurar no Vercel

1. **Acesse o Dashboard do Vercel**
2. **Vá em Settings > Environment Variables**
3. **Adicione cada variável acima**
4. **Selecione "Production" como ambiente**
5. **Salve as configurações**

## ⚠️ Importante

- **NEXT_PUBLIC_**: Variáveis que começam com este prefixo são expostas ao cliente
- **Sem prefixo**: Variáveis privadas do servidor
- **Supabase**: Configure primeiro o projeto no Supabase e pegue as credenciais
- **Gestão Click**: Use as credenciais da API externa

## 📋 Checklist de Deploy

- [ ] Projeto Supabase criado e configurado
- [ ] Variáveis de ambiente adicionadas no Vercel
- [ ] Build local funcionando (✅ Já feito)
- [ ] Teste de login funcionando
- [ ] Dashboard de vendas acessível
- [ ] Deploy no Vercel
