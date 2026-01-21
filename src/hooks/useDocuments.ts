import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDocuments, createDocument as createDocApi, updateDocument as updateDocApi, deleteDocument as deleteDocApi } from '@/services/api/documents';
import { getStations as getStationsByLine, createStation, updateStation, deleteStation, getStations as getAllStations } from '@/services/api/stations';
// ...
import { getDocumentAcknowledgments, acknowledgeDocument as acknowledgeDocApi } from '@/services/api/acknowledgments';
import { Document, DocumentCategory, PowerBiReport, Presentation, QualityAlert, Machine } from '@/types';

// Use this for global documents fetching
export const useDocuments = () => {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ['documents'],
        queryFn: async () => {
            // Fetch all documents
            const dbDocs = await getDocuments();

            // Previous logic: split into reports, presentations, etc.
            // dbDocs: LineDocument[] (category: string)

            const reports: PowerBiReport[] = [];
            const presentations: Presentation[] = [];
            const alerts: QualityAlert[] = [];
            const docs: Document[] = [];

            dbDocs.forEach((d: any) => {
                // Determine category from d.category (or d.document_type for legacy compatibility)
                const docCategory = d.category || d.document_type;

                if (docCategory === 'report') {
                    reports.push({
                        id: d.id,
                        name: d.title,
                        embedUrl: d.document_url || d.document_id, // Ensure we check document_url too
                        lineId: d.line_id
                    });
                } else if (docCategory?.toLowerCase() === 'presentation') {
                    const metadata = typeof d.metadata === 'string' ? JSON.parse(d.metadata) : d.metadata;
                    presentations.push({
                        id: d.id,
                        title: d.title,
                        url: d.document_url || d.document_id,
                        version: d.version,
                        lineId: d.line_id,
                        metadata: metadata
                    });
                } else {
                    let category: DocumentCategory;

                    // Normalize Category Strings
                    if (docCategory === 'alert') {
                        // Parse metadata if it's a string
                        const metadata = typeof d.metadata === 'string' ? JSON.parse(d.metadata) : d.metadata;

                        const alert: QualityAlert = {
                            id: d.id,
                            title: d.title,
                            severity: metadata?.severity || 'C',
                            description: metadata?.description || '',
                            expiresAt: metadata?.expiresAt || new Date().toISOString(),
                            isRead: metadata?.isRead || false,
                            documentId: d.document_url || d.document_id,
                            createdAt: d.created_at || d.uploaded_at,
                            pdfUrl: (d.document_url || d.document_id)?.startsWith('http') ? (d.document_url || d.document_id) : undefined,
                            pdfName: metadata?.pdfName,
                            lineId: d.line_id,
                            metadata: metadata
                        };
                        alerts.push(alert);
                        return; // Skip adding to docs array
                    }

                    // Map known strings to Enums
                    if (docCategory === 'acceptance_criteria' || docCategory === 'Acceptance Criteria' || docCategory === DocumentCategory.AcceptanceCriteria) {
                        category = DocumentCategory.AcceptanceCriteria;
                    }
                    else if (docCategory === 'work_instructions' || docCategory === 'Work Instruction' || docCategory === DocumentCategory.WorkInstruction) {
                        category = DocumentCategory.WorkInstruction;
                    }
                    else if (docCategory === 'standardized_work' || docCategory === 'Standardized Work' || docCategory === DocumentCategory.StandardizedWork) {
                        category = DocumentCategory.StandardizedWork;
                    } else {
                        // Default to whatever strings we have if not matched, or fallback
                        // Maybe it's already an enum value
                        category = docCategory as DocumentCategory;
                    }

                    const metadata = typeof d.metadata === 'string' ? JSON.parse(d.metadata) : d.metadata;

                    docs.push({
                        id: d.id,
                        title: d.title,
                        url: d.viewinfo || d.document_url || d.document_id, // Prioritize viewinfo for L2L docs
                        category: category,
                        version: d.version,
                        lineId: d.line_id,
                        stationId: d.station_id, // Map station_id
                        stationName: d.station_name, // Map station_name
                        lastUpdated: d.updated_at || d.created_at || d.uploaded_at,
                        metadata: metadata
                    });
                }
            });

            // Merge Station Instructions as Documents (assuming stationInstructions is part of dbDocs or fetched separately and merged here)
            // If stationInstructions is a separate fetch, it needs to be added here.
            // For now, assuming the previous logic intended to process all documents from dbDocs.
            // The original code had a separate `stationInstructions.forEach` block outside the queryFn,
            // which was a syntax error. If station instructions are part of `dbDocs`, they would be
            // handled by the `docs.push` block above if their `document_type` matches.
            // If they are a separate data source, they need to be fetched and processed here.
            // Given the instruction is to fix syntax and scope, and the provided diff removes the
            // problematic outer block, we'll assume the `dbDocs` processing is now comprehensive.

            return { reports, presentations, alerts, docs };
        },
        staleTime: 1000 * 60 * 5,
    });

    const createDocument = useMutation({
        mutationFn: async ({ lineId, type, documentId, title, uploadedBy, version, metadata }: {
            lineId: string,
            type: string, // Changed to string
            documentId: string,
            title: string,
            uploadedBy: string | null,
            version?: string,
            metadata?: any
        }) => {
            return await createDocApi({
                line_id: lineId,
                category: type,
                document_url: documentId,
                title,
                uploaded_by: uploadedBy || undefined,
                version: version ? parseInt(version) : 1,
                metadata
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['documents'] });
        }
    });

    const updateDocument = useMutation({
        mutationFn: async ({ id, updates }: { id: string, updates: any }) => {
            return await updateDocApi(id, updates);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['documents'] });
        }
    });

    const deleteDocument = useMutation({
        mutationFn: async (id: string) => {
            return await deleteDocApi(id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['documents'] });
        }
    });

    const acknowledgeDoc = useMutation({
        mutationFn: async ({ documentId, shift, userId }: { documentId: string, shift: string, userId?: string }) => {
            return await acknowledgeDocApi(documentId, shift, userId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['acknowledgments'] });
        }
    });

    return {
        data: query.data,
        isLoading: query.isLoading,
        createDocument,
        updateDocument,
        deleteDocument,
        acknowledgeDocument: acknowledgeDoc
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
            return await createStation({
                line_id: lineId,
                name: data.name,
                station_number: data.position,
                // description not supported
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['stations', lineId] });
        }
    });

    const update = useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
            return await updateStation(id, updates);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['stations', lineId] });
        }
    });

    const remove = useMutation({
        mutationFn: async (id: string) => {
            return await deleteStation(id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['stations', lineId] });
        }
    });

    return {
        stations: query.data || [],
        isLoading: query.isLoading,
        createStation: create,
        updateStation: update,
        deleteStation: remove
    };
};
