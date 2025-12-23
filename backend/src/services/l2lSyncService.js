const l2lApiService = require('./l2lApiService');
const { getPool, sql } = require('../config/database');

/**
 * Resultado de sincronização
 */
function createSyncResult() {
    return {
        success: true,
        created: 0,
        updated: 0,
        deactivated: 0,
        errors: [],
    };
}

/**
 * Registrar log de sincronização
 */
async function logSyncResult(syncType, result, userId = null) {
    try {
        const pool = await getPool();
        await pool.request()
            .input('sync_type', sql.NVarChar(50), syncType)
            .input('status', sql.NVarChar(20), result.success ? 'success' : result.errors.length > 0 ? 'partial' : 'error')
            .input('records_created', sql.Int, result.created)
            .input('records_updated', sql.Int, result.updated)
            .input('records_deactivated', sql.Int, result.deactivated)
            .input('errors', sql.NVarChar(sql.MAX), result.errors.length > 0 ? JSON.stringify(result.errors) : null)
            .input('synced_by', sql.UniqueIdentifier, userId)
            .query(`
                INSERT INTO l2l_sync_logs 
                (sync_type, status, records_created, records_updated, records_deactivated, errors, synced_by)
                VALUES 
                (@sync_type, @status, @records_created, @records_updated, @records_deactivated, @errors, @synced_by)
            `);
    } catch (error) {
        console.error('❌ Erro ao registrar log de sincronização:', error);
    }
}

/**
 * Sincronizar Production Lines para uma planta específica
 * @param {string} plantId - ID da planta no banco
 * @param {string} siteId - L2L Site ID (external_id da planta)
 * @param {string} userId - ID do usuário que iniciou sync
 */
/**
 * Sincronizar Production Lines para uma planta específica
 * @param {string} plantId - ID da planta no banco
 * @param {string} siteId - L2L Site ID (external_id da planta)
 * @param {string} userId - ID do usuário que iniciou sync
 */
async function syncLinesForPlant(plantId, siteId, userId = null) {
    const result = createSyncResult();

    try {
        console.log(`🔄 Sincronizando Lines para Site L2L: ${siteId}...`);

        // Buscar lines da L2L para este site específico (GET apenas!)
        const l2lLines = await l2lApiService.getLines(siteId);
        console.log(`📥 ${l2lLines.length} lines recebidas da L2L para site ${siteId}`);

        const pool = await getPool();

        // Processar cada line
        for (const line of l2lLines) {
            try {
                // Mapeamento CORRETO:
                // id (L2L) -> id_l2l (DB)
                // externalid (L2L) -> external_id (DB)

                const l2lId = String(line.id);          // ID numérico do L2L
                const externalId = line.externalid ? String(line.externalid) : null; // External ID strict
                const lineName = line.name || line.code || `Line ${l2lId}`;

                // DEBUG: Logar estrutura se for a primeira linha (ajuda a verificar nomes de campo)
                if (l2lLines.indexOf(line) === 0) {
                    console.log('🔍 Estrutura do objeto Line (Keys):', Object.keys(line));
                    console.log('🔍 Exemplo Line:', JSON.stringify(line));
                }

                // 1. Tentar encontrar pelo id_l2l
                let existing = await pool.request()
                    .input('id_l2l', sql.NVarChar(50), l2lId)
                    .query('SELECT id FROM production_lines WHERE id_l2l = @id_l2l');

                // 2. Se não achou, tentar pelo external_id (mas apenas se externalId for válido, ou se antes usávamos ID)
                // OBS: O código antigo salvava ID no external_id. Então devemos verificar se o external_id DB bate com l2lId
                if (existing.recordset.length === 0) {
                    existing = await pool.request()
                        .input('old_id_check', sql.NVarChar(100), l2lId)
                        .query('SELECT id FROM production_lines WHERE external_id = @old_id_check');
                }

                if (existing.recordset.length > 0) {
                    // Atualizar
                    const dbId = existing.recordset[0].id;
                    await pool.request()
                        .input('id', sql.UniqueIdentifier, dbId)
                        .input('id_l2l', sql.NVarChar(50), l2lId)
                        .input('external_id', sql.NVarChar(100), externalId) // Apenas externalId, pode ser null
                        .input('name', sql.NVarChar(200), lineName)
                        .input('plant_id', sql.UniqueIdentifier, plantId)
                        .query(`
                            UPDATE production_lines
                            SET 
                                name = @name, 
                                plant_id = @plant_id,
                                id_l2l = @id_l2l,
                                external_id = @external_id,
                                updated_at = SYSDATETIMEOFFSET(), 
                                status = 'active'
                            WHERE id = @id
                        `);
                    result.updated++;
                    // console.log(`✅ Line atualizada: ${lineName} (L2L ID: ${l2lId})`);
                } else {
                    // Criar
                    await pool.request()
                        .input('name', sql.NVarChar(200), lineName)
                        .input('plant_id', sql.UniqueIdentifier, plantId)
                        .input('id_l2l', sql.NVarChar(50), l2lId)
                        .input('external_id', sql.NVarChar(100), externalId) // Apenas externalId
                        .query(`
                            INSERT INTO production_lines (name, plant_id, id_l2l, external_id, status)
                            VALUES (@name, @plant_id, @id_l2l, @external_id, 'active')
                        `);
                    result.created++;
                    console.log(`✅ Line criada: ${lineName} (L2L ID: ${l2lId})`);
                }
            } catch (error) {
                result.errors.push(`Erro ao processar line ${(line.name || line.id)}: ${error.message}`);
                console.error(`❌ Erro ao processar line ${(line.name || line.id)}:`, error.message);
            }
        }

        console.log(`✅ Sincronização Lines concluída para site ${siteId}`);
    } catch (error) {
        result.success = false;
        result.errors.push(`Erro geral: ${error.message}`);
        console.error(`❌ Erro na sincronização Lines para site ${siteId}:`, error);
    }

    return result;
}

