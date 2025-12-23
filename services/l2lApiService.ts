/**
 * Serviço de Integração com API Leading2Lean (L2L)
 * 
 * @description
 * Fornece funções para comunicação com a API do sistema Leading2Lean,
 * incluindo busca de Sites, Lines, Machines e Documents.
 * 
 * @important
 * Todas as requisições requerem autenticação via query parameter
 * e devem especificar formato JSON.
 */

// ==================== TIPOS ====================

export interface L2LSite {
    id: string;
    name: string;
    code: string;
    [key: string]: any; // Campos adicionais da API
}

export interface L2LLine {
    id: string;
    name: string;
    code: string;
    site: string; // ID do site
    [key: string]: any;
}

export interface L2LMachine {
    id: string;
    name: string;
    code: string;
    line: string; // ID da linha
    site: string; // ID do site
    [key: string]: any;
}

export interface L2LDocument {
    id: string;
    name: string;
    document_type: string;
    viewinfo: string; // data:url do PDF do PLM
    [key: string]: any;
}

export interface L2LApiError {
    message: string;
    status?: number;
    endpoint?: string;
}

// ==================== CONFIGURAÇÃO ====================

const API_BASE_URL = import.meta.env.VITE_L2L_API_BASE_URL || 'https://autoliv-mx.leading2lean.com/api/1.0';
const API_KEY = import.meta.env.VITE_L2L_API_KEY || import.meta.env.API_LEADING2LEAN_KEY || '';

if (!API_KEY) {
    console.warn('⚠️ L2L API Key não configurada. Configure VITE_L2L_API_KEY no arquivo .env');
}

// ==================== FUNÇÕES AUXILIARES ====================

/**
 * Constrói URL completa com autenticação e formato JSON
 */
function buildUrl(endpoint: string, params?: Record<string, string>): string {
    const url = new URL(`${API_BASE_URL}${endpoint}`);

    // Adicionar autenticação e formato
    url.searchParams.append('auth', API_KEY);
    url.searchParams.append('format', 'json');

    // Adicionar parâmetros adicionais
    if (params) {
        Object.entries(params).forEach(([key, value]) => {
            url.searchParams.append(key, value);
        });
    }

    return url.toString();
}

/**
 * Executa requisição HTTP através do proxy Supabase Edge Function
 */
async function fetchFromL2L<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const proxyUrl = `${supabaseUrl}/functions/v1/l2l-proxy`;

    try {
        console.log(`🔄 Buscando dados de L2L via proxy: ${endpoint}`);

        const response = await fetch(proxyUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                endpoint,
                params,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw {
                message: errorData.error || `Erro HTTP ${response.status}: ${response.statusText}`,
                status: response.status,
                endpoint,
            } as L2LApiError;
        }

        const data = await response.json();
        console.log(`✅ Dados recebidos de L2L via proxy: ${endpoint}`);

        return data;
    } catch (error) {
        if ((error as L2LApiError).status) {
            throw error;
        }

        throw {
            message: `Erro ao conectar com proxy L2L: ${(error as Error).message}`,
            endpoint,
        } as L2LApiError;
    }
}

// ==================== FUNÇÕES PÚBLICAS ====================

/**
 * Busca todos os Sites (Plantas) da API L2L
 */
export async function fetchSites(): Promise<L2LSite[]> {
    try {
        const response = await fetchFromL2L<{ objects?: L2LSite[] } | L2LSite[]>('/sites/');

        // API pode retornar array direto ou objeto com propriedade 'objects'
        if (Array.isArray(response)) {
            return response;
        }

        return response.objects || [];
    } catch (error) {
        console.error('❌ Erro ao buscar Sites:', error);
        throw error;
    }
}

/**
 * Busca Lines (Linhas de Produção) da API L2L
 * @param siteId - Filtrar por ID do site (opcional)
 */
export async function fetchLines(siteId?: string): Promise<L2LLine[]> {
    try {
        const params = siteId ? { site: siteId } : undefined;
        const response = await fetchFromL2L<{ objects?: L2LLine[] } | L2LLine[]>('/lines/', params);

        if (Array.isArray(response)) {
            return response;
        }

        return response.objects || [];
    } catch (error) {
        console.error('❌ Erro ao buscar Lines:', error);
        throw error;
    }
}

/**
 * Busca Machines (Estações) da API L2L
 * @param lineId - Filtrar por ID da linha (opcional)
 */
export async function fetchMachines(lineId?: string): Promise<L2LMachine[]> {
    try {
        const params = lineId ? { line: lineId } : undefined;
        const response = await fetchFromL2L<{ objects?: L2LMachine[] } | L2LMachine[]>('/machines/', params);

        if (Array.isArray(response)) {
            return response;
        }

        return response.objects || [];
    } catch (error) {
        console.error('❌ Erro ao buscar Machines:', error);
        throw error;
    }
}

/**
 * Busca Documents da API L2L
 * @param filters - Filtros opcionais (line, machine, document_type)
 */
export async function fetchDocuments(filters?: {
    line?: string;
    machine?: string;
    document_type?: string;
}): Promise<L2LDocument[]> {
    try {
        const response = await fetchFromL2L<{ objects?: L2LDocument[] } | L2LDocument[]>(
            '/document/',
            filters
        );

        if (Array.isArray(response)) {
            return response;
        }

        return response.objects || [];
    } catch (error) {
        console.error('❌ Erro ao buscar Documents:', error);
        throw error;
    }
}

/**
 * Testa conexão com a API L2L
 */
export async function testConnection(): Promise<boolean> {
    try {
        await fetchSites();
        console.log('✅ Conexão com API L2L estabelecida com sucesso');
        return true;
    } catch (error) {
        console.error('❌ Falha ao conectar com API L2L:', error);
        return false;
    }
}

/**
 * Obtém informações de configuração da API (para debug)
 */
export function getApiConfig(): { baseUrl: string; hasApiKey: boolean } {
    return {
        baseUrl: API_BASE_URL,
        hasApiKey: !!API_KEY,
    };
}
