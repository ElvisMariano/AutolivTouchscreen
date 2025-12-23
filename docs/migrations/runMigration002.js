const sql = require('mssql');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const config = {
    server: process.env.AZURE_SQL_SERVER,
    database: process.env.AZURE_SQL_DATABASE,
    user: process.env.AZURE_SQL_USER,
    password: process.env.AZURE_SQL_PASSWORD,
    options: {
        encrypt: true,
        trustServerCertificate: false,
    },
};

async function runMigration() {
    try {
        console.log('🔄 Executando migration 002...');
        const pool = await sql.connect(config);

        const migrationPath = path.join(__dirname, '../migrations/002_remaining_tables.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

        const statements = migrationSQL
            .split(/\r?\nGO\r?\n/)
            .filter(stmt => stmt.trim().length > 0);

        for (const statement of statements) {
            await pool.request().query(statement);
        }

        console.log('✅ Migration 002 concluída!');
        await pool.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Erro:', error.message);
        process.exit(1);
    }
}

runMigration();