/**
 * Sincronizar Production Lines para TODAS as plantas que têm Site ID configurado
 */
async function syncLines(userId = null) {
    const result = createSyncResult();

    try {
        console.log('🔄 Sincronizando Lines para todas as plantas...');

        const pool = await getPool();

        // Buscar todas as plantas que têm external_id (Site ID) configurado
        const plantsResult = await pool.request()
            .query(`
                SELECT id, name, external_id 
                FROM plants 
                WHERE external_id IS NOT NULL AND status = 'active'
            `);

        const plants = plantsResult.recordset;

        if (plants.length === 0) {
            console.warn('⚠️ Nenhuma planta com Site ID configurado encontrada');
            result.errors.push('Nenhuma planta com Site ID (external_id) configurado');
            result.success = false;
            await logSyncResult('lines', result, userId);
            return result;
        }

        console.log(`📋 ${plants.length} plantas com Site ID encontradas`);

        // Sincronizar lines para cada planta
        for (const plant of plants) {
            console.log(`\n🏭 Processando planta: ${plant.name} (Site ID: ${plant.external_id})`);

            const plantResult = await syncLinesForPlant(plant.id, plant.external_id, userId);

            // Acumular resultados
            result.created += plantResult.created;
            result.updated += plantResult.updated;
            result.deactivated += plantResult.deactivated;
            result.errors.push(...plantResult.errors);

            if (!plantResult.success) {
                result.success = false;
            }
        }

        console.log(`\n✅ Sincronização Lines concluída: ${result.created} criadas, ${result.updated} atualizadas`);
    } catch (error) {
        result.success = false;
        result.errors.push(`Erro geral: ${error.message}`);
        console.error('❌ Erro na sincronização Lines:', error);
    }

    await logSyncResult('lines', result, userId);
    return result;
}

/**
 * Sincronizar Machines para uma linha específica
 */
/**
 * Sincronizar Machines para uma linha específica
 */
/**
 * Sincronizar Machines para uma linha específica
 */
