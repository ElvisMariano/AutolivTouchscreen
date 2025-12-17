import React, { ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { useDocuments } from '../../../hooks/useDocuments';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as lineService from '../../../services/lineService';
import * as stationService from '../../../services/stationService';
import { DocumentCategory } from '../../../types';

// Mock Services
vi.mock('../../../services/lineService');
vi.mock('../../../services/stationService');

// Query Client setup
const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
            },
        },
    });
    return ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
};

describe('useDocuments', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should fetch and categorize documents correctly', async () => {
        // Mock data
        const mockDbDocs = [
            {
                id: '1',
                title: 'Report 1',
                document_type: 'report',
                document_id: 'rep1',
                line_id: 'line1',
                uploaded_at: '2023-01-01'
            },
            {
                id: '2',
                title: 'Work Instruction 1',
                document_type: 'work_instructions',
                document_id: 'doc1',
                line_id: 'line1',
                version: '1.0',
                uploaded_at: '2023-01-02'
            },
            {
                id: '3',
                title: 'Alert 1',
                document_type: 'alert',
                document_id: 'alert1',
                line_id: 'line1',
                uploaded_at: '2023-01-03',
                metadata: { severity: 'A', description: 'desc', expiresAt: '2099-01-01', isRead: false }
            }
        ];

        const mockStationInstructions = [
            {
                id: 'st1',
                title: 'Station Doc 1',
                document_id: 'url1',
                version: '2',
                uploaded_at: '2023-01-04',
                work_stations: { line_id: 'line1', name: 'Station A' },
                station_id: 's1'
            }
        ];

        (lineService.getAllLineDocumentsFromDB as any).mockResolvedValue(mockDbDocs);
        (stationService.getAllStationInstructions as any).mockResolvedValue(mockStationInstructions);

        const { result } = renderHook(() => useDocuments(), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.data).toBeDefined();
        const { reports, docs, alerts } = result.current.data!;

        // Check Reports
        expect(reports).toHaveLength(1);
        expect(reports[0].name).toBe('Report 1');

        // Check Alerts
        expect(alerts).toHaveLength(1);
        expect(alerts[0].title).toBe('Alert 1');

        // Check Docs (Standard + Station Instructions)
        expect(docs).toHaveLength(2);

        // Standard Doc
        const standardDoc = docs.find(d => d.id === '2');
        expect(standardDoc).toBeDefined();
        expect(standardDoc?.category).toBe(DocumentCategory.WorkInstruction);

        // Station Doc
        const stationDoc = docs.find(d => d.id === 'st1');
        expect(stationDoc).toBeDefined();
        expect(stationDoc?.stationName).toBe('Station A');
    });

    it('should create document', async () => {
        (lineService.addLineDocument as any).mockResolvedValue({ id: 'new1' });

        const { result } = renderHook(() => useDocuments(), { wrapper: createWrapper() });

        await result.current.createDocument.mutateAsync({
            lineId: 'line1',
            type: 'report',
            documentId: 'rep_new',
            title: 'New Report',
            uploadedBy: 'user1'
        });

        expect(lineService.addLineDocument).toHaveBeenCalledWith(
            'line1', 'report', 'rep_new', 'New Report', 'user1', undefined, undefined
        );
    });

    it('should update document', async () => {
        (lineService.updateLineDocument as any).mockResolvedValue({ id: '1' });

        const { result } = renderHook(() => useDocuments(), { wrapper: createWrapper() });

        await result.current.updateDocument.mutateAsync({
            id: '1',
            updates: { title: 'Updated' }
        });

        expect(lineService.updateLineDocument).toHaveBeenCalledWith('1', { title: 'Updated' });
    });

    it('should delete document', async () => {
        (lineService.deleteLineDocument as any).mockResolvedValue(true);

        const { result } = renderHook(() => useDocuments(), { wrapper: createWrapper() });

        await result.current.deleteDocument.mutateAsync('1');

        expect(lineService.deleteLineDocument).toHaveBeenCalledWith('1');
    });

    it('should acknowledge document', async () => {
        (lineService.acknowledgeDocument as any).mockResolvedValue(true);

        const { result } = renderHook(() => useDocuments(), { wrapper: createWrapper() });

        await result.current.acknowledgeDocument.mutateAsync({
            documentId: 'doc1',
            shift: '1',
            userId: 'u1'
        });

        expect(lineService.acknowledgeDocument).toHaveBeenCalledWith('doc1', '1', 'u1');
    });
});
