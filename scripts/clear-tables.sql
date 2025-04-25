-- Script para limpar todas as tabelas do banco de dados
-- ATENÇÃO: Este script apaga TODOS os dados. Use apenas em ambiente de desenvolvimento.

-- Desativar verificação de chaves estrangeiras temporariamente
SET session_replication_role = 'replica';

-- Limpar tabelas de relacionamento
TRUNCATE TABLE "GoalContribution" CASCADE;
TRUNCATE TABLE "BudgetCategory" CASCADE;
TRUNCATE TABLE "TransactionConflict" CASCADE;

-- Limpar tabelas de transações e dados financeiros
TRUNCATE TABLE "Transaction" CASCADE;
TRUNCATE TABLE "Budget" CASCADE;
TRUNCATE TABLE "FinancialGoal" CASCADE;
TRUNCATE TABLE "CategoryMapping" CASCADE;

-- Limpar tabelas de configuração e importação
TRUNCATE TABLE "ImportHistory" CASCADE;
TRUNCATE TABLE "ImportSchedule" CASCADE;
TRUNCATE TABLE "Wallet" CASCADE;
TRUNCATE TABLE "Category" CASCADE;

-- Limpar tabelas de autenticação
TRUNCATE TABLE "Session" CASCADE;
TRUNCATE TABLE "VerificationToken" CASCADE;
TRUNCATE TABLE "PasswordReset" CASCADE;
TRUNCATE TABLE "Account" CASCADE;

-- Limpar tabela de assinatura
TRUNCATE TABLE "Subscription" CASCADE;

-- Opcionalmente, limpar tabela de usuários
-- TRUNCATE TABLE "users" CASCADE;

-- Reativar verificação de chaves estrangeiras
SET session_replication_role = 'origin';

-- Limpar tabelas adicionais existentes no seu banco (se necessário)
-- Nota: Ajuste conforme o schema do seu banco
-- TRUNCATE TABLE "CostCenterWallet" CASCADE;
-- TRUNCATE TABLE "CostCenter" CASCADE; 