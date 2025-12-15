import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllLineDocumentsFromDB, addLineDocument, updateLineDocument, deleteLineDocument } from '../services/lineService';
import { getStationsByLine, createStation, updateStation, deleteStation, reorderStations } from '../services/stationService';
import { Document, DocumentCategory, PowerBiReport, Presentation, QualityAlert, Machine } from '../types';

// Use this for global documents fetching
export const useDocuments = () => {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ['documents'],
        queryFn: async () => {
            const dbDocs = await getAllLineDocumentsFromDB();
            // Parse diverse document types

            const reports: PowerBiReport[] = [];
            const presentations: Presentation[] = [];
            const alerts: QualityAlert[] = [];
            const docs: Document[] = [];

            dbDocs.forEach((d: any) => {
                if (d.document_type === 'report') {
                    reports.push({
                        id: d.id,
                        name: d.title,
                        embedUrl: d.document_id,
                        lineId: d.line_id
                    });
                } else if (d.document_type === 'presentation') {
                    presentations.push({
                        id: d.id,
                        title: d.title,
                        url: d.document_id,
                        version: d.version,
                        lineId: d.line_id
                    });
                } else {
                    let category = d.document_type as DocumentCategory;
                    if (d.document_type === 'alert') {
                        const alert: QualityAlert = {
                            id: d.id,
                            title: d.title,
                            severity: d.metadata?.severity || 'C',
                            description: d.metadata?.description || '',
                            expiresAt: d.metadata?.expiresAt || new Date().toISOString(),
                            isRead: d.metadata?.isRead || false,
                            documentId: d.document_id,
                            createdAt: d.uploaded_at,
                            pdfUrl: d.document_id.startsWith('http') ? d.document_id : undefined,
                            pdfName: d.metadata?.pdfName,
                            lineId: d.line_id
                        };
                        alerts.push(alert);
                    } else {
                        if (d.document_type === 'acceptance_criteria') category = DocumentCategory.AcceptanceCriteria;
                        else if (d.document_type === 'work_instructions') category = DocumentCategory.WorkInstruction;
                        else if (d.document_type === 'standardized_work') category = DocumentCategory.StandardizedWork;

                        docs.push({
                            id: d.id,
                            title: d.title,
                            url: d.document_id,
                            category: category,
                            version: d.version,
                            lineId: d.line_id,
                            lastUpdated: d.uploaded_at
                        });
                    }
                }
            });
            return { reports, presentations, alerts, docs };
        },
        staleTime: 1000 * 60 * 5,
    });

    const createDocument = useMutation({
        mutationFn: async ({ lineId, type, documentId, title, uploadedBy, version, metadata }: {
            lineId: string,
            type: 'acceptance_criteria' | 'standardized_work' | 'presentation' | 'report' | 'alert',
            documentId: string,
            title: string,
            uploadedBy: string | null,
            version?: string,
            metadata?: any
        }) => {
            // We need to cast type if it comes as broader string, but strict typing is better.
            return await addLineDocument(lineId, type, documentId, title, uploadedBy, version, metadata);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['documents'] });
        }
    });

    const updateDocument = useMutation({
        mutationFn: async ({ id, updates }: { id: string, updates: any }) => {
            return await updateLineDocument(id, updates);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['documents'] });
        }
    });

    const deleteDocument = useMutation({
        mutationFn: async (id: string) => {
            return await deleteLineDocument(id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['documents'] });
        }
    });

    return {
        data: query.data,
        isLoading: query.isLoading,
        createDocument,
        updateDocument,
        deleteDocument
    };
};

export const useStations = (lineId: string) => {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ['stations', lineId],
        queryFn: async () => {
            if (!lineId) return [];
            const stations = await getStationsByLine(lineId);
            return stations.map(s => ({
                id: s.id,
                name: s.name,
                status: 'running',
                position: { x: 50, y: 50 },
                type: 'station'
            } as Machine));
        },
        enabled: !!lineId
    });

    const create = useMutation({
        mutationFn: async (data: { name: string; position: number; description?: string, userId: string }) => {
            return await createStation({ line_id: lineId, ...data }, data.userId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['stations', lineId] });
        }
    });

    return {
        stations: query.data || [],
        isLoading: query.isLoading,
        createStation: create
    };
};
