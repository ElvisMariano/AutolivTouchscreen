import { useState, useEffect } from 'react';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export interface ShiftProductionData {
    target: number;
    actuals: number;
    efficiency: number;
    downtimeMinutes: number;
    downtimeFormatted: string;
    scrap: number;
    pitchCount: number;
}

interface UseShiftProductionResult {
    data: ShiftProductionData | null;
    loading: boolean;
    error: string | null;
    lastUpdated: Date | null;
}

/**
 * Hook para buscar dados de produção do turno completo
 * @param lineId - ID interno da linha (não external_id)
 * @param siteId - ID do site L2L
 * @param shiftStart - Data/hora de início do turno (formato: YYYY-MM-DD HH:MM:SS)
 * @param shiftEnd - Data/hora de fim do turno (formato: YYYY-MM-DD HH:MM:SS)
 * @param refreshIntervalSeconds - Intervalo de atualização em segundos (padrão: 60)
 */
export const useShiftProduction = (
    lineId: string | undefined,
    siteId: string,
    shiftStart: string,
    shiftEnd: string,
    refreshIntervalSeconds: number = 60
): UseShiftProductionResult => {
    const [data, setData] = useState<ShiftProductionData | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const fetchShiftProduction = async () => {
        if (!lineId || !siteId || !shiftStart || !shiftEnd) {
            setData(null);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Primeiro, obter o ID interno da linha usando external_id
            // A API L2L usa IDs internos numéricos, não external_id
            const linesUrl = new URL('/api/1.0/lines/', API_BASE_URL);
            linesUrl.searchParams.append('site', siteId);
            linesUrl.searchParams.append('externalid', lineId);

            console.log(`🔄 [useShiftProduction] Buscando ID interno para external_id: ${lineId}`);

            const linesResponse = await fetch(linesUrl.toString());

            if (!linesResponse.ok) {
                throw new Error(`Falha ao buscar ID da linha: ${linesResponse.status}`);
            }

            const linesJson = await linesResponse.json();

            if (!linesJson.success || !linesJson.data || linesJson.data.length === 0) {
                throw new Error(`Linha não encontrada com external_id: ${lineId}`);
            }

            const internalLineId = linesJson.data[0].id; // ID numérico interno

            console.log(`✅ [useShiftProduction] Convertido ${lineId} → ID interno: ${internalLineId}`);

            // Agora buscar os dados do turno com o ID interno
            const targetUrl = new URL('/api/l2l/shift-production', API_BASE_URL);
            targetUrl.searchParams.append('lineId', internalLineId.toString());
            targetUrl.searchParams.append('siteId', siteId);
            targetUrl.searchParams.append('shiftStart', shiftStart);
            targetUrl.searchParams.append('shiftEnd', shiftEnd);

            console.log(`🔄 [useShiftProduction] Buscando dados do turno:`, {
                internalLineId,
                siteId,
                shiftStart,
                shiftEnd
            });

            const response = await fetch(targetUrl.toString());

            if (!response.ok) {
                throw new Error(`HTTP Error ${response.status}`);
            }

            const json = await response.json();

            if (json.success && json.data) {
                setData(json.data);
                setLastUpdated(new Date());
                console.log(`✅ [useShiftProduction] Dados recebidos:`, json.data);
            } else {
                throw new Error(json.error || 'Erro ao buscar dados do turno');
            }
        } catch (err: any) {
            setError(err.message || 'Erro ao buscar dados de produção do turno');
            console.error('❌ [useShiftProduction] Erro:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Reset state quando parâmetros mudarem
        setData(null);
        setLoading(true);

        fetchShiftProduction();

        // Refresh interval em milliseconds
        const intervalMs = refreshIntervalSeconds * 1000;
        const intervalId = setInterval(fetchShiftProduction, intervalMs);

        return () => clearInterval(intervalId);
    }, [lineId, siteId, shiftStart, shiftEnd, refreshIntervalSeconds]);

    return { data, loading, error, lastUpdated };
};
