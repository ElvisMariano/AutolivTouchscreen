/**
 * Hook para gerenciar sincronização com API Leading2Lean (L2L)
 * 
 * @description
 * Fornece estado e funções para executar e monitorar sincronizações
 * com a API L2L. Integrado com React Query para cache e invalidação.
 */

import { useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    syncPlants,
    syncLines,
    syncMachines,
    syncDocuments,
    syncAll,
    getLastSyncLog,
    getSyncHistory,
    type L2LSyncResult as SyncResult,
} from '../src/services/api/l2l';
import { useAuth } from '../contexts/AuthContext';

// ==================== TIPOS ====================

export interface L2LSyncState {
    isSyncing: boolean;
    lastSync: string | null;
    lastResult: SyncResult | null;
    error: string | null;
}

type SyncType = 'plants' | 'lines' | 'machines' | 'documents' | 'all';

// ==================== HOOK PRINCIPAL ====================

export function useL2LSync() {
    const { currentUser } = useAuth();
    const queryClient = useQueryClient();
    const [syncState, setSyncState] = useState<L2LSyncState>({
        isSyncing: false,
        lastSync: null,
        lastResult: null,
        error: null,
    });

    // ========== QUERIES ==========

    // Buscar último log de sincronização
    const { data: lastLog } = useQuery({
        queryKey: ['l2l-sync-last-log'],
        queryFn: () => getLastSyncLog(),
        refetchInterval: 30000, // Atualizar a cada 30 segundos
    });

    // Buscar histórico de sincronizações
    const { data: syncHistory = [] } = useQuery({
        queryKey: ['l2l-sync-history'],
        queryFn: () => getSyncHistory(20),
        refetchInterval: 60000, // Atualizar a cada minuto
    });

    // ========== MUTATIONS ==========

    // Sincronizar Plants
    const syncPlantsMutation = useMutation({
        mutationFn: () => syncPlants(currentUser?.id),
        onSuccess: (result) => {
            handleSyncSuccess(result, 'plants');
        },
        onError: (error) => {
            handleSyncError(error, 'plants');
        },
    });

    // Sincronizar Lines
    const syncLinesMutation = useMutation({
        mutationFn: () => syncLines(currentUser?.id),
        onSuccess: (result) => {
            handleSyncSuccess(result, 'lines');
        },
        onError: (error) => {
            handleSyncError(error, 'lines');
        },
    });

    // Sincronizar Machines
    const syncMachinesMutation = useMutation({
        mutationFn: () => syncMachines(currentUser?.id),
        onSuccess: (result) => {
            handleSyncSuccess(result, 'machines');
        },
        onError: (error) => {
            handleSyncError(error, 'machines');
        },
    });

    // Sincronizar Documents
    const syncDocumentsMutation = useMutation({
        mutationFn: () => syncDocuments(currentUser?.id),
        onSuccess: (result) => {
            handleSyncSuccess(result, 'documents');
        },
        onError: (error) => {
            handleSyncError(error, 'documents');
        },
    });

    // Sincronização completa
    const syncAllMutation = useMutation({
        mutationFn: () => syncAll(currentUser?.id),
        onSuccess: (results) => {
            handleSyncSuccess(results.overall, 'all');
        },
        onError: (error) => {
            handleSyncError(error, 'all');
        },
    });

    // ========== HANDLERS ==========

    const handleSyncSuccess = useCallback(
        (result: SyncResult, type: SyncType) => {
            setSyncState({
                isSyncing: false,
                lastSync: result.timestamp,
                lastResult: result,
                error: null,
            });

            // Invalidar cache do React Query para forçar recarregamento
            invalidateRelatedQueries(type);

            // Recarregar logs
            queryClient.invalidateQueries({ queryKey: ['l2l-sync-last-log'] });
            queryClient.invalidateQueries({ queryKey: ['l2l-sync-history'] });

            console.log(`✅ Sincronização de ${type} concluída:`, result);
        },
        [queryClient]
    );

    const handleSyncError = useCallback((error: unknown, type: SyncType) => {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        setSyncState((prev) => ({
            ...prev,
            isSyncing: false,
            error: `Erro na sincronização de ${type}: ${errorMessage}`,
        }));
        console.error(`❌ Erro na sincronização de ${type}:`, error);
    }, []);

    // Invalidar queries relevantes após sincronização
    const invalidateRelatedQueries = useCallback(
        (type: SyncType) => {
            switch (type) {
                case 'plants':
                    queryClient.invalidateQueries({ queryKey: ['plants'] });
                    break;
                case 'lines':
                    queryClient.invalidateQueries({ queryKey: ['lines'] });
                    queryClient.invalidateQueries({ queryKey: ['production-lines'] });
                    break;
                case 'machines':
                    queryClient.invalidateQueries({ queryKey: ['stations'] });
                    queryClient.invalidateQueries({ queryKey: ['work-stations'] });
                    break;
                case 'documents':
                    queryClient.invalidateQueries({ queryKey: ['documents'] });
                    queryClient.invalidateQueries({ queryKey: ['line-documents'] });
                    break;
                case 'all':
                    queryClient.invalidateQueries(); // Invalidar tudo
                    break;
            }
        },
        [queryClient]
    );

    // ========== FUNÇÕES PÚBLICAS ==========

    const executeSyncPlants = useCallback(() => {
        setSyncState((prev) => ({ ...prev, isSyncing: true, error: null }));
        syncPlantsMutation.mutate();
    }, [syncPlantsMutation]);

    const executeSyncLines = useCallback(() => {
        setSyncState((prev) => ({ ...prev, isSyncing: true, error: null }));
        syncLinesMutation.mutate();
    }, [syncLinesMutation]);

    const executeSyncMachines = useCallback(() => {
        setSyncState((prev) => ({ ...prev, isSyncing: true, error: null }));
        syncMachinesMutation.mutate();
    }, [syncMachinesMutation]);

    const executeSyncDocuments = useCallback(() => {
        setSyncState((prev) => ({ ...prev, isSyncing: true, error: null }));
        syncDocumentsMutation.mutate();
    }, [syncDocumentsMutation]);

    const executeSyncAll = useCallback(() => {
        setSyncState((prev) => ({ ...prev, isSyncing: true, error: null }));
        syncAllMutation.mutate();
    }, [syncAllMutation]);

    const clearError = useCallback(() => {
        setSyncState((prev) => ({ ...prev, error: null }));
    }, []);

    return {
        // Estado
        syncState,
        lastLog,
        syncHistory,

        // Funções de sincronização
        syncPlants: executeSyncPlants,
        syncLines: executeSyncLines,
        syncMachines: executeSyncMachines,
        syncDocuments: executeSyncDocuments,
        syncAll: executeSyncAll,

        // Helpers
        clearError,
        isSyncing:
            syncPlantsMutation.isPending ||
            syncLinesMutation.isPending ||
            syncMachinesMutation.isPending ||
            syncDocumentsMutation.isPending ||
            syncAllMutation.isPending,
    };
}

// ==================== HOOK PARA STATUS SIMPLIFICADO ====================

/**
 * Hook simplificado para apenas verificar status da sincronização
 */
export function useL2LSyncStatus() {
    const { data: lastLog, isLoading } = useQuery({
        queryKey: ['l2l-sync-last-log'],
        queryFn: () => getLastSyncLog(),
        refetchInterval: 30000,
    });

    return {
        lastSync: lastLog?.synced_at || null,
        lastStatus: lastLog?.status || null,
        lastRecords: lastLog
            ? {
                created: lastLog.records_created || 0,
                updated: lastLog.records_updated || 0,
                deactivated: lastLog.records_deactivated || 0,
            }
            : null,
        isLoading,
    };
}
