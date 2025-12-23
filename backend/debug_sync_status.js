const { getPool, sql } = require('./src/config/database');

async function checkIdL2L() {
    try {
        const pool = await getPool();

        console.log('--- Checking production_lines ---');
        const total = await pool.request().query('SELECT COUNT(*) as count FROM production_lines');
        const withId = await pool.request().query('SELECT COUNT(*) as count FROM production_lines WHERE id_l2l IS NOT NULL');

        console.log(`Total Rows: ${total.recordset[0].count}`);
        console.log(`With id_l2l: ${withId.recordset[0].count}`);

        if (withId.recordset[0].count > 0) {
            console.log('✅ Some lines have id_l2l. Showing first 5:');
            const sample = await pool.request().query('SELECT TOP 5 id, name, external_id, id_l2l FROM production_lines WHERE id_l2l IS NOT NULL');
            console.table(sample.recordset);
        } else {
            console.log('❌ NO lines have id_l2l. Sync Lines must be run first.');
        }

        console.log('--- Checking work_stations ---');
        const stations = await pool.request().query('SELECT COUNT(*) as count FROM work_stations');
        console.log(`Total Stations: ${stations.recordset[0].count}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

checkIdL2L();
