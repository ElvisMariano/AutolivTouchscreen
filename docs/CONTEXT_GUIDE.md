# Guia de Uso: DataContext vs LineContext

## Visão Geral

A aplicação possui dois contextos para gerenciar linhas de produção:

| Contexto | Propósito | Permite Null? | Quando Usar |
|----------|-----------|---------------|-------------|
| **DataContext** | Dados e lógica de negócio | ❌ Não (auto-select) | CRUD, dados, unreadDocuments |
| **LineContext** | Seleção de linha na UI | ✅ Sim | Renderização condicional, UI |

## Decisão Rápida

**Pergunta:** O componente deve ser exibido mesmo sem linha selecionada?
- ✅ Sim → Use `DataContext`
- ❌ Não → Use `LineContext`

## Detalhes dos Contextos

### DataContext

**Arquivo:** `contexts/DataContext.tsx`

**Características:**
- Auto-seleciona primeira linha automaticamente
- `selectedLineId` nunca é vazio quando há linhas
- Gerencia todos os dados da aplicação
- Calcula `unreadDocuments` filtrados por linha

**Use para:**
```tsx
// ✅ Operações CRUD
const { addDocument, updateDocument, docs } = useData();

// ✅ Acessar dados
const { alerts, biReports, presentations } = useData();

// ✅ Lógica de negócio
const { unreadDocuments } = useData();
```

### LineContext

**Arquivo:** `contexts/LineContext.tsx`

**Características:**
- Permite `selectedLine = null`
- Reflete seleção explícita do usuário
- Gerencia estado da UI
- Usado por dropdowns e selectors

**Use para:**
```tsx
// ✅ Renderização condicional
const { selectedLine } = useLine();
if (!selectedLine) return <Placeholder />;

// ✅ Validação de UI
const { selectedLine } = useLine();
const canProceed = selectedLine !== null;
```

## Exemplos Práticos

### ✅ Padrão Correto: DocumentNotification

```tsx
import { useLine } from '../contexts/LineContext';
import { useData } from '../contexts/DataContext';

const DocumentNotification = () => {
  // UI state - verifica se usuário selecionou
  const { selectedLine } = useLine();
  
  // Business data - documentos já filtrados
  const { unreadDocuments } = useData();
  
  // Só renderiza se usuário realmente selecionou linha
  if (!selectedLine || unreadDocuments.length === 0) {
    return null;
  }
  
  return <NotificationBadge count={unreadDocuments.length} />;
};
```

### ✅ Padrão Correto: AdminPanel

```tsx
import { useData } from '../contexts/DataContext';

const AdminPanel = () => {
  // Operações CRUD não precisam de LineContext
  const { docs, addDocument, updateDocument } = useData();
  
  // Pode operar mesmo sem linha explicitamente selecionada
  const handleAdd = (doc) => {
    addDocument(doc);
  };
  
  return <AdminForm onSubmit={handleAdd} />;
};
```

### ❌ Anti-Padrão: Verificação Incorreta

```tsx
// ❌ ERRADO - selectedLineId nunca será null!
const MyComponent = () => {
  const { selectedLineId } = useData();
  
  if (!selectedLineId) {
    return <div>Selecione uma linha</div>; // Nunca será exibido!
  }
  
  return <Content />;
};

// ✅ CORRETO
const MyComponent = () => {
  const { selectedLine } = useLine();
  
  if (!selectedLine) {
    return <div>Selecione uma linha</div>; // Funciona!
  }
  
  return <Content />;
};
```

## Tabela de Decisão Rápida

| Cenário | Use |
|---------|-----|
| Mostrar notificações só quando linha selecionada | `LineContext` |
| Buscar documentos para CRUD | `DataContext` |
| Validar formulário que requer linha | `LineContext` |
| Dropdown de seleção de linha | `LineContext` |
| Salvar documento no banco | `DataContext` |
| Calcular estatísticas de produção | `DataContext` |
| Exibir placeholder "Selecione uma linha" | `LineContext` |
| Filtrar dados por linha | `DataContext` |

## Resumo

💡 **Regra de Ouro:**
- **LineContext** = "O usuário selecionou algo?"
- **DataContext** = "Quais dados eu tenho?"

🚫 **Nunca misture:**
- Não use `selectedLineId` do DataContext para renderização condicional
- Não use LineContext para operações CRUD

✅ **Combinação válida:**
- É perfeitamente válido usar ambos no mesmo componente
- LineContext para UI, DataContext para dados
