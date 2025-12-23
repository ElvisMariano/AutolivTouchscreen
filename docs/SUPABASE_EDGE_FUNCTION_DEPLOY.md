# Deploy Manual da Edge Function via Supabase Dashboard

## Por que deploy manual?

O deploy via CLI está falhando devido a problemas de autenticação. A alternativa mais simples é fazer o deploy diretamente pelo Dashboard do Supabase.

## Passo a Passo

### 1. Acessar o Dashboard do Supabase

1. Abra o navegador e acesse: https://supabase.com/dashboard
2. Faça login com sua conta
3. Selecione o projeto: `rfuqmjsntwkbhtwkrngs`

### 2. Criar a Edge Function

1. No menu lateral, clique em **Edge Functions**
2. Clique em **Create a new function**
3. Nome da função: `l2l-proxy`
4. Clique em **Create function**

### 3. Substituir o Código

1. Após criar, você verá um editor de código
2. **DELETAR TODO o código padrão**
3. **COPIAR e COLAR** o código abaixo:

```typescript
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
```

4. Clique em **Deploy** ou **Save and Deploy**

### 4. Configurar Secret (L2L_API_KEY)

1. Ainda na página da Edge Function, procure por **Secrets** ou **Environment Variables**
2. Clique em **Add Secret** ou **Add Variable**
3. Nome: `L2L_API_KEY`
4. Valor: `FZDz8iarUYWpZrXkrbsowo95bmaoQqZV`
5. Clique em **Save** ou **Add**
6. **IMPORTANTE**: Após adicionar o secret, faça o **Re-deploy** da função para ela usar o novo secret

### 5. Testar a Edge Function

1. Na página da Edge Function, procure por **Test** ou **Invoke**
2. Use o seguinte payload de teste:

```json
{
  "endpoint": "/site/"  
}
```

3. Clique em **Invoke** ou **Test**
4. Você deve ver uma resposta com os sites da API L2L

### 6. Testar na Aplicação

1. Volte para sua aplicação
2. Acesse: Admin → Sincronização L2L
3. Clique em **🔌 Testar Conexão**
4. Deve aparecer **✅ Conexão estabelecida com sucesso!**

## Troubleshooting

### Erro "L2L API Key não configurada"
- Verifique se adicionou o secret `L2L_API_KEY`
- Faça re-deploy da função após adicionar o secret

### Erro de CORS
- Verifique se os headers CORS estão corretos no código
- Certifique-se de que o método da requisição é POST

### Erro 404 na Edge Function
- Verifique se o nome da função está correto: `l2l-proxy`
- Verifique se a função foi deployada com sucesso

### URL da Edge Function

A URL completa deve ser:
```
https://rfuqmjsntwkbhtwkrngs.supabase.co/functions/v1/l2l-proxy
```

## Alternativa: Deploy via CLI (se resolver autenticação)

Se quiser tentar via CLI depois:

```bash
# Login
supabase login

# Link (vai pedir senha do banco)
supabase link --project-ref rfuqmjsntwkbhtwkrngs

# Configurar secret
supabase secrets set L2L_API_KEY=FZDz8iarUYWpZrXkrbsowo95bmaoQqZV

# Deploy
supabase functions deploy l2l-proxy
```

## Status

- ⚠️ Deploy via CLI: Falhando (problemas de autenticação)
- ✅ Deploy via Dashboard: **RECOMENDADO** (mais simples)
- 📄 Código da função: Pronto para copiar e colar
