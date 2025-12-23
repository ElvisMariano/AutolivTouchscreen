const sql = require('mssql');
require('dotenv').config();

// Configuração da conexão com Azure SQL
const config = {
    server: process.env.AZURE_SQL_SERVER,
    database: process.env.AZURE_SQL_DATABASE,
    options: {
        encrypt: process.env.AZURE_SQL_ENCRYPT === 'true',
        trustServerCertificate: false,
        connectTimeout: 30000,
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000,
    },
};

// Configurar autenticação baseada no tipo
if (process.env.AZURE_SQL_AUTH_TYPE === 'azure-active-directory-default') {
    // Azure AD Default (usa credenciais do ambiente)
    config.authentication = {
        type: 'azure-active-directory-default',
    };
    console.log(' 🔐 Usando autenticação: Azure Active Directory Default');
} else if (process.env.AZURE_SQL_USER && process.env.AZURE_SQL_PASSWORD) {
    // SQL Authentication (usuário e senha)
    config.user = process.env.AZURE_SQL_USER;
    config.password = process.env.AZURE_SQL_PASSWORD;
    console.log('🔐 Usando autenticação: SQL Authentication');
} else {
    console.error('❌ Erro: Nenhum método de autenticação configurado!');
    console.error('Configure AZURE_SQL_AUTH_TYPE ou AZURE_SQL_USER/AZURE_SQL_PASSWORD no .env');
    process.exit(1);
}

// Pool de conexões global
let poolPromise;

/**
 * Obter pool de conexões SQL
 */
async function getPool() {
    if (!poolPromise) {
        try {
            console.log('🔄 Conectando ao Azure SQL Database...');
            const pool = new sql.ConnectionPool(config);

            // Tratamento de erros do pool para evitar crash da aplicação
            pool.on('error', err => {
                console.error('❌ Azure SQL Pool Error - Evento não tratado:', err);
            });

            poolPromise = pool.connect();
            await poolPromise;
            console.log('✅ Conectado ao Azure SQL Database com sucesso!');
            console.log(`   Server: ${config.server}`);
            console.log(`   Database: ${config.database}`);
        } catch (error) {
            console.error('❌ Erro ao conectar com Azure SQL:', error.message);
            poolPromise = null;
            throw error;
        }
    }
    return poolPromise;
}

/**
 * Testar conexão com banco
 */
async function testConnection() {
    try {
        const pool = await getPool();
        const result = await pool.request().query('SELECT 1 AS test');
        console.log('✅ Teste de conexão: OK');
        return true;
    } catch (error) {
        console.error('❌ Teste de conexão: FALHOU', error.message);
        return false;
    }
}

/**
 * Fechar pool de conexões
 */
async function closePool() {
    if (poolPromise) {
        await (await poolPromise).close();
        poolPromise = null;
        console.log('🔌 Conexão com Azure SQL fechada');
    }
}

module.exports = {
    sql,
    getPool,
    testConnection,
    closePool,
};
