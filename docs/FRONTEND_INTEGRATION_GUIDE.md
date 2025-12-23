# 🔌 Guia de Integração Frontend-Backend

## Visão Geral

Este guia demonstra como integrar o frontend React com o backend Node.js/Express usando o API Client.

---

## 📦 Componente de Exemplo Criado

**Arquivo:** `src/components/ApiIntegrationExample.tsx`

### Funcionalidades Demonstradas

✅ **GET Requests** - Buscar dados do backend:
```typescript
const plants = await api.plants.getPlants();
const lines = await api.lines.getLines(plantId);
const stations = await api.stations.getStations();
const alerts = await api.alerts.getActiveAlerts();
```

✅ **POST Request** - Criar novo alerta:
```typescript
const newAlert = await api.alerts.createAlert({
    line_id: lineId,
    title: 'Test Alert',
    description: 'Description',
    priority: 'medium',
    created_by: userId
});
```

✅ **Múltiplas Chamadas Paralelas**:
```typescript
const [plants, lines, stations, alerts] = await Promise.all([
    api.plants.getPlants(),
    api.lines.getLines(),
    api.stations.getStations(),
    api.alerts.getActiveAlerts()
]);
```

✅ **Error Handling** - Tratamento de erros:
```typescript
try {
    const data = await api.plants.getPlants();
    // Sucesso
} catch (error) {
    // Erro capturado
    console.error('Error:', error.message);
}
```

✅ **Loading States** - Estados de carregamento
✅ **Real-time Updates** - Atualização após ações

---

## 🎨 Como Usar em Seus Componentes

### Exemplo 1: Hook Simples

```typescript
import { useEffect, useState } from 'react';
import * as api from '../services/api';

function PlantsList() {
    const [plants, setPlants] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadPlants() {
            try {
                const data = await api.plants.getPlants();
                setPlants(data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        }
        loadPlants();
    }, []);

    if (loading) return <div>Loading...</div>;

    return (
        <ul>
            {plants.map(plant => (
                <li key={plant.id}>{plant.name}</li>
            ))}
        </ul>
    );
}
```

### Exemplo 2: Custom Hook Reutilizável

```typescript
import { useEffect, useState } from 'react';
import * as api from '../services/api';

function usePlants() {
    const [plants, setPlants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        api.plants.getPlants()
            .then(setPlants)
            .catch(setError)
            .finally(() => setLoading(false));
    }, []);

    const refresh = () => {
        setLoading(true);
        api.plants.getPlants()
            .then(setPlants)
            .catch(setError)
            .finally(() => setLoading(false));
    };

    return { plants, loading, error, refresh };
}

// Uso
function MyComponent() {
    const { plants, loading, error, refresh } = usePlants();
    // ...
}
```

### Exemplo 3: CRUD Completo

```typescript
function DocumentManager() {
    const [documents, setDocuments] = useState([]);

    // CREATE
    async function handleCreate(data) {
        const newDoc = await api.documents.createDocument(data);
        setDocuments(prev => [...prev, newDoc]);
    }

    // READ
    useEffect(() => {
        api.documents.getDocuments().then(setDocuments);
    }, []);

    // UPDATE
    async function handleUpdate(id, data) {
        const updated = await api.documents.updateDocument(id, data);
        setDocuments(prev => prev.map(doc => 
            doc.id === id ? updated : doc
        ));
    }

    // DELETE
    async function handleDelete(id) {
        await api.documents.deleteDocument(id);
        setDocuments(prev => prev.filter(doc => doc.id !== id));
    }

    return (/* JSX */);
}
```

---

## 🧪 Testando a Integração

### 1. Iniciar Backend

```bash
cd backend
npm start
```

**Verifique:** `http://localhost:3001/health`

### 2. Iniciar Frontend

```bash
npm run dev
```

**Verifique:** `http://localhost:5173`

### 3. Acessar Componente Exemplo

Adicione ao seu `App.tsx`:

```typescript
import ApiIntegrationExample from './components/ApiIntegrationExample';

function App() {
    return (
        <div>
            <ApiIntegrationExample />
        </div>
    );
}
```

### 4. Abrir Developer Tools

- **Console:** Ver requests e respostas
- **Network Tab:** Ver chamadas HTTP
- **Verificar:** Headers `Authorization` se auth ativada

---

## 🔍 Debug e Troubleshooting

### CORS Error

**Sintoma:** `Access to fetch blocked by CORS policy`

**Solução:**
```javascript
// backend/src/server.js
app.use(cors({
    origin: 'http://localhost:5173', // URL do frontend
    credentials: true
}));
```

### 401 Unauthorized (com AUTH_ENABLED=true)

**Sintoma:** Todas as requests retornam 401

**Solução:**
```bash
# Desabilitar auth temporariamente
# backend/.env
AUTH_ENABLED=false
```

### Dados não aparecem

**Debug:**
1. Verificar console do browser
2. Verificar Network tab (requests/responses)
3. Verificar backend logs
4. Testar endpoint manualmente: `curl http://localhost:3001/api/plants`

---

## 📊 Métricas de Performance

### Otimizações Implementadas

✅ **Parallel Requests** - Múltiplas chamadas simultâneas:
```typescript
// ❌ LENTO (serial)
const plants = await api.plants.getPlants();
const lines = await api.lines.getLines();

// ✅ RÁPIDO (parallel)
const [plants, lines] = await Promise.all([
    api.plants.getPlants(),
    api.lines.getLines()
]);
```

✅ **Caching** - Axios já faz cache automático
✅ **Error Boundaries** - Componentes isolados
✅ **Loading States** - Feedback visual imediato

---

## 🎯 Próximos Passos

1. **Substituir Mock Data** - Trocar dados hardcoded por API
2. **Adicionar React Query** - Cache e sincronização automática
3. **Implementar Optimistic Updates** - UI responsiva
4. **Adicionar Skeleton Loading** - UX melhor
5. **Error Toast Notifications** - Feedback de erros

---

## 💡 Boas Práticas

### ✅ DO (Faça)

- Use `try/catch` em todas as chamadas async
- Implemente loading states
- Trate erros graciosamente
- Use TypeScript types do API Client
- Evite chamadas desnecessárias (useEffect deps)

### ❌ DON'T (Não Faça)

- Não ignore erros silenciosamente
- Não faça requests em loops
- Não esqueça de cleanup (useEffect return)
- Não hardcode IDs ou dados
- Não confie em dados não validados

---

**Status:** 🟢 Integration Example pronto para uso!
