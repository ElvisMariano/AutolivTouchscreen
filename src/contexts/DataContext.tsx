import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useLog } from './LogContext';
// import { useShift } from './ShiftContext';
import { useLine } from './LineContext';
import { usePlants } from '../hooks/usePlants';
import { useLines } from '../hooks/useLines';
// import { useDocuments } from '../hooks/useDocuments';
// import { useUsers } from '../hooks/useUsers';
import { useLocalStorage } from '../hooks/useLocalStorage';

import {
    ProductionLine,
    Machine,
    Document,
    QualityAlert,
    PowerBiReport,
    Presentation,
    User,
    ChangeEntity,
    DocumentCategory,
    Plant
} from '../types';

/**
 * DataContext (Refatorado - Fase 1)
 * 
 * Agora foca em fornecer Actions e Estados Globais que não cabem em contextos ou hooks específicos.
 * O fetching pesado de documentos foi REMOVIDO daqui. Componentes devem usar `useDocuments()` diretamente.
 * 
 * Mantidos para compatibilidade temporária (serão removidos na Fase 2):
 * - CRUD Wrappers (addDocument, addLine, etc.) -> Centralizam change log
 * - `selectedPlantId` (Ainda usado para criar linhas/plantas)
 */
// DataContext (Refactored - Phase 2)
// Focuses on global navigation state (Lines/Plants) and shared Utilities (Log).
// Document/User/Machine CRUD is handled by dedicated hooks in consumers.

interface DataContextType {
    // Selection State
    lines: ProductionLine[];
    plants: Plant[];
    selectedLineId: string;
    selectedLine: ProductionLine | undefined;
    selectedPlantId: string;
    setSelectedLineId: (id: string) => void;
    setSelectedPlantId: (id: string) => void;

    // Shift Proxy (Legacy support, prefer useShift)
    currentShift: string;
    activeShifts: string[];
    setCurrentShift: (shift: string) => void;

    // Global Actions
    logEvent: (entity: ChangeEntity, action: 'create' | 'update' | 'delete' | 'view', targetId: string, label: string) => void;
    exportAll: () => any;
    importAll: (data: any) => void;

    // Navigation Helpers
    autoOpenDocId: string | null;
    setAutoOpenDocId: (id: string | null) => void;

    // Legacy Helpers (Deprecated but kept if used by unrefactored parts)
    getDocumentById: (id: string) => Document | undefined;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { currentUser, isAdmin } = useAuth();
    const { logEvent } = useLog();

    // Shift Fallbacks
    const currentShift = '';
    const activeShifts: string[] = [];
    const setCurrentShift = () => { };

    // Global Selection State
    const [selectedLineId, setSelectedLineId] = useLocalStorage<string>('selectedLineId', '');
    const [selectedPlantId, setSelectedPlantId] = useLocalStorage<string>('selectedPlantId', '');
    const [autoOpenDocId, setAutoOpenDocId] = useState<string | null>(null);

    // Fetch Plants (Global)
    const { plants: apiPlants } = usePlants(isAdmin || false, currentUser?.id);
    const plants = apiPlants as unknown as Plant[];
    const plantIds = plants.map(p => p.id);

    // Fetch Lines (Global, filtered by available plants)
    const { lines: apiLines } = useLines(plantIds);
    const lines = apiLines || [];

    // Auto-select line if invalid or empty
    useEffect(() => {
        if (lines && lines.length > 0) {
            const isValid = lines.some(l => l.id === selectedLineId);
            if (!selectedLineId || !isValid) {
                setSelectedLineId(lines[0].id);
            }
        }
    }, [lines, selectedLineId, setSelectedLineId]);

    // Helpers
    const selectedLine = lines.find(l => l.id === selectedLineId);
    const getDocumentById = (id: string) => undefined; // No longer locally available

    // Utils
    const exportAll = () => ({ lines, plants });
    const importAll = () => { };

    return (
        <DataContext.Provider value={{
            lines, plants,
            selectedLineId, selectedLine, selectedPlantId, setSelectedLineId, setSelectedPlantId,
            currentShift, activeShifts, setCurrentShift,
            logEvent, exportAll, importAll,
            autoOpenDocId, setAutoOpenDocId,
            getDocumentById
        }}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = () => {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};
