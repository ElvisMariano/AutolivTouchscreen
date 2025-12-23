import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Cleanup após cada teste
afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});

// Mock de variáveis de ambiente
process.env.VITE_BACKEND_URL = 'http://localhost:3001';

// Mock global do console para evitar poluir output dos testes
global.console = {
    ...console,
    error: vi.fn(), // Mock console.error para testes de erro
    warn: vi.fn(),  // Mock console.warn
};

// Extend expect com matchers do jest-dom
expect.extend({});
