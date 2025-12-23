require('dotenv').config();
const sql = require('mssql');

const config = {
    user: process.env.AZURE_SQL_USER,
    password: process.env.AZURE_SQL_PASSWORD,
    server: process.env.AZURE_SQL_SERVER,
    database: process.env.AZURE_SQL_DATABASE,
    options: {
        encrypt: process.env.AZURE_SQL_ENCRYPT === 'true',
        trustServerCertificate: true
    }
};

async function debugPermissions() {
    try {
        console.log('Connecting to database...');
        await sql.connect(config);
        console.log('Connected!');

        // 1. Check Roles and their Allowed Resources
        console.log('\n--- ROLES & PERMISSIONS ---');
        const rolesResult = await sql.query`SELECT id, name, allowed_resources FROM roles`;
        rolesResult.recordset.forEach(role => {
            console.log(`Role: ${role.name}`);
            console.log(`Permissions: ${role.allowed_resources}`);
            console.log('---');
        });

        // 2. Check Users and their assigned Roles
        console.log('\n--- USERS & ASSIGNED ROLES ---');
        const usersResult = await sql.query`
            SELECT u.id, u.email, u.name, r.name as role_name 
            FROM users u 
            LEFT JOIN roles r ON u.role_id = r.id
        `;
        console.table(usersResult.recordset);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await sql.close();
    }
}

debugPermissions();
