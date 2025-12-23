import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DocumentNotification from '../../../components/common/DocumentNotification';

// Mock dos contextos
vi.mock('../../../contexts/DataContext', () => ({
    useData: vi.fn()
}));

vi.mock('../../../contexts/LineContext', () => ({
    useLine: vi.fn()
}));

import { useData } from '../../../contexts/DataContext';
import { useLine } from '../../../contexts/LineContext';

describe('DocumentNotification', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('não renderiza quando selectedLine é null', () => {
        vi.mocked(useLine).mockReturnValue({
            selectedLine: null,
            lines: [],
            setSelectedLineId: vi.fn(),
            refreshLines: vi.fn(),
            isLoading: false
        });

        vi.mocked(useData).mockReturnValue({
            unreadDocuments: [{ id: '1', title: 'Test Doc', url: '', version: 1, lastUpdated: '', category: 'WorkInstruction' as any }],
            setAutoOpenDocId: vi.fn()
        } as any);

        const { container } = render(
            <MemoryRouter>
                <DocumentNotification />
            </MemoryRouter>
        );

        expect(container.firstChild).toBeNull();
    });

    it('renderiza quando selectedLine existe e há unreadDocuments', () => {
        vi.mocked(useLine).mockReturnValue({
            selectedLine: { id: 'line1', name: 'Linha 1', description: '', machines: [], createdBy: '', plantId: '' },
            lines: [],
            setSelectedLineId: vi.fn(),
            refreshLines: vi.fn(),
            isLoading: false
        });

        vi.mocked(useData).mockReturnValue({
            unreadDocuments: [{ id: '1', title: 'Documento Teste', url: '', version: 1, lastUpdated: '2025-01-01', category: 'WorkInstruction' as any }],
            setAutoOpenDocId: vi.fn()
        } as any);

        render(
            <MemoryRouter>
                <DocumentNotification />
            </MemoryRouter>
        );

        // Verificar que o botão de notificação aparece
        expect(screen.getByTitle('Documentos com atualização pendente')).toBeInTheDocument();

        // Verificar que o contador está correto
        expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('não renderiza quando não há documentos não lidos', () => {
        vi.mocked(useLine).mockReturnValue({
            selectedLine: { id: 'line1', name: 'Linha 1', description: '', machines: [], createdBy: '', plantId: '' },
            lines: [],
            setSelectedLineId: vi.fn(),
            refreshLines: vi.fn(),
            isLoading: false
        });

        vi.mocked(useData).mockReturnValue({
            unreadDocuments: [],
            setAutoOpenDocId: vi.fn()
        } as any);

        const { container } = render(
            <MemoryRouter>
                <DocumentNotification />
            </MemoryRouter>
        );

        expect(container.firstChild).toBeNull();
    });

    it('exibe contador correto quando há múltiplos documentos', () => {
        vi.mocked(useLine).mockReturnValue({
            selectedLine: { id: 'line1', name: 'Linha 1', description: '', machines: [], createdBy: '', plantId: '' },
            lines: [],
            setSelectedLineId: vi.fn(),
            refreshLines: vi.fn(),
            isLoading: false
        });

        vi.mocked(useData).mockReturnValue({
            unreadDocuments: [
                { id: '1', title: 'Doc 1', url: '', version: 1, lastUpdated: '2025-01-01', category: 'WorkInstruction' as any },
                { id: '2', title: 'Doc 2', url: '', version: 1, lastUpdated: '2025-01-02', category: 'QualityAlert' as any },
                { id: '3', title: 'Doc 3', url: '', version: 1, lastUpdated: '2025-01-03', category: 'StandardizedWork' as any }
            ],
            setAutoOpenDocId: vi.fn()
        } as any);

        render(
            <MemoryRouter>
                <DocumentNotification />
            </MemoryRouter>
        );

        expect(screen.getByText('3')).toBeInTheDocument();
    });
});
