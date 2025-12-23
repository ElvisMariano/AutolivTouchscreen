import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as documentsApi from '@/services/api/documents';
import apiClient from '@/services/apiClient';

// Mock do apiClient (axios instance)
vi.mock('@/services/apiClient', () => ({
    default: {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
        interceptors: {
            request: { use: vi.fn() },
            response: { use: vi.fn() },
        },
    },
    getData: vi.fn((res) => res.data),
    handleApiError: vi.fn((err) => { throw err; }),
}));

const mockedApiClient = vi.mocked(apiClient);

describe('documents API - Usando apiClient', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getDocuments', () => {
        it('deve buscar documentos sem filtros', async () => {
            const mockDocs = [
                { id: '1', title: 'Doc 1', category: 'quality' },
                { id: '2', title: 'Doc 2', category: 'safety' },
            ];

            mockedApiClient.get.mockResolvedValue({ data: mockDocs });

            const result = await documentsApi.getDocuments();

            expect(result).toEqual(mockDocs);
            expect(mockedApiClient.get).toHaveBeenCalledWith('/documents', { params: undefined });
        });

        it('deve buscar documentos com filtros', async () => {
            const mockDocs = [{ id: '1', title: 'Filtered Doc', line_id: 'line-1' }];

            mockedApiClient.get.mockResolvedValue({ data: mockDocs });

            const result = await documentsApi.getDocuments({ lineId: 'line-1' });

            expect(result).toEqual(mockDocs);
            expect(mockedApiClient.get).toHaveBeenCalledWith('/documents', {
                params: { lineId: 'line-1' },
            });
        });
    });

    describe('createDocument', () => {
        it('deve criar documento corretamente', async () => {
            const newDoc: documentsApi.CreateDocumentDTO = {
                title: 'Novo Doc',
                document_url: 'https://example.com/doc.pdf',
                category: 'quality',
                line_id: 'line-1',
            };

            const createdDoc = { id: 'new-1', ...newDoc };
            mockedApiClient.post.mockResolvedValue({ data: createdDoc });

            const result = await documentsApi.createDocument(newDoc);

            expect(result).toEqual(createdDoc);
            expect(mockedApiClient.post).toHaveBeenCalledWith('/documents', newDoc);
        });
    });

    describe('updateDocument', () => {
        it('deve atualizar documento', async () => {
            const updateData: documentsApi.UpdateDocumentDTO = {
                title: 'Título Atualizado',
            };

            const updatedDoc = { id: 'doc-1', ...updateData };
            mockedApiClient.put.mockResolvedValue({ data: updatedDoc });

            const result = await documentsApi.updateDocument('doc-1', updateData);

            expect(result).toEqual(updatedDoc);
            expect(mockedApiClient.put).toHaveBeenCalledWith('/documents/doc-1', updateData);
        });
    });

    describe('deleteDocument', () => {
        it('deve deletar documento', async () => {
            mockedApiClient.delete.mockResolvedValue({ data: { success: true } });

            await documentsApi.deleteDocument('doc-123');

            expect(mockedApiClient.delete).toHaveBeenCalledWith('/documents/doc-123');
        });
    });
});
