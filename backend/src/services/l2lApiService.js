const axios = require('axios');

const API_BASE_URL = process.env.L2L_API_BASE_URL;
const API_KEY = process.env.L2L_API_KEY;

/**
 * Constrói URL com parâmetros de autenticação
 * @param {string} endpoint - Endpoint da API (ex: '/sites/')
 * @param {Object} params - Parâmetros adicionais
 * @returns {string} URL completa
 */
function buildUrl(endpoint, params = {}) {
    const url = new URL(`${API_BASE_URL}${endpoint}`);

    // Autenticação e formato (obrigatórios)
    url.searchParams.append('auth', API_KEY);

    // Parâmetros adicionais
    Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, String(value));
    });

    return url.toString();
}

/**
 * Executa requisição GET na API L2L
 * IMPORTANTE: A API L2L permite APENAS método GET!
 */
async function fetchFromL2L(endpoint, params = {}) {
    const url = buildUrl(endpoint, params);

    try {
        console.log(`🔄 [L2L API] GET ${endpoint}`);

        // APENAS GET! POST não é permitido
        const response = await axios.get(url, {
            headers: {
                'Accept': 'application/json',
            },
            timeout: 30000, // 30 segundos
        });

        console.log(`✅ [L2L API] Sucesso: ${endpoint}`);

        // API L2L retorna: { success: true, data: [...] } ou { success: false, error: '...' }
        const data = response.data;

        if (data.success === false) {
            throw {
                message: data.error || 'Erro desconhecido da API L2L',
                endpoint,
                status: response.status,
            };
        }

        // Retornar apenas o array de dados
        return data.data || [];
    } catch (error) {
        if (error.message && error.endpoint) {
            throw error; // Já é nosso erro customizado
        }

        console.error(`❌ [L2L API] Erro: ${endpoint}`, error.message);
        const errorResponse = error.response?.data;
        throw {
            message: errorResponse?.error || `Erro ao buscar ${endpoint}: ${error.message}`,
            endpoint,
            status: error.response?.status,
        };
    }
}

/**
 * Buscar todos os Sites (Plants)
 * Endpoint correto: /sites/ (plural, com s)
 */
async function getSites() {
    return fetchFromL2L('/sites/');
}

/**
 * Buscar todas as Lines
 * Endpoint correto: /lines/ (plural, com s)
 */
async function getLines(siteId = null) {
    const params = { limit: 1000 };
    if (siteId) params.site = siteId;
    return fetchFromL2L('/lines/', params);
}

/**
 * Buscar todas as Machines (Stations)
 * Endpoint correto: /machines/ (plural, com s)
 */
async function getMachines(lineId = null) {
    const params = { limit: 1000 };
    if (lineId) params.line = lineId;
    return fetchFromL2L('/machines/', params);
}

/**
 * Buscar todos os Documents
 * Endpoint correto: /documents/ (plural, com s)
 */
async function getDocuments(filters = {}) {
    return fetchFromL2L('/documents/', filters);
}

/**
 * Buscar documentos por categoria
 * Endpoint: /documents/list_bycategory/
 * Params: site, category, externalid (opcional - machine/station)
 */
async function getDocumentsByCategory(siteId, categoryId, externalId = null) {
    const params = {
        site: siteId,
        category: categoryId,
        params_use_codes: '0'
    };

    if (externalId) {
        params.externalid = externalId;
    }

    return fetchFromL2L('/documents/list_bycategory/', params);
}

/**
 * Buscar viewinfo (PDF) de um documento específico
 * Endpoint: /documents/viewinfo/{documentId}/
 */
async function getDocumentViewInfo(documentId, siteId) {
    return fetchFromL2L(`/documents/viewinfo/${documentId}/`, { site: siteId });
}

/**
 * Buscar dados de produção do turno atual
 * Endpoint: /pitches/
 * Retorna array de pitches do turno para agregação
 * @param {string} lineId - ID interno da linha (não external_id)
 * @param {string} shiftStartTime - Data/hora de início do turno (formato: YYYY-MM-DD HH:MM:SS)
 * @param {string} shiftEndTime - Data/hora de fim do turno (formato: YYYY-MM-DD HH:MM:SS)
 * @param {string} siteId - ID do site
 * @returns {Promise<Array>} Array de pitches do turno
 */
async function getShiftProduction(lineId, shiftStartTime, shiftEndTime, siteId) {
    const params = {
        site: siteId,
        line: lineId,
        pitch_start__gte: shiftStartTime,
        pitch_end__lte: shiftEndTime,
        limit: 2000 // Limite máximo da API
    };

    return fetchFromL2L('/pitches/', params);
}

/**
 * Testar conexão com API L2L
 */
async function testConnection() {
    try {
        await getSites();
        return true;
    } catch (error) {
        console.error('❌ Teste de conexão L2L falhou:', error.message);
        return false;
    }
}

/**
 * Buscar dados de evento de um dispatch específico
 * Endpoint: /dispatches/get_event_data/
 * @param {Object} params - Parâmetros da busca (dispatch_id, dispatch_number, etc)
 */
async function getEventData(params = {}) {
    return fetchFromL2L('/dispatches/get_event_data/', params);
}

/**
 * Iniciar exportação de dispatches (Async)
 * Endpoint: /dispatches/data_export/
 */
async function startDispatchExport(params = {}) {
    return fetchFromL2L('/dispatches/data_export/', params);
}

/**
 * Verificar status de job assíncrono
 * Endpoint: /sites/asyncjob_status/
 */
async function getAsyncJobStatus(jobId) {
    return fetchFromL2L('/sites/asyncjob_status/', { jobid: jobId });
}

module.exports = {
    getSites,
    getLines,
    getMachines,
    getDocuments,
    getDocumentsByCategory,
    getDocumentViewInfo,
    getShiftProduction,
    getEventData,
    startDispatchExport,
    getAsyncJobStatus,
    testConnection,
};
