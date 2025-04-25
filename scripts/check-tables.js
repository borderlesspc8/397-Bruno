// Script para verificar tabelas diretamente no banco de dados
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Criar pool de conexão com o banco de dados
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkTables() {
  try {
    // Conectar ao banco de dados
    const client = await pool.connect();
    
    try {
      // Consultar tabelas existentes
      const query = `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name;
      `;
      
      const res = await client.query(query);
      
      console.log('Tabelas encontradas no banco de dados:');
      res.rows.forEach(row => {
        console.log(`- ${row.table_name}`);
      });
      
      // Verificar tabelas específicas que nos interessam
      const tablesToCheck = [
        'Transaction',
        'Wallet', 
        'installments',
        'cash_flow_entries',
        'users'
      ];
      
      console.log('\nVerificando tabelas específicas:');
      for (const tableName of tablesToCheck) {
        const checkQuery = `
          SELECT EXISTS (
            SELECT 1 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = $1
          );
        `;
        
        const checkRes = await client.query(checkQuery, [tableName]);
        
        console.log(`- ${tableName}: ${checkRes.rows[0].exists ? 'EXISTE' : 'NÃO EXISTE'}`);
      }
      
      // Verificar contagem de registros em algumas tabelas
      console.log('\nContagem de registros:');
      
      for (const tableName of tablesToCheck) {
        try {
          const countQuery = `SELECT COUNT(*) FROM "${tableName}";`;
          const countRes = await client.query(countQuery);
          console.log(`- ${tableName}: ${countRes.rows[0].count} registros`);
        } catch (error) {
          console.log(`- ${tableName}: ERRO AO CONTAR (${error.message})`);
        }
      }
      
      // Verificar se há transações com wallets
      try {
        const txWithWalletQuery = `
          SELECT t.id, t.amount, t.type, t.date, w.name as wallet_name
          FROM "Transaction" t
          JOIN "Wallet" w ON t."walletId" = w.id
          LIMIT 5;
        `;
        const txWithWalletRes = await client.query(txWithWalletQuery);
        console.log('\nExemplos de transações com carteiras:');
        console.log(txWithWalletRes.rows);
      } catch (error) {
        console.log('Erro ao buscar transações com carteiras:', error.message);
      }
      
    } finally {
      // Liberar cliente de volta para o pool
      client.release();
    }
    
  } catch (error) {
    console.error('Erro ao verificar tabelas:', error);
  } finally {
    // Encerrar pool
    await pool.end();
  }
}

checkTables(); 