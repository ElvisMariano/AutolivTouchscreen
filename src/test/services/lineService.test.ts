import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    getAllLineDocumentsFromDB,
    getLineDocuments,
    addLineDocument,
    updateLineDocument,
    deleteLineDocument,
} from '../../../services/lineService';
import * as documentsApi from '@/services/api/documents';

// Mock do módulo documents API
vi.mock('@/services/api/documents');
const mockedDocumentsApi = vi.mocked(documentsApi);

describe('lineService - Migração Supabase → API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getAllLineDocumentsFromDB', () => {
        it('deve retornar array vazio quando não há documentos', async () => {
            mockedDocumentsApi.getDocuments.mockResolvedValue([]);

            const result = await getAllLineDocumentsFromDB();

            expect(result).toEqual([]);
        });

        it('deve retornar documentos com mapeamento de campos', async () => {
            const mockApiDocs: documentsApi.LineDocument[] = [
                {
                    id: '123',
                    line_id: 'line-1',
                    category: 'quality',
                    document_url: 'https://example.com/doc.pdf',
                    title: 'Documento Teste',
                    created_at: '2024-01-01T10:00:00Z',
                    updated_at: '2024-01-01T10:00:00Z',
                },
            ];

            mockedDocumentsApi.getDocuments.mockResolvedValue(mockApiDocs);

            const result = await getAllLineDocumentsFromDB();

            expect(result).toHaveLength(1);
            expect(result[0]).toMatchObject({
                id: '123',
                line_id: 'line-1',
                document_type: 'quality',
                document_id: 'https://example.com/doc.pdf',
                title: 'Documento Teste',
            });
        });
    });

    describe('addLineDocument', () => {
        it('deve criar documento com transformação correta de campos', async () => {
            const newDoc: documentsApi.LineDocument = {
                id: 'new-123',
                line_id: 'line-1',
                category: 'quality',
                document_url: 'https://example.com/new.pdf',
                title: 'Novo Documento',
                created_at: '2024-01-01',
                updated_at: '2024-01-01',
            };

            mockedDocumentsApi.createDocument.mockResolvedValue(newDoc);

            const result = await addLineDocument(
                'line-1',
                'quality', // document_type → category
                'https://example.com/new.pdf', // document_id → document_url
                'Novo Documento',
                null // uploadedBy
            );

            expect(result).toBeTruthy();
        });

        it('deve retornar false em caso de erro', async () => {
            mockedDocumentsApi.createDocument.mockRejectedValue(new Error('API Error'));

            const result = await addLineDocument('line-1', 'quality', 'url', 'title', null);

            expect(result).toBe(false);
        });
    });

    describe('deleteLineDocument', () => {
        it('deve deletar documento', async () => {
            mockedDocumentsApi.deleteDocument.mockResolvedValue(undefined);

            const result = await deleteLineDocument('doc-123');

            expect(result).toBeTruthy();
            expect(mockedDocumentsApi.deleteDocument).toHaveBeenCalledWith('doc-123');
        });
    });
});
