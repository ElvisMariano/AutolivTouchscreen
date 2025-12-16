import { useQuery } from '@tanstack/react-query';
import { getDocumentAcknowledgments } from '../services/lineService';

export const useAcknowledgments = (documentIds: string[], shift: string) => {
    return useQuery({
        queryKey: ['acknowledgments', shift, documentIds.join(',')], // Key depends on IDs
        queryFn: () => getDocumentAcknowledgments(documentIds, shift),
        enabled: documentIds.length > 0 && !!shift,
        staleTime: 1000 * 60 * 1, // 1 minute
    });
};