async function syncMachinesForLine(lineId, l2lLineId, userId = null) {
    const result = createSyncResult();

    try {
        console.log(`🔄 Sincronizando Machines para Line L2L: ${l2lLineId}...`);

        // Buscar machines da L2L para esta linha (GET apenas!)
        const l2lMachines = await l2lApiService.getMachines(l2lLineId);
        console.log(`📥 ${l2lMachines.length} machines recebidas da L2L para line ${l2lLineId}`);

        const pool = await getPool();

        // Processar cada machine
        for (const machine of l2lMachines) {


            try {
                // Mapeamento:
                // code -> name
                // id -> station_id
                // externalid -> external_id
                // description -> description

                const l2lId = String(machine.id);           // ID numérico (vai para station_id)
                const machineCode = machine.code || `Station ${l2lId}`; // code vai para name
                const externalId = machine.externalid ? String(machine.externalid) : null;
                const description = machine.description || null;

                // 1. Tentar encontrar pelo station_id
                let existing = await pool.request()
                    .input('station_id', sql.NVarChar(50), l2lId)
                    .query('SELECT id FROM work_stations WHERE station_id = @station_id');

                // 2. Se não achou, tentar pelo external_id (compatibilidade ou segurança)
                if (existing.recordset.length === 0 && externalId) {
                    existing = await pool.request()
                        .input('external_id', sql.NVarChar(100), externalId)
                        .query('SELECT id FROM work_stations WHERE external_id = @external_id');
                }

                // 3. Se ainda não achou, tentar pelo antigo padrão onde external_id = id
                if (existing.recordset.length === 0) {
                    existing = await pool.request()
                        .input('old_id_check', sql.NVarChar(100), l2lId)
                        .query('SELECT id FROM work_stations WHERE external_id = @old_id_check');
                }

                if (existing.recordset.length > 0) {
                    // Atualizar
                    const dbId = existing.recordset[0].id;
                    const updateResult = await pool.request()
                        .input('id', sql.UniqueIdentifier, dbId)
                        .input('name', sql.NVarChar(200), machineCode)
                        .input('station_id', sql.NVarChar(50), l2lId)
                        .input('external_id', sql.NVarChar(100), externalId)
                        .input('description', sql.NVarChar(sql.MAX), description)
                        .input('line_id', sql.UniqueIdentifier, lineId)
                        .query(`
                            UPDATE work_stations
                            SET 
                                name = @name, 
                                line_id = @line_id, 
                                station_id = @station_id,
                                external_id = @external_id,
                                description = @description,
                                updated_at = SYSDATETIMEOFFSET(), 
                                status = 'active'
                            WHERE id = @id
                        `);
                    result.updated++;
                } else {
                    // Criar
                    await pool.request()
                        .input('name', sql.NVarChar(200), machineCode)
                        .input('line_id', sql.UniqueIdentifier, lineId)
                        .input('station_id', sql.NVarChar(50), l2lId)
                        .input('external_id', sql.NVarChar(100), externalId)
                        .input('description', sql.NVarChar(sql.MAX), description)
                        .query(`
                            INSERT INTO work_stations (name, line_id, station_id, external_id, description, status)
                            VALUES (@name, @line_id, @station_id, @external_id, @description, 'active')
                        `);
                    result.created++;
                }
            } catch (error) {
                result.errors.push(`Erro ao processar machine ${machine.id}: ${error.message}`);
                console.error(`❌ Erro ao processar machine ${machine.id}:`, error.message);
            }
        }

        console.log(`✅ Sincronização Machines concluída para line ${l2lLineId}`);
    } catch (error) {
        result.success = false;
        result.errors.push(`Erro geral: ${error.message}`);
        console.error(`❌ Erro na sincronização Machines para line ${l2lLineId}:`, error);
    }

    return result;
}

/**
 * Sincronizar Machines para todas as linhas que têm external_id
 */
