
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const { testConnection } = require('./config/database');
const { authenticate, optionalAuth } = require('./middleware/auth');
const { requirePermission, requireRole } = require('./middleware/permissions');

// Importar routes (adicionar conforme implementar)
// const plantsRouter = require('./routes/plants');

const app = express();
const PORT = process.env.PORT || 3001;

// ==================== MIDDLEWARE ====================

// Logging
app.use(morgan('dev'));

// CORS
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==================== ROUTES ====================

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'AutolivTouchScreen Backend',
    });
});

// Test database connection
app.get('/api/test-db', async (req, res) => {
    try {
        const isConnected = await testConnection();
        res.json({
            status: isConnected ? 'connected' : 'disconnected',
            database: process.env.AZURE_SQL_DATABASE,
            server: process.env.AZURE_SQL_SERVER,
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message,
        });
    }
});

// ============================================
// API Routes - Configuração de Autenticação
// ============================================

// Rotas PÚBLICAS (sem autenticação)
const l2lRouter = require('./routes/l2l');
app.get('/api/l2l/test-connection', l2lRouter); // Apenas test-connection é público

// TODAS as outras rotas /api/* requerem autenticação
// Middleware global de autenticação (pode ser desabilitado temporariamente comentando)
const AUTH_ENABLED = process.env.AUTH_ENABLED !== 'false'; // Controle via .env

if (AUTH_ENABLED) {
    console.log('🔒 Autenticação JWT ATIVADA para rotas /api/*');
    app.use('/api', authenticate); // Aplica autenticação a todas as rotas /api/*
} else {
    console.warn('⚠️ Autenticação JWT DESATIVADA - Apenas para desenvolvimento!');
}

// Rotas de LEITURA (acesso básico autenticado)
const plantsRouter = require('./routes/plants');
app.use('/api/plants', plantsRouter);

const linesRouter = require('./routes/lines');
app.use('/api/lines', linesRouter);

const stationsRouter = require('./routes/stations');
app.use('/api/stations', stationsRouter);

const documentsRouter = require('./routes/documents');
app.use('/api/documents', documentsRouter);

const alertsRouter = require('./routes/alerts');
app.use('/api/alerts', alertsRouter);

// Acknowledgment routes
const acknowledgmentsRouter = require('./routes/acknowledgments');
app.use('/api/acknowledgments', acknowledgmentsRouter);

// Rotas ADMINISTRATIVAS (requerem permissões específicas)
const usersRouter = require('./routes/users');
if (AUTH_ENABLED) {
    app.use('/api/users', requirePermission('users'), usersRouter);
} else {
    app.use('/api/users', usersRouter);
}

const rolesRouter = require('./routes/roles');
if (AUTH_ENABLED) {
    app.use('/api/roles', requirePermission('roles'), rolesRouter);
} else {
    app.use('/api/roles', rolesRouter);
}

// L2L Sync (requer permissão específica)
if (AUTH_ENABLED) {
    app.use('/api/l2l', requirePermission('l2l_sync'), l2lRouter);
} else {
    app.use('/api/l2l', l2lRouter);
}

// ==================== ERROR HANDLING ====================

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        path: req.path,
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('❌ Error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
});

// ==================== START SERVER ====================

app.listen(PORT, async () => {
    console.log('');
    console.log('🚀 ========================================');
    console.log(`✅ Server rodando na porta ${PORT}`);
    console.log(`📍 http://localhost:${PORT}`);
    console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
    console.log('==========================================');
    console.log('');

    // Testar conexão com banco ao iniciar
    await testConnection();
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('📴 SIGTERM recebido. Fechando servidor...');
    const { closePool } = require('./config/database');
    await closePool();
    process.exit(0);
});

module.exports = app;
