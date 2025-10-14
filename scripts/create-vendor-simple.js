// Script simples para criar usuário vendedor diretamente no Supabase
// Execute este script no console do Supabase ou use a interface web

const vendorUser = {
  email: 'vendedorpersonalprime@gmail.com',
  password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J8K9YzK2a', // Hash de 'Vendedor231719'
  name: 'Vendedor Personal Prime',
  role: 'vendor',
  auth_provider: 'EMAIL',
  is_onboarded: true,
  is_terms_accepted: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  last_login: new Date().toISOString()
};

console.log('SQL para inserir usuário vendedor:');
console.log(`
INSERT INTO users (id, email, password, name, role, auth_provider, is_onboarded, is_terms_accepted, created_at, updated_at, last_login)
VALUES (
  gen_random_uuid(),
  'vendedorpersonalprime@gmail.com',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J8K9YzK2a',
  'Vendedor Personal Prime',
  'vendor',
  'EMAIL',
  true,
  true,
  NOW(),
  NOW(),
  NOW()
);
`);

console.log('\nSQL para inserir registro de vendedor (execute após inserir o usuário):');
console.log(`
INSERT INTO vendedores (id, nome, email, user_id, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Vendedor Personal Prime',
  'vendedorpersonalprime@gmail.com',
  (SELECT id FROM users WHERE email = 'vendedorpersonalprime@gmail.com'),
  NOW(),
  NOW()
);
`);

console.log('\nCredenciais do usuário vendedor:');
console.log('Email: vendedorpersonalprime@gmail.com');
console.log('Senha: Vendedor231719');
console.log('Role: vendor');
