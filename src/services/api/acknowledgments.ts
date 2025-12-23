import apiClient, { getData, handleApiError } from '../apiClient';

export interface DocumentAcknowledgment {
    id: string;
    document_id: string;
    user_id: string;
    shift: string;
    created_at: string;
    user_name?: string;
}

export interface CreateAcknowledgmentDTO {
    document_id: string;
    shift: string;
    user_id?: string;
}

/**
 * Get acknowledgments
 */
export async function getDocumentAcknowledgments(documentIds: string[], shift: string): Promise<DocumentAcknowledgment[]> {
    try {
        const response = await apiClient.get('/acknowledgments', {
            params: {
                documentIds: documentIds.join(','),
                shift
            }
        });
        return getData<DocumentAcknowledgment[]>(response);
    } catch (error) {
        return handleApiError(error);
    }
}

/**
 * Acknowledge document
 */
export async function acknowledgeDocument(documentId: string, shift: string, userId?: string): Promise<DocumentAcknowledgment> {
    try {
        const response = await apiClient.post('/acknowledgments', {
            document_id: documentId,
            shift,
            user_id: userId
        });
        return getData<DocumentAcknowledgment>(response);
    } catch (error) {
        return handleApiError(error);
    }
}
