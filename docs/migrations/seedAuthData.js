/**
 * Script para criar roles e usuários de teste no banco de dados
 * Executar: node src/seedAuthData.js
 */

const { getPool, sql } = require('./config/database');

async function seedAuthData() {
    console.log('🌱 Iniciando seed de dados de autenticação...\n');

    try {
        const pool = await getPool();

        // ============================================
        // 1. Criar Roles
        // ============================================
        console.log('📋 Criando roles...');

        const roles = [
            {
                name: 'Admin',
                description: 'Administrador com acesso completo ao sistema',
                allowed_resources: {
                    users: ['read', 'create', 'update', 'delete'],
                    roles: ['read', 'create', 'update', 'delete'],
                    plants: ['read', 'create', 'update', 'delete'],
                    lines: ['read', 'create', 'update', 'delete'],
                    stations: ['read', 'create', 'update', 'delete'],
                    documents: ['read', 'create', 'update', 'delete'],
                    alerts: ['read', 'create', 'update', 'delete', 'resolve'],
                    l2l_sync: ['execute', 'view_logs']
                }
            },
            {
                name: 'Operator',
                description: 'Operador com acesso a visualização e criação de alertas',
                allowed_resources: {
                    plants: ['read'],
                    lines: ['read'],
                    stations: ['read'],
                    documents: ['read'],
                    alerts: ['read', 'create']
                }
            },
            {
                name: 'Viewer',
                description: 'Visualizador com acesso somente leitura',
                allowed_resources: {
                    plants: ['read'],
                    lines: ['read'],
                    stations: ['read'],
                    documents: ['read'],
                    alerts: ['read']
                }
            }
        ];

        const roleIds = {};

        for (const role of roles) {
            // Verificar se já existe
            const existing = await pool.request()
                .input('name', sql.NVarChar(100), role.name)
                .query('SELECT id FROM roles WHERE name = @name');

            if (existing.recordset.length > 0) {
                roleIds[role.name] = existing.recordset[0].id;
                console.log(`  ✓ Role "${role.name}" já existe`);
            } else {
                const result = await pool.request()
                    .input('name', sql.NVarChar(100), role.name)
                    .input('description', sql.NVarChar(500), role.description)
                    .input('allowed_resources', sql.NVarChar(sql.MAX), JSON.stringify(role.allowed_resources))
                    .query(`
                        INSERT INTO roles (name, description, allowed_resources)
                        OUTPUT INSERTED.id
                        VALUES (@name, @description, @allowed_resources)
                    `);

                roleIds[role.name] = result.recordset[0].id;
                console.log(`  ✅ Role "${role.name}" criada`);
            }
        }

        // ============================================
        // 2. Criar Usuários de Teste
        // ============================================
        console.log('\n👤 Criando usuários de teste...');

        const users = [
            {
                name: 'Admin User',
                email: 'elvismariano@hotmail.com', // Seu email Azure AD
                role: 'Admin'
            },
            {
                name: 'Test Operator',
                email: 'operator@example.com',
                role: 'Operator'
            },
            {
                name: 'Test Viewer',
                email: 'viewer@example.com',
                role: 'Viewer'
            }
        ];

        for (const user of users) {
            // Verificar se já existe
            const existing = await pool.request()
                .input('email', sql.NVarChar(255), user.email)
                .query('SELECT id FROM users WHERE email = @email');

            if (existing.recordset.length > 0) {
                console.log(`  ✓ Usuário "${user.email}" já existe`);
            } else {
                await pool.request()
                    .input('name', sql.NVarChar(200), user.name)
                    .input('email', sql.NVarChar(255), user.email)
                    .input('role_id', sql.UniqueIdentifier, roleIds[user.role])
                    .query(`
                        INSERT INTO users (name, email, role_id, status)
                        VALUES (@name, @email, @role_id, 'active')
                    `);

                console.log(`  ✅ Usuário "${user.email}" criado (Role: ${user.role})`);
            }
        }

        // ============================================
        // 3. Resumo
        // ============================================
        console.log('\n📊 Resumo:');

        const roleCount = await pool.request().query('SELECT COUNT(*) as count FROM roles');
        const userCount = await pool.request().query('SELECT COUNT(*) as count FROM users');

        console.log(`  ✅ ${roleCount.recordset[0].count} roles no banco`);
        console.log(`  ✅ ${userCount.recordset[0].count} usuários no banco`);

        console.log('\n✅ Seed concluído com sucesso!');
        console.log('\n📝 Usuários de teste criados:');
        console.log('   Admin: elvismariano@hotmail.com');
        console.log('   Operator: operator@example.com');
        console.log('   Viewer: viewer@example.com');

        process.exit(0);

    } catch (error) {
        console.error('❌ Erro no seed:', error);
        process.exit(1);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    seedAuthData();
}

module.exports = { seedAuthData };
