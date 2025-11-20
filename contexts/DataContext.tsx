import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { saveBackup } from '../services/backup';
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
    ChangeEntity
} from '../types';
import { MOCK_LINES, MOCK_DOCS, MOCK_ALERTS, MOCK_BI_REPORTS, MOCK_PRESENTATIONS, MOCK_USERS } from '../data/mockData';

interface DataContextType {
    lines: ProductionLine[];
    docs: Document[];
    alerts: QualityAlert[];
    settings: SystemSettings;
    biReports: PowerBiReport[];
    presentations: Presentation[];
    users: User[];
    selectedLineId: string;
    selectedLine: ProductionLine | undefined;
    setSelectedLineId: (id: string) => void;
    getMachineById: (id: string) => Machine | undefined;
    getDocumentById: (id: string) => Document | undefined;
    updateAlertStatus: (id: string, isRead: boolean) => void;
    updateSetting: <K extends keyof SystemSettings>(key: K, value: SystemSettings[K]) => void;
    getUnreadAlertsCount: () => number;
    getAdminPins: () => string[];
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
    // CRUD Alerts
    addAlert: (alert: Omit<QualityAlert, 'id' | 'createdAt' | 'isRead'>) => void;
    updateAlert: (alert: QualityAlert) => void;
    deleteAlert: (id: string) => void;
    // Machine Management
    addMachine: (lineId: string, machineData: Partial<Machine> & { name: string }) => void;
    updateMachine: (lineId: string, machineId: string, updates: Partial<Machine>) => void;
    deleteMachine: (lineId: string, machineId: string) => void;
    moveMachine: (lineId: string, machineId: string, direction: 'up' | 'down') => void;
    updateMachinePosition: (lineId: string, machineId: string, position: { x: number; y: number }) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const useLocalStorage = <T,>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] => {
    const [storedValue, setStoredValue] = useState<T>(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
            // FIX: Added curly braces to the catch block to fix syntax error.
        } catch (error) {
            console.error(error);
            return initialValue;
        }
    });

    useEffect(() => {
        try {
            window.localStorage.setItem(key, JSON.stringify(storedValue));
        } catch (error) {
            console.error(error);
        }
    }, [key, storedValue]);

    return [storedValue, setStoredValue];
};

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [lines, setLines] = useLocalStorage<ProductionLine[]>('lines', MOCK_LINES);
    const [docs, setDocs] = useLocalStorage<Document[]>('docs', MOCK_DOCS);
    const [alerts, setAlerts] = useLocalStorage<QualityAlert[]>('alerts', MOCK_ALERTS);
    const [biReports, setBiReports] = useLocalStorage<PowerBiReport[]>('biReports', MOCK_BI_REPORTS);
    const [presentations, setPresentations] = useLocalStorage<Presentation[]>('presentations', MOCK_PRESENTATIONS);
    const [users, setUsers] = useLocalStorage<User[]>('users', MOCK_USERS);
    const [settings, setSettings] = useLocalStorage<SystemSettings>('settings', {
        inactivityTimeout: 300, // 5 minutes
        notificationDuration: 7, // 7 days
        language: 'pt-BR',
        theme: 'dark',
        fontSize: 'medium',
        autoRefreshInterval: 60,
        enableSoundNotifications: false,
        enableVibration: false,
        showTutorials: true,
        compactMode: false,
        kioskMode: false
    });
    const [changeLogs, setChangeLogs] = useLocalStorage<ChangeLog[]>('changeLogs', []);
    const [selectedLineId, setSelectedLineId] = useState<string>('');

    // Set default selected line if available and none selected
    useEffect(() => {
        if (lines.length > 0 && !selectedLineId) {
            setSelectedLineId(lines[0].id);
        }
    }, [lines, selectedLineId]);

    const selectedLine = lines.find(l => l.id === selectedLineId);

    const generateId = () => `id_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

    const getMachineById = (id: string): Machine | undefined => {
        for (const line of lines) {
            const machine = line.machines.find(m => m.id === id);
            if (machine) return machine;
        }
        return undefined;
    };

    const getDocumentById = (id: string): Document | undefined => {
        return docs.find(d => d.id === id);
    };

    const updateAlertStatus = (id: string, isRead: boolean) => {
        setAlerts(prevAlerts => prevAlerts.map(alert =>
            alert.id === id ? { ...alert, isRead } : alert
        ));
        const alert = alerts.find(a => a.id === id);
        if (alert) addLog('alert', 'update', id, `${alert.title} marcado como ${isRead ? 'lido' : 'não lido'}`);
    };

    const updateSetting = <K extends keyof SystemSettings>(key: K, value: SystemSettings[K]) => {
        setSettings(prevSettings => ({
            ...prevSettings,
            [key]: value
        }));
        addLog('settings', 'update', String(key), `Configuração ${String(key)} atualizada`);
        saveBackup('settings', { ...settings, [key]: value }).catch(() => { });
    };

    const getUnreadAlertsCount = () => {
        return alerts.filter(alert => !alert.isRead && new Date(alert.expiresAt) > new Date()).length;
    };

    const getAdminPins = () => {
        return users.filter(u => u.role === 'admin').map(u => u.pin);
    }

    // --- CRUD Implementations ---
    const addDocument = (doc: Omit<Document, 'id' | 'lastUpdated' | 'version'>) => {
        const newDoc: Document = { ...doc, id: generateId(), version: 1, lastUpdated: new Date().toISOString() };
        setDocs(prev => [...prev, newDoc]);
        addLog('document', 'create', newDoc.id, newDoc.title);
    };
    const updateDocument = (updatedDoc: Document) => {
        setDocs(prev => prev.map(d => d.id === updatedDoc.id ? { ...updatedDoc, lastUpdated: new Date().toISOString(), version: d.version + 1 } : d));
        addLog('document', 'update', updatedDoc.id, updatedDoc.title);
    };
    const deleteDocument = (id: string) => {
        const doc = docs.find(d => d.id === id);
        setDocs(prev => prev.filter(d => d.id !== id));
        if (doc) addLog('document', 'delete', id, doc.title);
    };

    const addBiReport = (report: Omit<PowerBiReport, 'id'>) => {
        const newReport = { ...report, id: generateId() };
        setBiReports(prev => [...prev, newReport]);
        addLog('bi', 'create', newReport.id, newReport.name);
    };
    const updateBiReport = (updatedReport: PowerBiReport) => {
        setBiReports(prev => prev.map(r => r.id === updatedReport.id ? updatedReport : r));
        addLog('bi', 'update', updatedReport.id, updatedReport.name);
    };
    const deleteBiReport = (id: string) => {
        const report = biReports.find(r => r.id === id);
        setBiReports(prev => prev.filter(r => r.id !== id));
        if (report) addLog('bi', 'delete', id, report.name);
    };

    const addPresentation = (presentation: Omit<Presentation, 'id'>) => {
        const newPres = { ...presentation, id: generateId() };
        setPresentations(prev => [...prev, newPres]);
        addLog('presentation', 'create', newPres.id, newPres.name);
    };
    const updatePresentation = (updatedPresentation: Presentation) => {
        setPresentations(prev => prev.map(p => p.id === updatedPresentation.id ? updatedPresentation : p));
        addLog('presentation', 'update', updatedPresentation.id, updatedPresentation.name);
    };
    const deletePresentation = (id: string) => {
        const pres = presentations.find(p => p.id === id);
        setPresentations(prev => prev.filter(p => p.id !== id));
        if (pres) addLog('presentation', 'delete', id, pres.name);
    };

    const addUser = (user: Omit<User, 'id'>) => {
        const newUser = { ...user, id: generateId() };
        setUsers(prev => [...prev, newUser]);
        addLog('user', 'create', newUser.id, newUser.name);
    };
    const updateUser = (updatedUser: User) => {
        setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
        addLog('user', 'update', updatedUser.id, updatedUser.name);
    };
    const deleteUser = (id: string) => {
        const user = users.find(u => u.id === id);
        setUsers(prev => prev.filter(u => u.id !== id));
        if (user) addLog('user', 'delete', id, user.name);
    };

    const addAlert = (alert: Omit<QualityAlert, 'id' | 'createdAt' | 'isRead'>) => {
        const newAlert: QualityAlert = {
            ...alert,
            id: generateId(),
            createdAt: new Date().toISOString(),
            isRead: false,
        };
        setAlerts(prev => [...prev, newAlert]);
        addLog('alert', 'create', newAlert.id, newAlert.title);
    };
    const updateAlert = (updatedAlert: QualityAlert) => {
        setAlerts(prev => prev.map(a => a.id === updatedAlert.id ? updatedAlert : a));
        addLog('alert', 'update', updatedAlert.id, updatedAlert.title);
    };
    const deleteAlert = (id: string) => {
        const alert = alerts.find(a => a.id === id);
        setAlerts(prev => prev.filter(a => a.id !== id));
        if (alert) addLog('alert', 'delete', id, alert.title);
    };

    // --- Machine Management ---
    const addMachine = (lineId: string, machineData: Partial<Machine> & { name: string }) => {
        setLines(prevLines => prevLines.map(line => {
            if (line.id === lineId) {
                const newMachine: Machine = {
                    id: generateId(),
                    name: machineData.name,
                    instructionId: machineData.instructionId || '',
                    position: machineData.position || { x: 50, y: 50 },
                    type: machineData.type || 'station',
                    status: 'offline',
                    ...machineData
                };
                return { ...line, machines: [...line.machines, newMachine] };
            }
            return line;
        }));
        addLog('machine', 'create', lineId, machineData.name);
    };

    const moveMachine = (lineId: string, machineId: string, direction: 'up' | 'down') => {
        setLines(prevLines => prevLines.map(line => {
            if (line.id === lineId) {
                const machines = [...line.machines];
                const index = machines.findIndex(m => m.id === machineId);
                if (index === -1) return line;

                if (direction === 'up' && index > 0) {
                    [machines[index - 1], machines[index]] = [machines[index], machines[index - 1]];
                } else if (direction === 'down' && index < machines.length - 1) {
                    [machines[index], machines[index + 1]] = [machines[index + 1], machines[index]];
                }
                return { ...line, machines };
            }
            return line;
        }));
    };

    const updateMachine = (lineId: string, machineId: string, updates: Partial<Machine>) => {
        setLines(prevLines => prevLines.map(line => {
            if (line.id === lineId) {
                const newMachines = line.machines.map(m =>
                    m.id === machineId ? { ...m, ...updates } : m
                );
                return { ...line, machines: newMachines };
            }
            return line;
        }));
        addLog('machine', 'update', machineId, updates.name || machineId);
    };
    const deleteMachine = (lineId: string, machineId: string) => {
        setLines(prevLines => prevLines.map(line => {
            if (line.id === lineId) {
                return { ...line, machines: line.machines.filter(m => m.id !== machineId) };
            }
            return line;
        }));
        addLog('machine', 'delete', machineId, machineId);
    };
    const updateMachinePosition = (lineId: string, machineId: string, position: { x: number; y: number }) => {
        setLines(prevLines => prevLines.map(line => {
            if (line.id === lineId) {
                const newMachines = line.machines.map(m => m.id === machineId ? { ...m, position } : m);
                return { ...line, machines: newMachines };
            }
            return line;
        }));
        addLog('machine', 'update', machineId, `pos(${position.x.toFixed(1)}%,${position.y.toFixed(1)}%)`);
    };

    const { currentUser } = useAuth();

    const addLog = (entity: ChangeEntity, action: 'create' | 'update' | 'delete', targetId: string, label: string) => {
        const log: ChangeLog = {
            id: generateId(),
            entity,
            action,
            targetId,
            label,
            timestamp: new Date().toISOString(),
            userId: currentUser?.id,
            userName: currentUser?.name
        };
        setChangeLogs(prev => [log, ...prev].slice(0, 500));
    };
    const logEvent = (entity: ChangeEntity, action: 'create' | 'update' | 'delete' | 'view', targetId: string, label: string) => {
        const log: ChangeLog = {
            id: generateId(),
            entity,
            action,
            targetId,
            label,
            timestamp: new Date().toISOString(),
            userId: currentUser?.id,
            userName: currentUser?.name
        };
        setChangeLogs(prev => [log, ...prev].slice(0, 500));
    };

    const addLine = (name: string) => {
        const newLine: ProductionLine = { id: generateId(), name, machines: [] };
        setLines(prev => [...prev, newLine]);
        addLog('machine', 'create', newLine.id, name);
    };
    const updateLine = (line: ProductionLine) => {
        setLines(prev => prev.map(l => l.id === line.id ? line : l));
        addLog('machine', 'update', line.id, line.name);
    };
    const deleteLine = (lineId: string) => {
        const line = lines.find(l => l.id === lineId);
        setLines(prev => prev.filter(l => l.id !== lineId));
        if (line) addLog('machine', 'delete', lineId, line.name);
    };

    const value = {
        lines, docs, alerts, settings, biReports, presentations, users,
        selectedLineId, selectedLine, setSelectedLineId,
        getMachineById, getDocumentById, updateAlertStatus, updateSetting,
        getUnreadAlertsCount, getAdminPins,
        changeLogs,
        addLine, updateLine, deleteLine,
        logEvent,
        exportAll: () => ({ lines, docs, alerts, settings, biReports, presentations, users, changeLogs }),
        importAll: (data: any) => {
            if (data.lines) setLines(data.lines);
            if (data.docs) setDocs(data.docs);
            if (data.alerts) setAlerts(data.alerts);
            if (data.settings) setSettings(data.settings);
            if (data.biReports) setBiReports(data.biReports);
            if (data.presentations) setPresentations(data.presentations);
            if (data.users) setUsers(data.users);
            if (data.changeLogs) setChangeLogs(data.changeLogs);
        },
        addDocument, updateDocument, deleteDocument,
        addBiReport, updateBiReport, deleteBiReport,
        addPresentation, updatePresentation, deletePresentation,
        addUser, updateUser, deleteUser,
        addAlert, updateAlert, deleteAlert,
        addMachine, updateMachine, deleteMachine, moveMachine, updateMachinePosition
    };

    return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};