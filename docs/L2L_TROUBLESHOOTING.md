# Troubleshooting - Integração L2L

## Erro "Failed to fetch" ao testar conexão

### Problema
Ao clicar em "Testar Conexão" no painel Admin L2L, aparece o erro:
```
❌ Erro ao buscar Sites: {message: 'Erro ao conectar com API L2L: Failed to fetch', endpoint: '/site/'}
```

### Causas Possíveis

#### 1. Problema de CORS (Cross-Origin Resource Sharing)
A API L2L pode não estar configurada para aceitar requisições do navegador (frontend).

**Solução**: A API L2L precisará ser acessada através de um proxy no backend, não diretamente do navegador.

#### 2. Requisição sendo bloqueada pelo navegador
APIs externas geralmente não permitem requisições diretas do frontend por segurança.

**Solução Recomendada**: Criar um endpoint proxy no backend (Node.js/Express ou Supabase Edge Functions).

### Implementação da Solução (Proxy Backend)

#### Opção 1: Supabase Edge Function (Recomendado)

Criar uma Edge Function que atua como proxy:

```typescript
// supabase/functions/l2l-proxy/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const L2L_BASE_URL = 'https://autoliv-mx.leading2lean.com/api/1.0';
const L2L_API_KEY = Deno.env.get('L2L_API_KEY') || '';

serve(async (req) => {
  const url = new URL(req.url);
  const endpoint = url.searchParams.get('endpoint') || '/site/';
  
  try {
    const l2lUrl = `${L2L_BASE_URL}${endpoint}?auth=${L2L_API_KEY}&format=json`;
    const response = await fetch(l2lUrl);
    const data = await response.json();
    
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
```

Depois atualizar o `l2lApiService.ts` para usar o proxy:
```typescript
const API_BASE_URL = '/functions/v1/l2l-proxy?endpoint=';
```

#### Opção 2: Backend Node.js/Express

Se houver um backend Node.js, criar rota proxy:

```javascript
// server.js ou routes/l2l.js
app.get('/api/l2l-proxy', async (req, res) => {
  const endpoint = req.query.endpoint || '/site/';
  const url = `https://autoliv-mx.leading2lean.com/api/1.0${endpoint}?auth=${process.env.L2L_API_KEY}&format=json`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Solução Temporária (Apenas para Desenvolvimento)

Para testar localmente durante desenvolvimento, pode-se desabilitar CORS no navegador:

**Chrome/Edge (Windows)**:
```bash
chrome.exe --disable-web-security --user-data-dir="C:/temp/chrome-dev"
```

⚠️ **ATENÇÃO**: Nunca usar isso em produção! Apenas para testes locais.

### Verificação

1. Verificar se a API Key está correta no `.env`
2. Testar a URL diretamente no navegador: `https://autoliv-mx.leading2lean.com/api/1.0/site/?auth=SUA_API_KEY&format=json`
3. Se funcionar no navegador mas não na aplicação, é CORS - implementar proxy
4. Se não funcionar nem no navegador, verificar API Key e URL

### Status Atual

- ✅ Correção aplicada: Removido atributo `jsx` inválido da tag `<style>`
- ⚠️ Pendente: Implementar proxy backend para contornar CORS
- ⚠️ Pendente: Executar migração SQL no banco de dados

### Próximos Passos

1. Decidir qual abordagem de proxy usar (Supabase Edge Function ou Backend Node.js)
2. Implementar o proxy
3. Atualizar `l2lApiService.ts` para usar o proxy
4. Testar novamente a conexão
