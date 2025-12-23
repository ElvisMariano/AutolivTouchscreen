import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { useSettings } from './SettingsContext';
import { useAuth } from './AuthContext';
import { useLog } from './LogContext';
import { useShiftLogic } from '../hooks/useShiftLogic';
import { usePlants } from '../hooks/usePlants';
import { useLines } from '../hooks/useLines';
import { useDocuments } from '../hooks/useDocuments';
import { useUsers } from '../hooks/useUsers';
import { useAcknowledgments } from '../hooks/useAcknowledgments';
import { useUnreadDocuments } from '../hooks/useUnreadDocuments';
import { useLocalStorage } from '../hooks/useLocalStorage';

import {
    ProductionLine,
    Machine,
    Document,
    QualityAlert,
    SystemSettings,
    PowerBiReport,
    Presentation,
    User,
    ChangeLog,
    ChangeEntity,
    DocumentCategory,
    Plant
} from '../types';

/**
 * DataContext - Gerenciamento de Dados da Aplicação
 * 
 * @description
 * Contexto responsável por gerenciar todos os dados da aplicação incluindo:
 * - Linhas de produção, plantas, documentos, alertas
 * - Dados de usuários, relatórios BI, apresentações
 * - Cálculo de documentos não lidos (unreadDocuments)
 * 
 * @important
 * COMPORTAMENTO AUTO-SELECT: Este contexto SEMPRE auto-seleciona a primeira linha
 * disponível quando nenhuma está selecionada. Isso garante que dados sempre
 * estejam disponíveis para operações de negócio.
 * 
 * @usage
 * Use este contexto para:
 * - Acessar dados de documentos, alertas, relatórios
 * - Operações CRUD em entidades
 * - Lógica de negócio que requer dados
 * 
 * NÃO use para:
 * - Verificar se usuário selecionou uma linha na UI (use LineContext)
 * - Renderização condicional baseada em seleção de usuário (use LineContext)
 * 
 * @see LineContext Para gerenciamento de seleção de linha na UI
 */


interface DataContextType {
    lines: ProductionLine[];
    plants: Plant[];
    docs: Document[];
    alerts: QualityAlert[];
    // settings: SystemSettings; // Removed - moved to SettingsContext
    biReports: PowerBiReport[];
    presentations: Presentation[];
    users: User[];
    selectedLineId: string;
    selectedLine: ProductionLine | undefined;
    selectedPlantId: string;
    currentShift: string;
    activeShifts: string[];
    unreadDocuments: Document[];
    setCurrentShift: (shift: string) => void;
    acknowledgeDocument: (docId: string) => void;
    setSelectedLineId: (id: string) => void;
    setSelectedPlantId: (id: string) => void;
    getMachineById: (id: string) => Machine | undefined;
    getDocumentById: (id: string) => Document | undefined;
    updateAlertStatus: (id: string, isRead: boolean) => void;
    // updateSetting removed
    getUnreadAlertsCount: () => number;
    // changeLogs removed - use useLog() directly
    addLine: (name: string) => Promise<boolean>;
    updateLine: (line: ProductionLine) => Promise<boolean>;
    deleteLine: (lineId: string) => Promise<boolean>;
    logEvent: (entity: ChangeEntity, action: 'create' | 'update' | 'delete' | 'view', targetId: string, label: string) => void;
    exportAll: () => any;
    importAll: (data: any) => void;
    // CRUD Docs
    addDocument: (doc: Omit<Document, 'id' | 'lastUpdated' | 'version'>) => void;
    updateDocument: (doc: Document) => void;
    deleteDocument: (id: string) => void;
    // CRUD BI
    addBiReport: (report: Omit<PowerBiReport, 'id'>) => void;
    updateBiReport: (report: PowerBiReport) => void;
    deleteBiReport: (id: string) => void;
    // CRUD Presentations
    addPresentation: (presentation: Omit<Presentation, 'id'>) => void;
    updatePresentation: (presentation: Presentation) => void;
    deletePresentation: (id: string) => void;
    // CRUD Users
    addUser: (user: Omit<User, 'id'>) => Promise<User | null>;
    updateUser: (user: User) => void;
    deleteUser: (id: string) => void;
    restoreUser: (id: string, user: User) => void;
    // CRUD Alerts
    addAlert: (alert: Omit<QualityAlert, 'id' | 'createdAt' | 'isRead'>) => void;
    updateAlert: (alert: QualityAlert) => void;

