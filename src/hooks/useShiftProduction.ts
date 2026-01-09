import { useState, useEffect } from 'react';
import apiClient from '../services/apiClient';

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
            console.log(`🔄 [useShiftProduction] Buscando ID interno para external_id: ${lineId}`);

            // Busca linhas usando apiClient (já inclui autenticação se necessário, e base URL)
            const linesResponse = await apiClient.get('/1.0/lines/', {
                params: {
                    site: siteId,
                    externalid: lineId
                }
            });

            // Verifica sucesso da resposta (apiClient joga erro se status != 2xx)
            // A API retorna { success: true, data: [...] }
            if (!linesResponse.data?.success || !linesResponse.data?.data || linesResponse.data.data.length === 0) {
                throw new Error(`Linha não encontrada com external_id: ${lineId}`);
            }

            const internalLineId = linesResponse.data.data[0].id;
            console.log(`✅ [useShiftProduction] Convertido ${lineId} → ID interno: ${internalLineId}`);

            // Busca produção
            console.log(`🔄 [useShiftProduction] Buscando dados do turno (ID: ${internalLineId})`);

            const response = await apiClient.get('/l2l/shift-production', {
                params: {
                    lineId: internalLineId,
                    siteId,
                    shiftStart,
                    shiftEnd
                }
            });

            if (response.data?.success && response.data?.data) {
                setData(response.data.data);
                setLastUpdated(new Date());
                console.log(`✅ [useShiftProduction] Dados recebidos:`, response.data.data);
            } else {
                throw new Error(response.data?.error || 'Erro ao buscar dados do turno');
            }

        } catch (err: any) {
            console.error('❌ [useShiftProduction] Erro:', err);
            // apiClient errors are thrown as Error objects with message
            setError(err.message || 'Erro ao buscar dados de produção do turno');
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