async function syncMachines(userId = null) {
    const result = createSyncResult();

    try {
        console.log('🔄 Sincronizando Machines...');

        const pool = await getPool();

        // Buscar todas as linhas que têm id_l2l (Numeric ID) configurado
        // O campo external_id agora guarda o código alfanumérico, que NÃO serve para filtrar na API /machines/
        const linesResult = await pool.request()
            .query(`
                SELECT id, name, external_id, id_l2l
                FROM production_lines 
                WHERE id_l2l IS NOT NULL AND status = 'active'
            `);

        const lines = linesResult.recordset;

        console.log(`📋 ${lines.length} linhas encontradas no DB com id_l2l (prontas para sync)`);

        if (lines.length === 0) {
            console.warn('⚠️ Nenhuma linha com id_l2l encontrada. Execute sync de lines primeiro.');
            result.errors.push('Nenhuma linha com id_l2l encontrada');
            result.success = false;
            await logSyncResult('machines', result, userId);
            return result;
        }

        console.log(`📋 ${lines.length} linhas encontradas com id_l2l`);

        // Sincronizar machines para cada linha
        for (const line of lines) {
            // PASSAR id_l2l (NUMERIC) PARA A API
            const lineResult = await syncMachinesForLine(line.id, line.id_l2l, userId);

            result.created += lineResult.created;
            result.updated += lineResult.updated;
            result.deactivated += lineResult.deactivated;
            result.errors.push(...lineResult.errors);

            if (!lineResult.success) {
                result.success = false;
            }
        }

        console.log(`\n✅ Sincronização Machines concluída: ${result.created} criadas, ${result.updated} atualizadas`);
    } catch (error) {
        result.success = false;
        result.errors.push(`Erro geral: ${error.message}`);
    }

    await logSyncResult('machines', result, userId);
    return result;
}

/**
 * Sincronizar Documents (Work Instructions) para todas as machines
 * Usa endpoints corretos: /api/1.0/documents/list_bycategory/ e /api/1.0/documents/viewinfo/{id}/
 */