    // IMPOSSIBLE TO DO BOTH IN ONE CHUNK AS THEY ARE FAR APART.
    // I will fix typo first and then logic.
    deleteAlert: (id: string) => void;
    // CRUD Plants
    addPlant: (name: string, location: string) => Promise<{ success: boolean; data?: Plant; error?: string }>;
    updatePlant: (id: string, updates: Partial<Plant>) => Promise<{ success: boolean; error?: any }>;
    deletePlant: (id: string) => Promise<boolean>;
    // Machine Management
    addMachine: (lineId: string, machineData: Partial<Machine> & { name: string }) => void;
    updateMachine: (lineId: string, machineId: string, updates: Partial<Machine>) => void;
    deleteMachine: (lineId: string, machineId: string) => void;
    moveMachine: (lineId: string, machineId: string, direction: 'up' | 'down') => void;
    updateMachinePosition: (lineId: string, machineId: string, position: { x: number; y: number }) => void;
    autoOpenDocId: string | null;
    setAutoOpenDocId: (id: string | null) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);



export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { currentUser, isAdmin } = useAuth();
    const { settings } = useSettings();
    const { logEvent, changeLogs } = useLog();

    // 1. Settings Provider (Local) - REMOVED -> Moved to SettingsContext
    // const [changeLogs, setChangeLogs] = useLocalStorage<ChangeLog[]>('system_changelogs', []); REMOVED -> Moved to LogContext

    // 2. Selection State (Local)
    const [selectedLineId, setSelectedLineId] = useLocalStorage<string>('selectedLineId', '');
    const [selectedPlantId, setSelectedPlantId] = useLocalStorage<string>('selectedPlantId', '');

    // Shift State (Auto-detected) - Moved to useShiftLogic
    // const [currentShift, setCurrentShiftState] = useState<string>('1º Turno');

    // Navigation/Deep Link State
    const [autoOpenDocId, setAutoOpenDocId] = useState<string | null>(null);
    // We will update this via useEffect relying on configuration

    // 3. React Query Hooks
    const {
        plants: apiPlants,
        createPlant: createPlantMutation,
        updatePlant: updatePlantMutation,
        deletePlant: deletePlantMutation
    } = usePlants(isAdmin || false, currentUser?.id);

    // Cast API plants to Legacy plants
    const plants = apiPlants as unknown as Plant[];

    // Derived Plant IDs for Lines fetching
    const plantIds = useMemo(() => plants.map(p => p.id), [plants]);

    const {
        lines,
        createLine: createLineMutation,
        updateLine: updateLineMutation,
        deleteLine: deleteLineMutation
    } = useLines(plantIds);

    // Auto-select first line if none selected
    useEffect(() => {
        if (lines && lines.length > 0) {
            const isValid = lines.some(l => l.id === selectedLineId);
            if (!selectedLineId || !isValid) {
                console.log('Auto-selecting first line:', lines[0].name);
                setSelectedLineId(lines[0].id);
            }
        }
    }, [lines, selectedLineId, setSelectedLineId]);

    const {
        data: unifiedDocs,
        createDocument: createDocMutation,
        updateDocument: updateDocMutation,
        deleteDocument: deleteDocMutation,
        acknowledgeDocument: acknowledgeDocMutation
    } = useDocuments();

    const {
        users: apiUsers,
        createUser: createUserMutation,
        updateUser: updateUserMutation,
        deleteUser: deleteUserMutation,
        restoreUser: restoreUserMutation
    } = useUsers();

    // Cast API users to Legacy users for context compatibility
    const users = apiUsers as unknown as User[];

    // 4. Derived State from Hooks
    const docs = unifiedDocs?.docs || [];
    const alerts = unifiedDocs?.alerts || [];
    const biReports = unifiedDocs?.reports || [];
    const presentations = unifiedDocs?.presentations || [];

    // Helper: Log Event - REMOVED -> Moved to LogContext

    // 5. Actions / Mutations Implementations
    // updateSetting removed - moved to SettingsContext

    const addLine = async (name: string) => {
        try {
            await createLineMutation.mutateAsync({
                name,
                description: '',
                createdBy: currentUser?.id || 'system',
                plantId: selectedPlantId // Assign to current plant if possible
            });
            logEvent('navigation', 'create', 'line', name);
            return true;
        } catch (e) {
            console.error('Add line error:', e);
            return false;
        }
    };

    const updateLine = async (line: ProductionLine) => {
        try {
            await updateLineMutation.mutateAsync({ id: line.id, updates: { name: line.name } });
            logEvent('navigation', 'update', line.id, line.name);
            return true;
        } catch (e) {
            console.error('Update line error:', e);
            return false;
        }
    };

    const deleteLine = async (lineId: string) => {
        try {
            await deleteLineMutation.mutateAsync(lineId);
            logEvent('navigation', 'delete', lineId, 'Line');
            return true;
        } catch (e) {
            console.error('Delete line error:', e);
            return false;
        }
    };

    const addMachine = (lineId: string, machineData: Partial<Machine> & { name: string }) => {
        console.warn("addMachine: Machine management should be migrated to specialized hook. Wrapper pending.");
    };

    // Stubs for Machine ops as they require specific Station hook integration per line which is elusive in global context
    const updateMachine = () => { };
    const deleteMachine = () => { };
    const moveMachine = () => { };
    const updateMachinePosition = () => { };

    // Plants
    const addPlant = async (name: string, location: string) => {
        try {
            const result = await createPlantMutation.mutateAsync({ name, location });
            logEvent('plant', 'create', name, location);
            return { success: true, data: result as unknown as Plant };
        } catch (e: any) {
            return { success: false, error: e.message || 'Unknown error' };
        }
    };
    const updatePlantFn = async (id: string, updates: Partial<Plant>) => {
        try {
            await updatePlantMutation.mutateAsync({ id, updates });
            logEvent('plant', 'update', id, 'Plant');
            return { success: true };
        } catch (e: any) {
            console.error('Update plant error:', e);
            return { success: false, error: e.message || e };
        }
    };
    const deletePlantFn = async (id: string) => {
        try {
            await deletePlantMutation.mutateAsync(id);
            logEvent('plant', 'delete', id, 'Plant');
            return true;
        } catch (e) { return false; }
    };

    // Users
    const addUser = async (user: Omit<User, 'id'>) => {
        try {
            const newUser = await createUserMutation.mutateAsync(user);
            logEvent('user', 'create', user.username, 'User');
            return newUser;
        } catch (e) {
            console.error('Add user error:', e);
            return null;
        }
    };
    const updateUserFn = async (user: User) => {
        try {
            await updateUserMutation.mutateAsync(user);
            logEvent('user', 'update', user.id, user.username);
            return true;
        } catch (e) {
            console.error('Update user error:', e);
            return false;
        }
    };
    const deleteUserFn = async (id: string) => {
        try {
            await deleteUserMutation.mutateAsync(id);
            logEvent('user', 'delete', id, 'User');
            return true;
        } catch (e) {
            console.error('Delete user error:', e);
            return false;
        }
    };
    const restoreUserFn = async (id: string, user: User) => {
        try {
            await restoreUserMutation.mutateAsync({ id, user });
            logEvent('user', 'update', id, 'Restore User');
            return true;
        } catch (e) {
            console.error('Restore user error:', e);
            return false;
        }
    };

    // Generic Document Wrapper
    const addDocument = async (doc: Omit<Document, 'id' | 'lastUpdated' | 'version'>) => {
        try {
            const typeMap: Record<string, string> = {
                [DocumentCategory.AcceptanceCriteria]: 'acceptance_criteria',
                [DocumentCategory.StandardizedWork]: 'standardized_work',
                [DocumentCategory.WorkInstruction]: 'work_instructions',
                [DocumentCategory.QualityAlert]: 'alert'
            };
            const type = typeMap[doc.category] || 'report';
            await createDocMutation.mutateAsync({
                lineId: doc.lineId || selectedLineId,
                type: type as any,
                documentId: doc.url,
                title: doc.title,
                uploadedBy: currentUser?.id || 'system'
            });
            logEvent('document', 'create', doc.title, doc.category);
            return true;
        } catch (e) {
            console.error('Add document error:', e);
            return false;
        }
    };

    const updateDocument = async (doc: Document) => {
        try {
            await updateDocMutation.mutateAsync({ id: doc.id, updates: { title: doc.title, document_id: doc.url } });
            logEvent('document', 'update', doc.id, doc.title);
            return true;
        } catch (e) {
            console.error('Update document error:', e);
            return false;
        }
    };

    const deleteDocument = async (id: string) => {
        try {
            await deleteDocMutation.mutateAsync(id);
            logEvent('document', 'delete', id, 'Document');
            return true;
        } catch (e) {
            console.error('Delete document error:', e);
            return false;
        }
    };

    const addBiReport = async (report: Omit<PowerBiReport, 'id'>) => {
        try {
            await createDocMutation.mutateAsync({
                lineId: report.lineId || selectedLineId,
                type: 'report',
                documentId: report.embedUrl,
                title: report.name,
                uploadedBy: currentUser?.id || 'system'
            });
            logEvent('bi', 'create', report.name, 'PowerBI');
            return true;
        } catch (e) {
            console.error('Add BI report error:', e);
            return false;
        }
    };

    const updateBiReport = async (report: PowerBiReport) => {
        try {
            await updateDocMutation.mutateAsync({ id: report.id, updates: { title: report.name, document_id: report.embedUrl } });
            logEvent('bi', 'update', report.id, 'PowerBI');
            return true;
        } catch (e) {
            console.error('Update BI report error:', e);
            return false;
        }
    };

    const deleteBiReport = async (id: string) => {
        try {
            await deleteDocMutation.mutateAsync(id);
            logEvent('bi', 'delete', id, 'PowerBI');
            return true;
        } catch (e) {
            console.error('Delete BI report error:', e);
            return false;
        }
    };

    const addPresentation = async (presentation: Omit<Presentation, 'id'>) => {
        try {
            await createDocMutation.mutateAsync({
                lineId: presentation.lineId || selectedLineId,
                type: 'presentation',
                documentId: presentation.url,
                title: presentation.title,
                uploadedBy: currentUser?.id || 'system'
            });
            logEvent('presentation', 'create', presentation.title, 'Presentation');
            return true;
        } catch (e) {
            console.error('Add presentation error:', e);
            return false;
        }
    };

    const updatePresentation = async (presentation: Presentation) => {
        try {
            await updateDocMutation.mutateAsync({ id: presentation.id, updates: { title: presentation.title, document_id: presentation.url } });
            logEvent('presentation', 'update', presentation.id, 'Presentation');
            return true;
        } catch (e) {
            console.error('Update presentation error:', e);
            return false;
        }
    };

    const deletePresentation = async (id: string) => {
        try {
            await deleteDocMutation.mutateAsync(id);
            logEvent('presentation', 'delete', id, 'Presentation');
            return true;
        } catch (e) {
            console.error('Delete presentation error:', e);
            return false;
        }
    };

    const addAlert = async (alert: Omit<QualityAlert, 'id' | 'createdAt' | 'isRead'>) => {
        try {
            await createDocMutation.mutateAsync({
                lineId: alert.lineId || selectedLineId,
                type: 'alert',
                documentId: alert.pdfUrl || alert.documentId || 'alert',
                title: alert.title,
                uploadedBy: currentUser?.id || 'system',
                metadata: {
                    severity: alert.severity,
                    description: alert.description,
                    expiresAt: alert.expiresAt,
                    pdfName: alert.pdfName
                }
            });
            logEvent('alert', 'create', alert.title, 'Alert');
            return true;
        } catch (e) {
            console.error('Add alert error:', e);
            return false;
        }
    };

    const updateAlert = async (alert: QualityAlert) => {
        try {
            // This is tricky as updateDocMutation is generic. 
            // But updateLineDocument in backend updates metadata too.
            // Don't send document_url if it's from metadata (pdfUrl in alert)
            const updates: any = {
                title: alert.title,
                metadata: {
                    severity: alert.severity,
                    description: alert.description,
                    expiresAt: alert.expiresAt,
                    pdfName: alert.pdfName
                }
            };

            // Only include document_url if pdfUrl exists
            if (alert.pdfUrl) {
                updates.document_url = alert.pdfUrl;
            }

            await updateDocMutation.mutateAsync({
                id: alert.id,
                updates
            });
            logEvent('alert', 'update', alert.id, 'Alert');
            return true;
        } catch (e) {
            console.error('Update alert error:', e);
            return false;
        }
    };

    const deleteAlert = async (id: string) => {
        try {
            await deleteDocMutation.mutateAsync(id);
            logEvent('alert', 'delete', id, 'Alert');
            return true;
        } catch (e) {
            console.error('Delete alert error:', e);
            return false;
        }
    };

    const updateAlertStatus = (id: string, isRead: boolean) => {
        // Assuming this updates metadata locally or backend
        const alert = alerts.find(a => a.id === id);
        if (alert) {
            updateDocMutation.mutate({
                id,
                updates: {
                    metadata: { ...alert, isRead: isRead } // Check if this overwrites other metadata?
                    // lineService.updateLineDocument merges updates? No, it sets.
                    // We must pass full metadata if we want to preserve it.
                    // But we don't have full metadata structure here easily unless we fetch it or store it.
                    // For now, assuming backend merges or we provide what we have.
                    // Actually lineService implementation: ...updates (top level). NO deep merge of metadata.
                    // So we need to be careful.
                }
            });
        }
    };

    // Selectors
    const selectedLine = lines.find(l => l.id === selectedLineId);

    const getMachineById = (id: string) => {
        for (const line of lines) {
            const found = line.machines?.find(m => m.id === id);
            if (found) return found;
        }
        return undefined;
    };

    const getDocumentById = (id: string) => docs.find(d => d.id === id);
    const getUnreadAlertsCount = () => alerts.filter(a => !a.isRead).length;

    const exportAll = () => ({ lines, plants, docs, settings });
    const importAll = () => { };

    // Auto-detect Shift Logic
    const selectedPlant = plants.find(p => p.id === selectedPlantId);

    const { currentShift, setCurrentShift: setCurrentShiftState, activeShifts } = useShiftLogic(selectedPlant);

    // Backward compatibility / Helper
    const setCurrentShift = (shift: string) => {
        console.warn('Manual shift setting is deprecated. System is auto-detecting shifts.');
        setCurrentShiftState(shift);
    };

    // Unread Logic (Migrated to useUnreadDocuments hook)
    const unreadDocuments = useUnreadDocuments(selectedLineId || null, currentShift, activeShifts);

    return (
        <DataContext.Provider value={{
            lines, plants, docs, alerts, biReports, presentations, users,
            selectedLineId, selectedLine, selectedPlantId,
            setSelectedLineId, setSelectedPlantId,
            getMachineById, getDocumentById, updateAlertStatus,
            getUnreadAlertsCount,
            addLine, updateLine, deleteLine, logEvent,
            exportAll, importAll,
            addDocument, updateDocument, deleteDocument,
            addBiReport, updateBiReport, deleteBiReport,
            addPresentation, updatePresentation, deletePresentation,
            addUser, updateUser: updateUserFn, deleteUser: deleteUserFn, restoreUser: restoreUserFn,
            addAlert, updateAlert, deleteAlert,
            addPlant, updatePlant: updatePlantFn, deletePlant: deletePlantFn,
            addMachine, updateMachine, deleteMachine, moveMachine, updateMachinePosition,
            currentShift, setCurrentShift, unreadDocuments,
            acknowledgeDocument: (id) => acknowledgeDocMutation.mutate({ documentId: id, shift: currentShift, userId: currentUser?.id }),
            activeShifts,
            autoOpenDocId,
            setAutoOpenDocId
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
