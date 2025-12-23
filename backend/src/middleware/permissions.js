/**
 * Middleware de permissões baseadas em roles
 * Verifica se o usuário tem acesso a um recurso específico
 */

/**
 * Requer permissão específica para um recurso
 * Deve ser usado APÓS o middleware authenticate
 */
function requirePermission(resource, action = null) {
    return async (req, res, next) => {
        try {
            // 1. Verificar se usuário foi autenticado
            if (!req.user) {
                return res.status(401).json({
                    error: 'Authentication required',
                    message: 'User not authenticated'
                });
            }

            // 2. Verificar se tem permissões
            const allowedResources = req.user.allowedResources || {};

            // 3. Verificar se tem acesso ao recurso
            if (!allowedResources[resource]) {
                console.warn(`⚠️ Acesso negado: ${req.user.email} tentou acessar ${resource}`);
                return res.status(403).json({
                    error: 'Access denied',
                    message: `You don't have permission to access ${resource}`
                });
            }

            // 4. Se ação específica foi fornecida, verificar
            if (action) {
                const permissions = allowedResources[resource];

                // Permissões podem ser array: ["read", "create", "update"]
                if (Array.isArray(permissions)) {
                    if (!permissions.includes(action)) {
                        console.warn(`⚠️ Ação negada: ${req.user.email} não pode ${action} em ${resource}`);
                        return res.status(403).json({
                            error: 'Action not allowed',
                            message: `You don't have permission to ${action} ${resource}`
                        });
                    }
                }
                // Ou string com todas permissões: "full"
                else if (permissions !== 'full' && permissions !== 'all') {
                    console.warn(`⚠️ Permissão inválida para ${resource}`);
                    return res.status(403).json({
                        error: 'Access denied',
                        message: `Invalid permissions for ${resource}`
                    });
                }
            }

            console.log(`✅ Permissão concedida: ${req.user.email} → ${resource}${action ? ':' + action : ''}`);
            next();

        } catch (error) {
            console.error('❌ Erro no middleware de permissões:', error);
            return res.status(500).json({
                error: 'Server error',
                message: 'Error checking permissions'
            });
        }
    };
}

/**
 * Requer uma role específica (por nome)
 */
function requireRole(...roleNames) {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    error: 'Authentication required',
                    message: 'User not authenticated'
                });
            }

            const userRole = req.user.roleName;

            if (!roleNames.includes(userRole)) {
                console.warn(`⚠️ Role negada: ${req.user.email} (${userRole}) tentou acessar rota que requer ${roleNames.join(' ou ')}`);
                return res.status(403).json({
                    error: 'Access denied',
                    message: `This action requires ${roleNames.join(' or ')} role`
                });
            }

            console.log(`✅ Role verificada: ${req.user.email} (${userRole})`);
            next();

        } catch (error) {
            console.error('❌ Erro no middleware de roles:', error);
            return res.status(500).json({
                error: 'Server error',
                message: 'Error checking role'
            });
        }
    };
}

/**
 * Requer que o usuário seja Admin
 */
function requireAdmin() {
    return requireRole('Admin', 'Administrator');
}

module.exports = {
    requirePermission,
    requireRole,
    requireAdmin
};
