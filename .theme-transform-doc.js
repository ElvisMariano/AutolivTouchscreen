#!/usr/bin/env node

// Script para atualizar classes Tailwind de tema fixo para responsivo
// Este script NÃO deve ser executado, é apenas documentação das transformações aplicadas

const transformations = [
    // Backgrounds
    { from: 'bg-gray-900', to: 'bg-white dark:bg-gray-900' },
    { from: 'bg-gray-800', to: 'bg-gray-100 dark:bg-gray-800' },
    { from: 'bg-gray-700', to: 'bg-gray-200 dark:bg-gray-700' },

    // Text colors
    { from: 'text-white', to: 'text-gray-900 dark:text-white' },
    { from: 'text-gray-300', to: 'text-gray-700 dark:text-gray-300' },
    { from: 'text-gray-400', to: 'text-gray-600 dark:text-gray-400' },
    { from: 'text-gray-500', to: 'text-gray-600 dark:text-gray-500' },

    // Borders
    { from: 'border-gray-700', to: 'border-gray-300 dark:border-gray-700' },
    { from: 'border-gray-600', to: 'border-gray-300 dark:border-gray-600' },

    // Hovers
    { from: 'hover:bg-gray-700', to: 'hover:bg-gray-300 dark:hover:bg-gray-700' },
    { from: 'hover:bg-gray-600', to: 'hover:bg-gray-400 dark:hover:bg-gray-600' },
    { from: 'hover:text-white', to: 'hover:text-gray-900 dark:hover:text-white' },
];

// Componentes já atualizados:
// - Modal.tsx ✓
// - Header.tsx ✓
// - Dashboard.tsx ✓
// - QualityAlerts.tsx ✓
// - AdminPanel.tsx ✓
// - WorkInstructions.tsx ✓
// - StationCard.tsx ✓
// - AdminWorkInstructions.tsx ✓ (parcial)

// Componentes a atualizar:
// - AcceptanceCriteria.tsx
// - StandardizedWork.tsx
// - AdminAcceptanceCriteria.tsx
// - AdminStandardizedWork.tsx
// - AdminPresentations.tsx
// - AdminAlertsManagement.tsx
// - AdminUserManagement.tsx
// - AdminDocumentManagement.tsx
// - AdminPowerBI.tsx
// - AdminChangeLog.tsx
// - PdfViewer.tsx
// - PowerBiReport.tsx
