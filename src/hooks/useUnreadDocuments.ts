import { useMemo } from 'react';
import { Document, DocumentCategory, QualityAlert } from '@/types';
import { useDocuments } from './useDocuments';
import { useAcknowledgments } from './useAcknowledgments';

export const useUnreadDocuments = (
    selectedLineId: string | null,
    currentShift: string,
    activeShifts: string[] = ['1º Turno', '2º Turno', '3º Turno']
) => {
    // 1. Fetch all docs and alerts
    const { data: unifiedDocs } = useDocuments();
    const docs = unifiedDocs?.docs || [];
    const alerts = unifiedDocs?.alerts || [];

    // 2. Filter for selected line
    const { lineDocs, lineAlerts } = useMemo(() => {
        if (!selectedLineId) return { lineDocs: [], lineAlerts: [] };

        return {
            lineDocs: docs.filter(d =>
                d.lineId === selectedLineId &&
                (d.category === DocumentCategory.WorkInstruction || d.category === DocumentCategory.StandardizedWork)
            ),
            lineAlerts: alerts.filter(a => a.lineId === selectedLineId)
        };
    }, [docs, alerts, selectedLineId]);

    // 3. Get IDs for fetching acknowledgments
    const docIds = useMemo(() => {
        return [...lineDocs.map(d => d.id), ...lineAlerts.map(a => a.id)];
    }, [lineDocs, lineAlerts]);

    // 4. Fetch Acknowledgments for current shift
    // Note: useAcknowledgments takes array of IDs.
    const { data: acks = [] } = useAcknowledgments(docIds, currentShift);

    // 5. Determine Unread Docs / Alerts
    const unreadItems = useMemo(() => {
        // If line not selected or shift not active (setup shift?), maybe no unread logic?
        // DataContext used specific activeShifts check.
        // We'll trust the passed activeShifts.
        // If currentShift is not in activeShifts (e.g. "Administrativo"?), maybe no unread checks.
        // But let's stick to simple logic: if passed shift is valid, check.
        if (activeShifts.length > 0 && !activeShifts.includes(currentShift)) return [];

        const unreadD = lineDocs.filter(doc => {
            const ack = acks.find((a: any) => a.document_id === doc.id);
            if (!ack) return true; // Never acknowledged

            const docTime = new Date(doc.lastUpdated).getTime();
            const ackTime = new Date((ack as any).acknowledged_at).getTime();
            return docTime > ackTime;
        });

        const unreadA = lineAlerts.filter(alert => {
            const ack = acks.find((a: any) => a.document_id === alert.id);
            if (!ack) return true; // Never acknowledged

            const alertTime = new Date(alert.createdAt).getTime();
            const ackTime = new Date((ack as any).acknowledged_at).getTime();
            return alertTime > ackTime;
        }).map(alert => ({
            id: alert.id,
            title: alert.title,
            url: alert.pdfUrl || alert.documentId || '',
            version: 1,
            lastUpdated: alert.createdAt,
            category: DocumentCategory.QualityAlert,
            lineId: alert.lineId,
            stationId: undefined
        } as Document));

        return [...unreadD, ...unreadA];
    }, [lineDocs, lineAlerts, acks, currentShift, activeShifts]);

    return unreadItems;
};
