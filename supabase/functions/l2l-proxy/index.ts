import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

/**
 * Supabase Edge Function: L2L API Proxy
 * 
 * @description
 * Atua como proxy para a API Leading2Lean (L2L) para contornar
 * restrições de CORS em requisições do navegador.
 * 
 * @endpoint POST /functions/v1/l2l-proxy
 * @body { endpoint: string, params?: Record<string, string> }
 */

const L2L_BASE_URL = 'https://autoliv-mx.leading2lean.com/api/1.0';
const L2L_API_KEY = Deno.env.get('L2L_API_KEY') || '';

// Configuração de CORS
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    // Handle CORS preflight request
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // Validar API Key
        if (!L2L_API_KEY) {
            return new Response(
                JSON.stringify({ error: 'L2L API Key não configurada' }),
                {
                    status: 500,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                }
            );
        }

        // Parse request body
        const { endpoint, params } = await req.json();

        if (!endpoint) {
            return new Response(
                JSON.stringify({ error: 'Endpoint não especificado' }),
                {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                }
            );
        }

        // Construir URL da API L2L
        const url = new URL(`${L2L_BASE_URL}${endpoint}`);
        url.searchParams.append('auth', L2L_API_KEY);
        url.searchParams.append('format', 'json');

        // Adicionar parâmetros adicionais
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                url.searchParams.append(key, String(value));
            });
        }

        console.log('🔄 Proxy request to L2L:', url.pathname);

        // Fazer requisição à API L2L
        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            console.error(`❌ L2L API error: ${response.status} ${response.statusText}`);
            return new Response(
                JSON.stringify({
                    error: `L2L API erro: ${response.status} ${response.statusText}`,
                    endpoint,
                }),
                {
                    status: response.status,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                }
            );
        }

        const data = await response.json();
        console.log('✅ L2L API response received');

        return new Response(JSON.stringify(data), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('❌ Proxy error:', error);
        return new Response(
            JSON.stringify({
                error: error instanceof Error ? error.message : 'Erro desconhecido',
            }),
            {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        );
    }
});
