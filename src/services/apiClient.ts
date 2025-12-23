import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

/**
 * API Client para comunicação com backend Node.js/Express
 * Substitui chamadas ao Supabase por HTTP requests
 */

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

import { msalInstance } from './msalInstance';
import { loginRequest } from '../authConfig';

// Criar instância do Axios
const apiClient: AxiosInstance = axios.create({
    baseURL: `${API_BASE_URL}/api`,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

/**
 * Request Interceptor
 * Adiciona token de autenticação automaticamente
 */
apiClient.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
        const account = msalInstance.getActiveAccount();
        if (account) {
            try {
                const response = await msalInstance.acquireTokenSilent({
                    ...loginRequest,
                    account: account
                });
                if (response.accessToken) {
                    config.headers.Authorization = `Bearer ${response.accessToken}`;
                }
            } catch (error) {
                console.warn('⚠️ Falha ao obter token silencioso para API:', error);
                // Não bloquear a request, pode ser uma rota pública ou o backend retornará 401
            }
        }

        console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
    },
    (error) => {
        console.error('❌ Request Error:', error);
        return Promise.reject(error);
    }
);

/**
 * Response Interceptor
 * Trata erros globalmente
 */
apiClient.interceptors.response.use(
    (response) => {
        console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
        return response;
    },
    (error: AxiosError) => {
        if (error.response) {
            // Servidor respondeu com status de erro
            console.error(`❌ API Error: ${error.response.status} - ${error.config?.url}`);
            console.error('Error data:', error.response.data);

            // Tratar erros específicos
            switch (error.response.status) {
                case 401:
                    console.error('🔒 Não autorizado - Token inválido ou expirado');
                    // TODO: Redirecionar para login ou renovar token
                    break;
                case 403:
                    console.error('🚫 Acesso negado');
                    break;
                case 404:
                    console.error('🔍 Recurso não encontrado');
                    break;
                case 500:
                    console.error('💥 Erro interno do servidor');
                    break;
            }
        } else if (error.request) {
            // Requisição foi feita mas sem resposta
            console.error('📡 Sem resposta do servidor:', error.message);
        } else {
            // Erro ao configurar requisição
            console.error('⚙️ Erro na configuração:', error.message);
        }

        return Promise.reject(error);
    }
);

/**
 * Helper para extrair dados da resposta
 */
export function getData<T>(response: any): T {
    return response.data;
}

/**
 * Helper para tratar erros
 */
export function handleApiError(error: any): never {
    if (axios.isAxiosError(error)) {
        const message = error.response?.data?.error || error.response?.data?.message || error.message;
        throw new Error(message);
    }
    throw error;
}

export default apiClient;
