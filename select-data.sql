-- Consultar estrutura da tabela de usuários
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users';

-- Consultar estrutura da tabela de vendas
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'sales_records';

-- Consultar estrutura da tabela de parcelas
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'installments';

-- Consultar estrutura da tabela de carteiras
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'Wallet';

-- Listar todas as tabelas do banco
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Consultar usuários de teste
SELECT * FROM "users" WHERE id LIKE 'test%';

-- Consultar vendas de teste
SELECT * FROM "sales_records" WHERE "userId" LIKE 'test%';

-- Consultar parcelas de teste
SELECT * FROM "installments" WHERE "userId" LIKE 'test%';

-- Consultar carteiras do Gestão Click
SELECT * FROM "Wallet" WHERE name LIKE '%GESTAO_CLICK%'; 