async function syncDocuments(userId = null) {
    const result = createSyncResult();

    try {
        console.log('🔄 Sincronizando Documents...');

        const pool = await getPool();

        // Buscar todas as estações que têm external_id
        const stationsResult = await pool.request()
            .query(`
                SELECT 
                    s.id, s.name, s.external_id, s.line_id,
                    l.external_id as line_external_id,
                    p.external_id as site_id
                FROM work_stations s
                INNER JOIN production_lines l ON s.line_id = l.id
                INNER JOIN plants p ON l.plant_id = p.id
                WHERE s.external_id IS NOT NULL AND s.status = 'active'
                  AND l.external_id IS NOT NULL
                  AND p.external_id IS NOT NULL
            `);

        const stations = stationsResult.recordset;

        if (stations.length === 0) {
            console.warn('⚠️ Nenhuma estação sincronizada encontrada. Execute sync de machines primeiro.');
            result.errors.push('Nenhuma estação com external_id encontrada');
            result.success = false;
            await logSyncResult('documents', result, userId);
            return result;
        }

        console.log(`📋 ${stations.length} estações encontradas`);

        // Agrupar estações por site
        const stationsBySite = stations.reduce((acc, station) => {
            if (!acc[station.site_id]) {
                acc[station.site_id] = [];
            }
            acc[station.site_id].push(station);
            return acc;
        }, {});

        // Processar cada site
        for (const [siteId, siteStations] of Object.entries(stationsBySite)) {
            console.log(`\n🏭 Processando Site ${siteId} (${siteStations.length} estações)`);

            // Buscar documentos por categoria (776 = Work Instruction)
            try {
                console.log(`🔄 Buscando documentos da categoria Work Instruction...`);
                const documents = await l2lApiService.getDocumentsByCategory(siteId, '776');
                console.log(`📥 ${documents.length} documentos recebidos`);

                // Criar mapa de machine external_id → station
                const stationMap = new Map();
                siteStations.forEach(station => {
                    stationMap.set(station.external_id, station);
                });

                // Processar cada documento
                for (const doc of documents) {
                    try {
                        // Identificar a estação associada ao documento
                        const machineExternalId = String(doc.machine || doc.machine_id || doc.externalid || '');
                        const station = stationMap.get(machineExternalId);

                        if (!station) {
                            console.warn(`⚠️ Documento ${doc.id} sem estação associada (machine: ${machineExternalId})`);
                            continue;
                        }

                        const documentId = String(doc.id);
                        const title = doc.name || doc.title || `Work Instruction ${documentId}`;

                        // Buscar viewinfo (PDF URL) do documento
                        let viewinfo = null;
                        try {
                            console.log(`🔍 Buscando viewinfo para documento ${documentId}...`);
                            const viewinfoData = await l2lApiService.getDocumentViewInfo(documentId, siteId);
                            // API retorna { url: "..." }
                            viewinfo = viewinfoData.url || viewinfoData.viewinfo || null;
                        } catch (viewinfoError) {
                            console.warn(`⚠️ Não foi possível obter viewinfo para documento ${documentId}: ${viewinfoError.message}`);
                        }

                        // Verificar se já existe
                        const existingResult = await pool.request()
                            .input('station_id', sql.UniqueIdentifier, station.id)
                            .input('category', sql.NVarChar(100), 'Work Instruction')
                            .query(`
                                SELECT id FROM line_documents 
                                WHERE station_id = @station_id AND category = @category
                            `);

                        if (existingResult.recordset.length > 0) {
                            // Atualizar
                            await pool.request()
                                .input('id', sql.UniqueIdentifier, existingResult.recordset[0].id)
                                .input('title', sql.NVarChar(500), title)
                                .input('document_url', sql.NVarChar(sql.MAX), viewinfo || doc.url || doc.document_url || '')
                                .input('viewinfo', sql.NVarChar(sql.MAX), viewinfo)
                                .input('line_id', sql.UniqueIdentifier, station.line_id)
                                .query(`
                                    UPDATE line_documents
                                    SET 
                                        title = @title,
                                        document_url = @document_url,
                                        viewinfo = @viewinfo,
                                        line_id = @line_id,
                                        updated_at = SYSDATETIMEOFFSET()
                                    WHERE id = @id
                                `);
                            result.updated++;
                            // console.log(`✅ Documento atualizado: ${title} (Estação: ${station.name})`);
                        } else {
                            // Criar
                            await pool.request()
                                .input('station_id', sql.UniqueIdentifier, station.id)
                                .input('line_id', sql.UniqueIdentifier, station.line_id)
                                .input('title', sql.NVarChar(500), title)
                                .input('document_url', sql.NVarChar(sql.MAX), viewinfo || doc.url || doc.document_url || '')
                                .input('viewinfo', sql.NVarChar(sql.MAX), viewinfo)
                                .input('category', sql.NVarChar(100), 'Work Instruction')
                                .query(`
                                    INSERT INTO line_documents (station_id, line_id, title, document_url, viewinfo, category)
                                    VALUES (@station_id, @line_id, @title, @document_url, @viewinfo, @category)
                                `);
                            result.created++;
                            // console.log(`✅ Documento criado: ${title} (Estação: ${station.name})`);
                        }
                    } catch (error) {
                        result.errors.push(`Erro ao processar document ${doc.id}: ${error.message}`);
                        console.error(`❌ Erro ao processar document ${doc.id}:`, error.message);
                    }
                }
            } catch (error) {
                result.errors.push(`Erro ao buscar documentos do site ${siteId}: ${error.message}`);
                console.error(`❌ Erro ao buscar documentos do site ${siteId}:`, error.message);
            }
        }

        console.log(`\n✅ Sincronização Documents concluída: ${result.created} criadas, ${result.updated} atualizadas`);
    } catch (error) {
        result.success = false;
        result.errors.push(`Erro geral: ${error.message}`);
        console.error('❌ Erro na sincronização Documents:', error);
    }

    await logSyncResult('documents', result, userId);
    return result;
}

/**
 * Sincronizar todas as entidades
 */
async function syncAll(userId = null) {
    console.log('🔄 Iniciando sincronização completa L2L...');

    const linesResult = await syncLines(userId);
    const machinesResult = await syncMachines(userId);
    const documentsResult = await syncDocuments(userId);

    const totalResult = {
        success: linesResult.success && machinesResult.success && documentsResult.success,
        created: linesResult.created + machinesResult.created + documentsResult.created,
        updated: linesResult.updated + machinesResult.updated + documentsResult.updated,
        deactivated: linesResult.deactivated + machinesResult.deactivated + documentsResult.deactivated,
        errors: [...linesResult.errors, ...machinesResult.errors, ...documentsResult.errors],
    };

    await logSyncResult('all', totalResult, userId);

    console.log('✅ Sincronização completa concluída');
    return totalResult;
}

/**
 * Sincronizar Plants de L2L
 */
