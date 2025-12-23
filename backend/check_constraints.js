const { getPool, sql } = require('./src/config/database');

async function checkConstraints() {
    try {
        const pool = await getPool();

        console.log('--- Constraints on work_stations ---');
        const result = await pool.request().query(`
            SELECT 
                kc.name as ConstraintName,
                c.name as ColumnName,
                tc.Constraint_Type
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kc ON tc.Constraint_Name = kc.Constraint_Name
            JOIN information_schema.columns c ON kc.Column_Name = c.Column_Name AND kc.Table_Name = c.Table_Name
            WHERE tc.Table_Name = 'work_stations'
        `);
        console.table(result.recordset);

        console.log('--- Indexes on work_stations ---');
        const indexes = await pool.request().query(`
            SELECT 
                i.name AS IndexName,
                c.name AS ColumnName,
                i.is_unique,
                i.has_filter,
                i.filter_definition
            FROM sys.indexes i
            JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
            JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
            WHERE i.object_id = OBJECT_ID('work_stations')
        `);
        console.table(indexes.recordset);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

checkConstraints();
