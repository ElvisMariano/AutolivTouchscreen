const { getPool, sql, closePool } = require('./src/config/database');

async function fixConstraint() {
    try {
        console.log('🚀 Iniciando script de correção de Unique Constraint...');
        const pool = await getPool();

        console.log('🔍 Buscando constraint UNIQUE antiga na tabela plants...');

        // Buscar nome da constraint
        const result = await pool.request().query(`
            SELECT name 
            FROM sys.key_constraints 
            WHERE parent_object_id = OBJECT_ID('plants') 
            AND type = 'UQ'
        `);

        if (result.recordset.length > 0) {
            for (const row of result.recordset) {
                const constraintName = row.name;
                console.log(`⚠️ Encontrada constraint: ${constraintName}`);

                try {
                    console.log(`🗑️ Removendo constraint ${constraintName}...`);
                    await pool.request().query(`ALTER TABLE plants DROP CONSTRAINT ${constraintName}`);
                    console.log('✅ Constraint removida.');
                } catch (err) {
                    console.error(`❌ Erro ao remover constraint ${constraintName}:`, err.message);
                }
            }
        } else {
            console.log('ℹ️ Nenhuma Unique Constraint do tipo KEY encontrada.');
        }

        // Também verificar constraints de índice único que não são chaves (apenas índices)
        console.log('🔍 Verificando índices únicos antigos...');
        const indexResult = await pool.request().query(`
            SELECT name 
            FROM sys.indexes 
            WHERE object_id = OBJECT_ID('plants') 
            AND is_unique = 1 
            AND is_primary_key = 0
            AND filter_definition IS NULL -- Apenas índices não filtrados
            AND name NOT LIKE 'IX_plants_external_id_filtered' -- Ignorar o nosso se já existir
        `);

        if (indexResult.recordset.length > 0) {
            for (const row of indexResult.recordset) {
                const indexName = row.name;
                console.log(`⚠️ Encontrado índice único não filtrado: ${indexName}`);
                // Só remove se parecer ser na coluna external_id. 
                // Como não confirmamos a coluna, melhor não dropar indexes genéricos sem checar a coluna.
                // Mas constraints UQ__plants__ costumam ser na coluna external_id se foi definido inline
                // O erro UQ__plants__ reportado confirma que é uma constraint
            }
        }

        console.log('🔍 Verificando se índice filtrado IX_plants_external_id_filtered já existe...');
        const indexCheck = await pool.request().query(`
            SELECT name FROM sys.indexes 
            WHERE name = 'IX_plants_external_id_filtered' 
            AND object_id = OBJECT_ID('plants')
        `);

        if (indexCheck.recordset.length === 0) {
            console.log('🆕 Criando índice UNIQUE filtrado (permitindo múltiplos NULLs)...');
            await pool.request().query(`
                CREATE UNIQUE INDEX IX_plants_external_id_filtered 
                ON plants(external_id) 
                WHERE external_id IS NOT NULL;
            `);
            console.log('✅ Índice criado com sucesso!');
        } else {
            console.log('ℹ️ Índice IX_plants_external_id_filtered já existe.');
        }

    } catch (error) {
        console.error('❌ Erro Geral:', error);
    } finally {
        await closePool();
        process.exit(0);
    }
}

fixConstraint();