async function syncPlants(userId = null) {
    const result = createSyncResult();

    try {
        console.log('🔄 Sincronizando Plants de L2L...');

        // Obter todas as plantas do banco para mapear names -> ids se necessário
        const pool = await getPool();

        // 1. Obter lista de sites da L2L
        // Nota: O serviço l2lApiService precisa ter o método getSites()
        // Se não tiver, usar getPlants() ou implementar.
        // Assumindo l2lApiService.getSites() ou similar.
        // Caso a API L2L não tenha endpoint de listar sites globalmente fácil, 
        // talvez precisemos de uma lista pré-definida ou iterar.
        // MAS, geralmente há um endpoint /api/1.0/sites/

        // Vamos verificar se l2lApiService tem getSites. Se não tiver, vamos assumir que o usuário
        // configurou o endpoint corretamente no service.
        let l2lSites = [];
        try {
            l2lSites = await l2lApiService.getSites();
        } catch (err) {
            // Fallback ou erro se não conseguir listar sites
            console.error('Erro ao listar sites do L2L:', err);
            throw err;
        }

        console.log(`📥 ${l2lSites.length} sites recebidos da L2L`);

        for (const site of l2lSites) {
            try {
                const siteId = String(site.id); // external_id
                const siteName = site.name;
                const siteCode = site.code; // Pode ser útil

                // Verificar se planta já existe pelo external_id
                let existing = await pool.request()
                    .input('external_id', sql.NVarChar(100), siteId)
                    .query('SELECT id FROM plants WHERE external_id = @external_id');

                if (existing.recordset.length > 0) {
                    // Atualizar
                    await pool.request()
                        .input('external_id', sql.NVarChar(100), siteId)
                        .input('name', sql.NVarChar(200), siteName)
                        .input('location', sql.NVarChar(200), siteCode || siteName)
                        .query(`
                            UPDATE plants
                            SET name = @name, location = @location, updated_at = SYSDATETIMEOFFSET(), status = 'active'
                            WHERE external_id = @external_id
                        `);
                    result.updated++;
                    console.log(`✅ Plant atualizada: ${siteName}`);
                } else {
                    // Verificar se existe pelo nome (caso tenhamos cadastrado manualmente sem external_id)
                    existing = await pool.request()
                        .input('name', sql.NVarChar(200), siteName)
                        .query('SELECT id FROM plants WHERE name = @name AND external_id IS NULL');

                    if (existing.recordset.length > 0) {
                        // Vincular external_id
                        await pool.request()
                            .input('id', sql.UniqueIdentifier, existing.recordset[0].id)
                            .input('external_id', sql.NVarChar(100), siteId)
                            .input('location', sql.NVarChar(200), siteCode || siteName)
                            .query(`
                                UPDATE plants
                                SET external_id = @external_id, location = @location, updated_at = SYSDATETIMEOFFSET(), status = 'active'
                                WHERE id = @id
                            `);
                        result.updated++;
                        console.log(`✅ Plant vinculada (external_id): ${siteName}`);
                    } else {
                        // Criar nova
                        await pool.request()
                            .input('name', sql.NVarChar(200), siteName)
                            .input('location', sql.NVarChar(200), siteCode || siteName)
                            .input('external_id', sql.NVarChar(100), siteId)
                            .query(`
                                INSERT INTO plants (name, location, external_id, status)
                                VALUES (@name, @location, @external_id, 'active')
                            `);
                        result.created++;
                        console.log(`✅ Plant criada: ${siteName}`);
                    }
                }

            } catch (error) {
                result.errors.push(`Erro ao processar site ${site.id}: ${error.message}`);
                console.error(`❌ Erro ao processar site ${site.id}:`, error.message);
            }
        }

        console.log(`\n✅ Sincronização Plants concluída: ${result.created} criadas, ${result.updated} atualizadas`);

    } catch (error) {
        result.success = false;
        result.errors.push(`Erro geral: ${error.message}`);
        console.error('❌ Erro na sincronização Plants:', error);
    }

    await logSyncResult('plants', result, userId);
    return result;
}

module.exports = {
    syncPlants,
    syncLines,
    syncMachines,
    syncDocuments,
    syncAll,
};
