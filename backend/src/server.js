
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
// CORS
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',');
app.use(cors({
    origin: function (origin, callback) {
        // allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.log('Origin blocked by CORS:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
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

// PROXY L2L (Para useHourlyProduction e outros)
// Encaminha requisições do frontend (/api/1.0/...) para a API L2L real
// PROXY L2L (Para useHourlyProduction e outros)
// Encaminha requisições do frontend (/api/1.0/...) para a API L2L real
// (Axis already required above if duplicated, but let's ensure one clean block)
// Actually better to just keep the app.use part and assume axios is required once.
// But looking at file, axios was required at line 81 AND 84.
// I will start replacement from line 81.

const axios = require('axios');
app.use('/api/1.0', async (req, res) => {
    // Only allow GET requests for now
    if (req.method !== 'GET') return res.status(405).send('only GET allowed for proxy');

    try {
        const l2lBaseUrl = process.env.API_LEADING2LEAN_BASE_URL || 'https://autoliv-mx.leading2lean.com';
        const apiKey = process.env.L2L_API_KEY;

        if (!apiKey) {
            console.error('❌ L2L_API_KEY not configured in backend');
            return res.status(500).json({ error: 'Server configuration error' });
        }

        // Construct target URL
        // req.originalUrl is like /api/1.0/lines/?site=902...
        // We want to forward to https://.../api/1.0/lines/?auth=KEY&site=902...

        // Remove the local prefix /api/1.0 to get the relative path and query
        // But keep the structure as L2L expects /api/1.0/...
        // The simplest way:
        // 1. Get the path after /api/1.0
        // req.path is like /lines/ (without query params in express router usage usually, but here app.use on path mount)
        // With app.use('/api/1.0'), req.url is relative to the mount point.
        // e.g. req.url is /lines/?site=902

        const endpoint = req.url; // /lines/?site=... or /pitches/...

        // Construct full L2L URL
        // l2lBaseUrl usually includes /api/1.0? No, let's assume it's just the domain or domain+api root
        // If env L2L_API_BASE_URL is 'https://autoliv-mx.leading2lean.com', then we need to append /api/1.0

        // Let's rely on standard L2L API structure. 
        // We will treat l2lBaseUrl as the root domain if it doesn't end with /api/1.0

        let targetBase = l2lBaseUrl;
        if (!targetBase.endsWith('/api/1.0') && !targetBase.endsWith('/api/1.0/')) {
            // Append /api/1.0 if missing
            targetBase = targetBase.replace(/\/+$/, '') + '/api/1.0';
        }

        // Final URL construction
        const targetUrlObj = new URL(targetBase + endpoint);

        // Inject Auth
        targetUrlObj.searchParams.append('auth', apiKey);

        console.log(`🔀 Proxying L2L: ${endpoint} -> ${targetUrlObj.origin}${targetUrlObj.pathname}`);

        const response = await axios.get(targetUrlObj.toString());
        res.json(response.data);
    } catch (error) {
        console.error('❌ Proxy Error:', error.message);
        if (error.response) {
            res.status(error.response.status).json(error.response.data);
        } else {
            res.status(500).json({ error: 'Proxy Request Failed', details: error.message });
        }
    }
});

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
