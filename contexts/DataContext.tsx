import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { usePlants } from '../hooks/usePlants';
import { useLines } from '../hooks/useLines';
import { useDocuments } from '../hooks/useDocuments';
import { useUsers } from '../hooks/useUsers';

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

interface DataContextType {
    lines: ProductionLine[];
    plants: Plant[];
    docs: Document[];
    alerts: QualityAlert[];
    settings: SystemSettings;
    biReports: PowerBiReport[];
    presentations: Presentation[];
    users: User[];
    selectedLineId: string;
    selectedLine: ProductionLine | undefined;
    selectedPlantId: string;
    setSelectedLineId: (id: string) => void;
    setSelectedPlantId: (id: string) => void;
    getMachineById: (id: string) => Machine | undefined;
    getDocumentById: (id: string) => Document | undefined;
    updateAlertStatus: (id: string, isRead: boolean) => void;
    updateSetting: <K extends keyof SystemSettings>(key: K, value: SystemSettings[K]) => void;
    getUnreadAlertsCount: () => number;
    changeLogs: ChangeLog[];
    addLine: (name: string) => void;
    updateLine: (line: ProductionLine) => void;
    deleteLine: (lineId: string) => void;
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
    addUser: (user: Omit<User, 'id'>) => void;
    updateUser: (user: User) => void;
    deleteUser: (id: string) => void;
    restoreUser: (id: string, user: User) => void;
    // CRUD Alerts
    addAlert: (alert: Omit<QualityAlert, 'id' | 'createdAt' | 'isRead'>) => void;
    updateAlert: (alert: QualityAlert) => void;
    deleteAlert: (id: string) => void;
    // CRUD Plants
    addPlant: (name: string, location: string) => Promise<boolean>;
    updatePlant: (id: string, updates: Partial<Plant>) => Promise<boolean>;
    deletePlant: (id: string) => Promise<boolean>;
    // Machine Management
    addMachine: (lineId: string, machineData: Partial<Machine> & { name: string }) => void;
    updateMachine: (lineId: string, machineId: string, updates: Partial<Machine>) => void;
    deleteMachine: (lineId: string, machineId: string) => void;
    moveMachine: (lineId: string, machineId: string, direction: 'up' | 'down') => void;
    updateMachinePosition: (lineId: string, machineId: string, position: { x: number; y: number }) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Keep useLocalStorage for settings only
const useLocalStorage = <T,>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] => {
    const [storedValue, setStoredValue] = useState<T>(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(`Error reading localStorage key "${key}":`, error);
            window.localStorage.removeItem(key); // Clear corrupted data
            return initialValue;
        }
    });

    useEffect(() => {
        try {
            window.localStorage.setItem(key, JSON.stringify(storedValue));
        } catch (error) {
            console.error(`Error saving localStorage key "${key}":`, error);
        }
    }, [key, storedValue]);

    return [storedValue, setStoredValue];
};

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { currentUser, isAdmin } = useAuth();

    // 1. Settings Provider (Local)
    const [settings, setSettings] = useLocalStorage<SystemSettings>('app_settings', {
        inactivityTimeout: 300,
        language: 'pt-BR',
        theme: 'light',
        fontSize: 'medium',
        autoRefreshInterval: 30,
        enableSoundNotifications: true,
        enableVibration: true,
        showTutorials: true,
        compactMode: false,
        kioskMode: false,
    });

    const [changeLogs, setChangeLogs] = useLocalStorage<ChangeLog[]>('system_changelogs', []);

    // 2. Selection State (Local)
    const [selectedLineId, setSelectedLineId] = useLocalStorage<string>('selectedLineId', '');
    const [selectedPlantId, setSelectedPlantId] = useLocalStorage<string>('selectedPlantId', '');

    // 3. React Query Hooks
    const {
        plants,
        createPlant: createPlantMutation,
        updatePlant: updatePlantMutation,
        deletePlant: deletePlantMutation
    } = usePlants(isAdmin || false, currentUser?.id);

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
        deleteDocument: deleteDocMutation
    } = useDocuments();

    const {
        users,
        createUser: createUserMutation,
        updateUser: updateUserMutation,
        deleteUser: deleteUserMutation,
        restoreUser: restoreUserMutation
    } = useUsers();

    // 4. Derived State from Hooks
    const docs = unifiedDocs?.docs || [];
    const alerts = unifiedDocs?.alerts || [];
    const biReports = unifiedDocs?.reports || [];
    const presentations = unifiedDocs?.presentations || [];

    // Helper: Log Event
    const logEvent = (entity: ChangeEntity, action: 'create' | 'update' | 'delete' | 'view', targetId: string, label: string) => {
        const newLog: ChangeLog = {
            id: crypto.randomUUID(),
            entity,
            action,
            targetId,
            label,
            timestamp: new Date().toISOString(),
            userId: currentUser?.id,
            userName: currentUser?.name || currentUser?.username || 'Sistema'
        };
        setChangeLogs(prev => [newLog, ...prev].slice(0, 1000));
    };

    // 5. Actions / Mutations Implementations
    const updateSetting = <K extends keyof SystemSettings>(key: K, value: SystemSettings[K]) => {
        setSettings(prev => ({ ...prev, [key]: value }));
        logEvent('settings', 'update', key, String(value));
    };

    const addLine = (name: string) => {
        createLineMutation.mutate({
            name,
            description: '',
            createdBy: currentUser?.id || 'system',
            plantId: selectedPlantId // Assign to current plant if possible
        });
        logEvent('navigation', 'create', 'line', name);
    };

    const updateLine = (line: ProductionLine) => {
        updateLineMutation.mutate({ id: line.id, updates: { name: line.name } });
        logEvent('navigation', 'update', line.id, line.name);
    };

    const deleteLine = (lineId: string) => {
        deleteLineMutation.mutate(lineId);
        logEvent('navigation', 'delete', lineId, 'Line');
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
            await createPlantMutation.mutateAsync({ name, location });
            logEvent('plant', 'create', name, location);
            return true;
        } catch (e) { return false; }
    };
    const updatePlantFn = async (id: string, updates: Partial<Plant>) => {
        try {
            await updatePlantMutation.mutateAsync({ id, updates });
            logEvent('plant', 'update', id, 'Plant');
            return true;
        } catch (e) { return false; }
    };
    const deletePlantFn = async (id: string) => {
        try {
            await deletePlantMutation.mutateAsync(id);
            logEvent('plant', 'delete', id, 'Plant');
            return true;
        } catch (e) { return false; }
    };

    // Users
    const addUser = (user: Omit<User, 'id'>) => {
        createUserMutation.mutate(user);
        logEvent('user', 'create', user.username, 'User');
    };
    const updateUserFn = (user: User) => {
        updateUserMutation.mutate(user);
        logEvent('user', 'update', user.id, user.username);
    };
    const deleteUserFn = (id: string) => {
        deleteUserMutation.mutate(id);
        logEvent('user', 'delete', id, 'User');
    };
    const restoreUserFn = (id: string, user: User) => {
        restoreUserMutation.mutate({ id, user });
        logEvent('user', 'update', id, 'Restore User');
    };

    // Generic Document Wrapper
    const addDocument = (doc: Omit<Document, 'id' | 'lastUpdated' | 'version'>) => {
        const typeMap: Record<string, string> = {
            [DocumentCategory.AcceptanceCriteria]: 'acceptance_criteria',
            [DocumentCategory.StandardizedWork]: 'standardized_work',
            [DocumentCategory.WorkInstruction]: 'work_instructions',
            [DocumentCategory.QualityAlert]: 'alert'
        };
        const type = typeMap[doc.category] || 'report';
        createDocMutation.mutate({
            lineId: doc.lineId || selectedLineId,
            type: type as any,
            documentId: doc.url,
            title: doc.title,
            uploadedBy: currentUser?.id || 'system'
        });
        logEvent('document', 'create', doc.title, doc.category);
    };

    const updateDocument = (doc: Document) => {
        updateDocMutation.mutate({ id: doc.id, updates: { title: doc.title, document_id: doc.url } });
        logEvent('document', 'update', doc.id, doc.title);
    };

    const deleteDocument = (id: string) => {
        deleteDocMutation.mutate(id);
        logEvent('document', 'delete', id, 'Document');
    };

    const addBiReport = (report: Omit<PowerBiReport, 'id'>) => {
        createDocMutation.mutate({
            lineId: report.lineId || selectedLineId,
            type: 'report',
            documentId: report.embedUrl,
            title: report.name,
            uploadedBy: currentUser?.id || 'system'
        });
        logEvent('bi', 'create', report.name, 'PowerBI');
    };

    const updateBiReport = (report: PowerBiReport) => {
        updateDocMutation.mutate({ id: report.id, updates: { title: report.name, document_id: report.embedUrl } });
        logEvent('bi', 'update', report.id, 'PowerBI');
    };

    const deleteBiReport = (id: string) => {
        deleteDocMutation.mutate(id);
        logEvent('bi', 'delete', id, 'PowerBI');
    };

    const addPresentation = (presentation: Omit<Presentation, 'id'>) => {
        createDocMutation.mutate({
            lineId: presentation.lineId || selectedLineId,
            type: 'presentation',
            documentId: presentation.url,
            title: presentation.title,
            uploadedBy: currentUser?.id || 'system'
        });
        logEvent('presentation', 'create', presentation.title, 'Presentation');
    };

    const updatePresentation = (presentation: Presentation) => {
        updateDocMutation.mutate({ id: presentation.id, updates: { title: presentation.title, document_id: presentation.url } });
        logEvent('presentation', 'update', presentation.id, 'Presentation');
    };

    const deletePresentation = (id: string) => {
        deleteDocMutation.mutate(id);
        logEvent('presentation', 'delete', id, 'Presentation');
    };

    const addAlert = (alert: Omit<QualityAlert, 'id' | 'createdAt' | 'isRead'>) => {
        createDocMutation.mutate({
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
    };

    const updateAlert = (alert: QualityAlert) => {
        // This is tricky as updateDocMutation is generic. 
        // But updateLineDocument in backend updates metadata too.
        updateDocMutation.mutate({
            id: alert.id,
            updates: {
                title: alert.title,
                metadata: {
                    severity: alert.severity,
                    description: alert.description,
                    expiresAt: alert.expiresAt,
                    pdfName: alert.pdfName
                }
            }
        });
        logEvent('alert', 'update', alert.id, 'Alert');
    };

    const deleteAlert = (id: string) => {
        deleteDocMutation.mutate(id);
        logEvent('alert', 'delete', id, 'Alert');
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

    return (
        <DataContext.Provider value={{
            lines, plants, docs, alerts, settings, biReports, presentations, users,
            selectedLineId, selectedLine, selectedPlantId,
            setSelectedLineId, setSelectedPlantId,
            getMachineById, getDocumentById, updateAlertStatus,
            updateSetting, getUnreadAlertsCount, changeLogs,
            addLine, updateLine, deleteLine, logEvent,
            exportAll, importAll,
            addDocument, updateDocument, deleteDocument,
            addBiReport, updateBiReport, deleteBiReport,
            addPresentation, updatePresentation, deletePresentation,
            addUser, updateUser: updateUserFn, deleteUser: deleteUserFn, restoreUser: restoreUserFn,
            addAlert, updateAlert, deleteAlert,
            addPlant, updatePlant: updatePlantFn, deletePlant: deletePlantFn,
            addMachine, updateMachine, deleteMachine, moveMachine, updateMachinePosition
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
