const sql = require('mssql');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Configuração da conexão
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
        console.log('🔄 Conectando ao Azure SQL Database...');
        const pool = await sql.connect(config);
        console.log('✅ Conectado!');

        // Ler arquivo SQL
        const migrationPath = path.join(__dirname, '../migrations/001_initial_schema.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

        // Dividir por GO statements
        const statements = migrationSQL
            .split(/\r?\nGO\r?\n/)
            .filter(stmt => stmt.trim().length > 0);

        console.log(`📝 Executando ${statements.length} statements SQL...\n`);

        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i].trim();
            if (statement.length === 0) continue;

            try {
                console.log(`[${i + 1}/${statements.length}] Executando...`);
                await pool.request().query(statement);
                console.log(`✅ Statement ${i + 1} executado com sucesso`);
            } catch (error) {
                console.error(`❌ Erro no statement ${i + 1}:`, error.message);
                // Continuar mesmo com erros (algumas tabelas podem já existir)
            }
        }

        console.log('\n🎉 Migration concluída!');
        await pool.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Erro na migration:', error);
        process.exit(1);
    }
}

runMigration();
