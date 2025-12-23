const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');
const userService = require('../services/userService');

// Azure AD Configuração
const TENANT_ID = process.env.AZURE_AD_TENANT_ID;
const CLIENT_ID = process.env.AZURE_AD_CLIENT_ID;
const JWKS_URI = `https://login.microsoftonline.com/${TENANT_ID}/discovery/v2.0/keys`;

// Cliente JWKS para obter chaves públicas do Azure AD
const client = jwksClient({
    jwksUri: JWKS_URI,
    requestHeaders: {},
    timeout: 30000,
    cache: true,
    cacheMaxEntries: 5,
    cacheMaxAge: 600000 // 10 minutos
});

/**
 * Função para obter a chave pública de assinatura
 */
function getKey(header, callback) {
    client.getSigningKey(header.kid, (err, key) => {
        if (err) {
            return callback(err);
        }
        const signingKey = key.getPublicKey();
        callback(null, signingKey);
    });
}

/**
 * Middleware de autenticação
 * Valida JWT do Azure AD e carrega dados do usuário
 */
async function authenticate(req, res, next) {
    try {
        // 1. Extrair token do header Authorization
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                error: 'Authentication required',
                message: 'No token provided'
            });
        }

        const token = authHeader.substring(7); // Remove "Bearer "

        // 2. Verificar configuração do Azure AD
        if (!TENANT_ID || !CLIENT_ID) {
            console.error('❌ Azure AD não configurado. Verifique AZURE_AD_TENANT_ID e AZURE_AD_CLIENT_ID no .env');
            return res.status(500).json({
                error: 'Server configuration error',
                message: 'Azure AD not configured'
            });
        }

        // 3. Validar e decodificar JWT
        jwt.verify(token, getKey, {
            audience: CLIENT_ID, // Validar audience (client ID)
            issuer: `https://login.microsoftonline.com/${TENANT_ID}/v2.0`, // Validar issuer
            algorithms: ['RS256'] // Apenas RS256
        }, async (err, decoded) => {
            if (err) {
                console.error('❌ Erro ao validar token:', err.message);
                return res.status(401).json({
                    error: 'Invalid token',
                    message: err.message
                });
            }

            try {
                // 4. Extrair informações do token
                const email = decoded.preferred_username || decoded.email || decoded.upn;

                if (!email) {
                    return res.status(401).json({
                        error: 'Invalid token',
                        message: 'No email found in token'
                    });
                }

                // 5. Buscar usuário no banco de dados
                const user = await userService.getUserByEmail(email);

                if (!user) {
                    return res.status(403).json({
                        error: 'Access denied',
                        message: 'User not found in system. Please contact administrator.'
                    });
                }

                if (user.status !== 'active') {
                    return res.status(403).json({
                        error: 'Access denied',
                        message: 'User account is inactive'
                    });
                }

                // 6. Anexar informações do usuário à requisição
                req.user = {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    roleId: user.role_id,
                    roleName: user.role_name,
                    allowedResources: user.allowed_resources ? JSON.parse(user.allowed_resources) : {},
                    azureToken: decoded // Manter token decodificado se necessário
                };

                console.log(`✅ Usuário autenticado: ${user.email} (${user.role_name})`);
                next();

            } catch (dbError) {
                console.error('❌ Erro ao buscar usuário:', dbError);
                return res.status(500).json({
                    error: 'Server error',
                    message: 'Error fetching user data'
                });
            }
        });

    } catch (error) {
        console.error('❌ Erro no middleware de autenticação:', error);
        return res.status(500).json({
            error: 'Server error',
            message: 'Authentication error'
        });
    }
}

/**
 * Middleware de autenticação opcional
 * Não bloqueia se não houver token, mas carrega usuário se houver
 */
async function optionalAuth(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        // Sem token, apenas continua
        req.user = null;
        return next();
    }

    // Com token, tenta autenticar
    await authenticate(req, res, next);
}

module.exports = {
    authenticate,
    optionalAuth
};
