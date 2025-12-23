const { getPool, sql } = require('./src/config/database');

async function runMigration() {
    try {
        const pool = await getPool();
        console.log('🔄 Iniciando migração para corrigir constraint UNIQUE em work_stations...');

        // 1. Encontrar o nome da constraint UNIQUE na coluna external_id
        const constraintQuery = `
            SELECT tc.Constraint_Name
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kc ON tc.Constraint_Name = kc.Constraint_Name
            WHERE tc.Table_Name = 'work_stations' 
              AND kc.Column_Name = 'external_id'
              AND tc.Constraint_Type = 'UNIQUE'
        `;

        const result = await pool.request().query(constraintQuery);

        if (result.recordset.length > 0) {
            const constraintName = result.recordset[0].Constraint_Name;
            console.log(`🔍 Constraint encontrada: ${constraintName}. Removendo...`);

            await pool.request().query(`ALTER TABLE work_stations DROP CONSTRAINT ${constraintName}`);
            console.log('✅ Constraint removida.');
        } else {
            console.log('⚠️ Nenhuma constraint UNIQUE padrão encontrada em external_id. Verificando índices únicos...');
            // Verificar indexes únicos caso seja um índice e não constraint
            // ... mas vamos assumir que o erro veio de constraint 'UQ__...'
        }

        // 2. Criar índice único filtrado (permite múltiplos NULLs)
        console.log('🔄 Criando índice único filtrado (WHERE external_id IS NOT NULL)...');
        // Primeiro verificamos se o índice já existe para não dar erro
        const indexCheck = await pool.request().query(`
            SELECT name FROM sys.indexes 
            WHERE name = 'IX_work_stations_external_id_filtered' AND object_id = OBJECT_ID('work_stations')
        `);

        if (indexCheck.recordset.length === 0) {
            await pool.request().query(`
                CREATE UNIQUE INDEX IX_work_stations_external_id_filtered 
                ON work_stations(external_id) 
                WHERE external_id IS NOT NULL
            `);
            console.log('✅ Índice único filtrado criado com sucesso.');
        } else {
            console.log('ℹ️ Índice IX_work_stations_external_id_filtered já existe.');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Erro na migração:', error);
        process.exit(1);
    }
}

runMigration();
