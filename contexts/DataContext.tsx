import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { getAllUsers, addUserToDB, updateUserInDB, deleteUserInDB, restoreUserInDB } from '../services/authService';
import { saveBackup } from '../services/backup';
import { getActiveLines, getAllLineDocumentsFromDB, addLineDocument, updateLineDocument, deleteLineDocument, getLinesByPlant } from '../services/lineService';
import { getAllPlants, getActivePlants, createPlant as createPlantService, updatePlant as updatePlantService, deletePlant as deletePlantService, getPlantsByUser } from '../services/plantService';
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
    plants: Plant[]; // Lista de plantas
    docs: Document[];
    alerts: QualityAlert[];
    settings: SystemSettings;
    biReports: PowerBiReport[];
    presentations: Presentation[];
    users: User[];
    selectedLineId: string;
    selectedLine: ProductionLine | undefined;
    selectedPlantId: string; // ID da planta selecionada
    setSelectedLineId: (id: string) => void;
    setSelectedPlantId: (id: string) => void; // Função para mudar planta
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

const useLocalStorage = <T,>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] => {
    const [storedValue, setStoredValue] = useState<T>(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
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
    const { currentUser, isAdmin } = useAuth(); // Need auth to filter plants

    const [lines, setLines] = useLocalStorage<ProductionLine[]>('lines', []);
    const [plants, setPlants] = useState<Plant[]>([]); // State for plants
    const [selectedPlantId, setSelectedPlantId] = useLocalStorage<string>('selectedPlantId', '');

    const [docs, setDocs] = useLocalStorage<Document[]>('docs', []);
    const [alerts, setAlerts] = useLocalStorage<QualityAlert[]>('alerts', []);
    const [biReports, setBiReports] = useLocalStorage<PowerBiReport[]>('biReports', []);
    const [presentations, setPresentations] = useLocalStorage<Presentation[]>('presentations', []);
    const [users, setUsers] = useLocalStorage<User[]>('users', []);
    const [settings, setSettings] = useLocalStorage<SystemSettings>('settings', {
        inactivityTimeout: 300, // 5 minutes
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
    const [selectedLineId, setSelectedLineIdState] = useState<string>('');

    // Wrapper to sync plant ID
    const setSelectedLineId = (id: string) => {
        setSelectedLineIdState(id);
        const line = lines.find(l => l.id === id);
        if (line?.plantId && line.plantId !== selectedPlantId) {
            setSelectedPlantId(line.plantId);
        }
    };

    // Fetch initial data based on auth status
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                // 1. Fetch Plants (filtered by RLS/Permissions)
                let availablePlants: Plant[] = [];
                if (isAdmin) {
                    availablePlants = await getAllPlants(); // Admin sees all
                } else if (currentUser?.id) {
                    availablePlants = await getPlantsByUser(currentUser.id);
                }

                setPlants(availablePlants);

                // Auto-select plant logic
                let currentPlantId = selectedPlantId;
                if (availablePlants.length > 0) {
                    const isValid = availablePlants.find(p => p.id === selectedPlantId);
                    if (!isValid) {
                        currentPlantId = availablePlants[0].id;
                        setSelectedPlantId(currentPlantId);
                    }
                } else {
                    setSelectedPlantId('');
                    currentPlantId = '';
                }

                // 2. Fetch Lines (Fetch lines for ALL authorized plants to populate selector)
                const linesPromises = availablePlants.map(plant => getLinesByPlant(plant.id));
                const [linesArrays, dbDocs, dbUsers] = await Promise.all([
                    Promise.all(linesPromises),
                    getAllLineDocumentsFromDB(),
                    getAllUsers()
                ]);

                // Flatten lines from all plants
                const dbLines = linesArrays.flat();

                if (dbUsers && dbUsers.length > 0) {
                    const mappedUsers: User[] = dbUsers.map(u => {
                        const rawRole = Array.isArray((u as any).role) ? (u as any).role[0]?.name : (u as any).role?.name;
                        const lower = (rawRole || '').toLowerCase();
                        const normalized = lower === 'administrador'
                            ? 'admin'
                            : lower === 'operador'
                                ? 'operator'
                                : lower as any;
                        return {
                            id: u.id,
                            name: (u as any).name || u.username,
                            username: u.username,
                            role: normalized,
                            autoLogin: false,
                            plant_ids: (u as any).plant_ids
                        };
                    });
                    setUsers(mappedUsers);
                }

                if (dbLines.length > 0) {
                    setLines(dbLines);
                    // Update selected line only if invalid
                    setLines(prev => {
                        const found = dbLines.find(l => l.id === selectedLineId);
                        // If current selection is valid, keep it. 
                        // If not, pick first one (and sync plant)
                        if (!found && dbLines.length > 0) {
                            setSelectedLineIdState(dbLines[0].id);
                            if (dbLines[0].plantId) setSelectedPlantId(dbLines[0].plantId);
                        }
                        return dbLines;
                    });

                    // Case where state was empty
                    if (!selectedLineId && dbLines.length > 0) {
                        setSelectedLineIdState(dbLines[0].id);
                        if (dbLines[0].plantId) setSelectedPlantId(dbLines[0].plantId);
                    }
                } else {
                    setLines([]);
                }

                if (dbDocs.length > 0) {
                    const reports: PowerBiReport[] = [];
                    const presentations: Presentation[] = [];
                    const dbAlerts: QualityAlert[] = [];
                    const otherDocs: Document[] = [];

                    dbDocs.forEach((d: any) => {
                        if (d.document_type === 'report') {
                            reports.push({
                                id: d.id,
                                name: d.title,
                                embedUrl: d.document_id,
                                lineId: d.line_id
                            });
                        } else if (d.document_type === 'presentation') {
                            presentations.push({
                                id: d.id,
                                title: d.title,
                                url: d.document_id,
                                version: d.version,
                                lineId: d.line_id
                            });
                        } else {
                            // Standardized Work, Acceptance Criteria, etc.
                            let category = d.document_type as DocumentCategory;

                            if (d.document_type === 'alert') {
                                // Parse Quality Alert keys from metadata
                                const alert: QualityAlert = {
                                    id: d.id,
                                    title: d.title,
                                    severity: d.metadata?.severity || 'C',
                                    description: d.metadata?.description || '',
                                    expiresAt: d.metadata?.expiresAt || new Date().toISOString(),
                                    isRead: d.metadata?.isRead || false,
                                    documentId: d.document_id,
                                    createdAt: d.uploaded_at,

                                    pdfUrl: d.document_id.startsWith('http') ? d.document_id : undefined,
                                    pdfName: d.metadata?.pdfName, // recover filename
                                    lineId: d.line_id
                                };
                                dbAlerts.push(alert);
                            } else {
                                // Map technical DB types to Enum values if needed
                                if (d.document_type === 'acceptance_criteria') category = DocumentCategory.AcceptanceCriteria;
                                else if (d.document_type === 'work_instructions') category = DocumentCategory.WorkInstruction;
                                else if (d.document_type === 'standardized_work') category = DocumentCategory.StandardizedWork;

                                otherDocs.push({
                                    id: d.id,
                                    title: d.title,
                                    url: d.document_id,
                                    category: category,
                                    version: d.version,
                                    lineId: d.line_id,
                                    lastUpdated: d.uploaded_at
                                });
                            }
                        }
                    });

                    setBiReports(reports);
                    setPresentations(presentations);
                    setAlerts(dbAlerts);

                    // Merge otherDocs with existing non-line docs (or just update line docs)
                    setDocs(prev => {
                        const localDocs = prev.filter(p => !p.lineId);
                        return [...localDocs, ...otherDocs];
                    });
                }
            } catch (error) {
                console.error('Error fetching initial data:', error);
            }
        };
        fetchInitialData();
    }, [currentUser, isAdmin]);

    // Helper functions for DataProvider
    const selectedLine = lines.find(l => l.id === selectedLineId);

    const generateId = () => {
        return Math.random().toString(36).substr(2, 9);
    };

    const getMachineById = (id: string) => {
        for (const line of lines) {
            const machine = line.machines.find(m => m.id === id);
            if (machine) return machine;
        }
        return undefined;
    };

    const getDocumentById = (id: string) => {
        return docs.find(d => d.id === id);
    };

    const updateAlertStatus = (id: string, isRead: boolean) => {
        setAlerts(prevAlerts => prevAlerts.map(alert =>
            alert.id === id ? { ...alert, isRead } : alert
        ));
    };

    const updateSetting = <K extends keyof SystemSettings>(key: K, value: SystemSettings[K]) => {
        setSettings(prev => {
            const newSettings = { ...prev, [key]: value };
            // Log setting change
            logEvent('settings', 'update', key, String(value));
            return newSettings;
        });
    };

    const getUnreadAlertsCount = () => {
        return alerts.filter(a => isAlertActive(a) && !a.isRead).length;
    };

    // --- CRUD Implementations ---

    const addDocument = (doc: Omit<Document, 'id' | 'lastUpdated' | 'version'>) => {
        const newDoc: Document = {
            ...doc,
            id: generateId(),
            lastUpdated: new Date().toISOString(),
            version: 1,
        };
        setDocs(prev => [...prev, newDoc]);
        addLog('document', 'create', newDoc.id, newDoc.title);
    };

    const updateDocument = (updatedDoc: Document) => {
        setDocs(prev => prev.map(doc => doc.id === updatedDoc.id ? updatedDoc : doc));
        addLog('document', 'update', updatedDoc.id, updatedDoc.title);
    };

    const deleteDocument = (id: string) => {
        const doc = docs.find(d => d.id === id);
        setDocs(prev => prev.filter(d => d.id !== id));
        if (doc) addLog('document', 'delete', id, doc.title);
    };

    const addBiReport = (report: Omit<PowerBiReport, 'id'>) => {
        const newReport: PowerBiReport = { ...report, id: generateId() };
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
        const newPresentation: Presentation = { ...presentation, id: generateId() };
        setPresentations(prev => [...prev, newPresentation]);
        addLog('presentation', 'create', newPresentation.id, newPresentation.title);
    };

    const updatePresentation = (updatedPresentation: Presentation) => {
        setPresentations(prev => prev.map(p => p.id === updatedPresentation.id ? updatedPresentation : p));
        addLog('presentation', 'update', updatedPresentation.id, updatedPresentation.title);
    };

    const deletePresentation = (id: string) => {
        const presentation = presentations.find(p => p.id === id);
        setPresentations(prev => prev.filter(p => p.id !== id));
        if (presentation) addLog('presentation', 'delete', id, presentation.title);
    };

    const addUser = async (user: Omit<User, 'id'>) => {
        const result = await addUserToDB(user as any);
        if (result.success) {
            const dbUsers = await getAllUsers();
            if (dbUsers && dbUsers.length > 0) {
                const mappedUsers: User[] = dbUsers.map(u => {
                    const rawRole = Array.isArray((u as any).role) ? (u as any).role[0]?.name : (u as any).role?.name;
                    const lower = (rawRole || '').toLowerCase();
                    const normalized = lower === 'administrador'
                        ? 'admin'
                        : lower === 'operador'
                            ? 'operator'
                            : lower as any;
                    return {
                        id: u.id,
                        name: (u as any).name || u.username,
                        username: u.username,
                        role: normalized,
                        autoLogin: false,
                        plant_ids: (u as any).plant_ids
                    };
                });
                setUsers(mappedUsers);
            }
            addLog('user', 'create', result.data?.id || user.username, user.username);
        }
    };

    const updateUser = (updatedUser: User) => {
        setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
        updateUserInDB(updatedUser);
        addLog('user', 'update', updatedUser.id, updatedUser.username);
    };

    const deleteUser = (id: string) => {
        const user = users.find(u => u.id === id);
        setUsers(prev => prev.filter(u => u.id !== id));
        deleteUserInDB(id); // Sync DB
        if (user) addLog('user', 'delete', id, user.username);
    };

    const restoreUser = (id: string, user: User) => {
        // Implement restore logic
    };

    const addAlert = (alert: Omit<QualityAlert, 'id' | 'createdAt' | 'isRead'>) => {
        const newAlert: QualityAlert = {
            ...alert,
            id: generateId(),
            createdAt: new Date().toISOString(),
            isRead: false,
        };
        setAlerts(prev => [newAlert, ...prev]);
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

    // --- Plant Management ---
    const addPlant = async (name: string, location: string) => {
        const result = await createPlantService(name, location, currentUser?.id);
        if (result.success && result.data) {
            setPlants(prev => [...prev, result.data!]);
            addLog('plant', 'create', result.data.id, name);
            return true;
        }
        return false;
    };

    const updatePlant = async (id: string, updates: Partial<Plant>) => {
        const result = await updatePlantService(id, updates);
        if (result.success) {
            setPlants(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
            addLog('plant', 'update', id, updates.name || '');
            return true;
        }
        return false;
    };

    const deletePlant = async (id: string) => {
        const result = await deletePlantService(id);
        if (result.success) {
            setPlants(prev => prev.filter(p => p.id !== id));
            // If deleted plant was selected, select another
            if (selectedPlantId === id) {
                const remaining = plants.filter(p => p.id !== result.data);
                setSelectedPlantId(remaining.length > 0 ? remaining[0].id : '');
            }
            addLog('plant', 'delete', id, 'Planta Inativada');
            return true;
        }
        return false;
    };


    // --- Machine Management ---
    const addMachine = (lineId: string, machineData: Partial<Machine> & { name: string }) => {
        const newMachine: Machine = {
            id: generateId(),
            name: machineData.name,
            status: 'running',
            position: { x: 50, y: 50 },
            type: 'station',
            ...machineData
        };

        setLines(prevLines => prevLines.map(line => {
            if (line.id === lineId) {
                return { ...line, machines: [...line.machines, newMachine] };
            }
            return line;
        }));
        addLog('machine', 'create', newMachine.id, newMachine.name);
    };
    const updateMachine = (lineId: string, machineId: string, updates: Partial<Machine>) => {
        setLines(prevLines => prevLines.map(line => {
            if (line.id === lineId) {
                const newMachines = line.machines.map(m => m.id === machineId ? { ...m, ...updates } : m);
                return { ...line, machines: newMachines };
            }
            return line;
        }));
        addLog('machine', 'update', machineId, updates.name || '');
    };
    const deleteMachine = (lineId: string, machineId: string) => {
        let machine: Machine | undefined;
        setLines(prevLines => prevLines.map(curLine => {
            if (curLine.id === lineId) {
                machine = curLine.machines.find(m => m.id === machineId);
                return {
                    ...curLine,
                    machines: curLine.machines.filter(m => m.id !== machineId)
                };
            }
            return curLine;
        }));
        addLog('machine', 'delete', machineId, machine?.name || machineId);
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
    const updateMachinePosition = (lineId: string, machineId: string, position: { x: number; y: number }) => {
        setLines(prevLines => prevLines.map(line => {
            if (line.id === lineId) {
                const newMachines = line.machines.map(m => m.id === machineId ? { ...m, position } : m);
                return { ...line, machines: newMachines };
            }
            return line;
        }));
        addLog('machine', 'update', machineId, `pos(${position.x.toFixed(1)} %, ${position.y.toFixed(1)} %)`);
    };

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

    function isAlertActive(alert: QualityAlert): boolean {
        return new Date(alert.expiresAt) > new Date();
    }

    const value = {
        lines, plants, docs, alerts, settings, biReports, presentations, users,
        selectedLineId, selectedLine, selectedPlantId,
        setSelectedLineId, // Uses the wrapper defined above
        setSelectedPlantId,
        getMachineById, getDocumentById, updateAlertStatus, updateSetting,
        getUnreadAlertsCount,
        changeLogs,
        addLine, updateLine, deleteLine,
        logEvent,
        exportAll: () => ({ lines, plants, docs, alerts, settings, biReports, presentations, users, changeLogs }),
        importAll: (data: any) => {
            if (data.lines) setLines(data.lines);
            if (data.plants) setPlants(data.plants);
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
        addUser, updateUser, deleteUser, restoreUser,
        addAlert, updateAlert, deleteAlert,
        addPlant, updatePlant, deletePlant,
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
