
export enum Page {
    Dashboard = 'Dashboard',
    WorkInstructions = 'P1 - Instruções de Trabalho',
    AcceptanceCriteria = 'P2 - Critérios de Aceitação',
    StandardizedWork = 'P4 - Trabalho Padronizado',
    QualityAlerts = 'Alertas de Qualidade',
    Admin = 'Administração'
}



export enum AdminSubPage {
    WorkInstructions = 'P1 Instrução de Trabalho',
    AcceptanceCriteria = 'P2 Critérios de Aceitação',
    StandardizedWork = 'P4 Trabalho Padronizado',
    QualityAlerts = 'Alertas da Qualidade',
    PowerBI = 'Power BI\'s (Relatórios)',
    Presentations = 'Apresentações',
    Plants = 'Cadastro de Plantas',
    Users = 'Cadastro de Usuários',
    History = 'Histórico de Ações',
    Settings = 'Configurações',
}

export enum DocumentCategory {
    WorkInstruction = 'Instrução de Trabalho',
    AcceptanceCriteria = 'Critério de Aceitação',
    StandardizedWork = 'Trabalho Padronizado',
    QualityAlert = 'Alerta de Qualidade',
}

export type MachineStatus = 'running' | 'warning' | 'error' | 'offline';

export interface Machine {
    id: string;
    name: string;
    status: MachineStatus;
    instructionId?: string;
    position: { x: number; y: number }; // Percentage-based position
    type?: 'station' | 'machine';
}

export interface ProductionLine {
    id: string;
    name: string;
    machines: Machine[];
    plantId?: string;
    plantName?: string;
}

export interface Document {
    id: string;
    title: string;
    url: string; // URL to the PDF file
    version: number;
    lastUpdated: string;
    category: DocumentCategory;
    lineId?: string;
    stationId?: string;
}

export interface PowerBiReport {
    id: string;
    name: string;
    embedUrl: string;
    lineId?: string;
}

export interface Presentation {
    id: string;
    title: string;
    url: string; // URL to the presentation file (PDF or similar)
    version?: number;
    lineId?: string;
}


export enum AlertSeverity {
    A = 'A',
    B = 'B',
    C = 'C',
}

// Helper para obter a cor associada à severidade  
export const getSeverityColor = (severity: AlertSeverity): string => {
    switch (severity) {
        case AlertSeverity.A: return 'red';
        case AlertSeverity.B: return 'yellow';
        case AlertSeverity.C: return 'gray';
        default: return 'gray';
    }
};

// Helper para obter a classe Tailwind CSS completa para a cor
export const getSeverityColorClass = (severity: AlertSeverity): string => {
    switch (severity) {
        case AlertSeverity.A: return 'bg-red-500';
        case AlertSeverity.B: return 'bg-yellow-500';
        case AlertSeverity.C: return 'bg-gray-500';
        default: return 'bg-gray-500';
    }
};

export interface QualityAlert {
    id: string;
    title: string;
    description: string;
    severity: AlertSeverity;
    documentId: string;
    createdAt: string;
    expiresAt: string;
    isRead: boolean;
    isExpired?: boolean;
    pdfUrl?: string; // URL do PDF específico do alerta (opcional)
    pdfName?: string; // Nome do arquivo PDF
    lineId?: string; // ID da linha de produção associada
}

export interface SystemSettings {
    inactivityTimeout: number; // in seconds
    language: 'pt-BR' | 'en-US' | 'es-ES';
    theme: 'dark' | 'light';
    fontSize: 'small' | 'medium' | 'large';
    autoRefreshInterval: number; // in seconds
    enableSoundNotifications: boolean;
    enableVibration: boolean; // for touchscreen feedback
    showTutorials: boolean;
    compactMode: boolean; // UI density
    kioskMode: boolean; // Prevent exit/gestures
}

export interface Plant {
    id: string;
    name: string;
    location: string;
    status: 'active' | 'inactive';
    created_at: string;
    updated_at: string;
    created_by?: string;
}

export const isAlertActive = (alert: QualityAlert): boolean => {
    const now = Date.now();
    const exp = new Date(alert.expiresAt).getTime();
    const flagExpired = alert.isExpired === true;
    return exp > now && !flagExpired;
};

export type UserRole = 'admin' | 'operator' | 'processo' | 'qualidade' | 'aps';

export interface User {
    id: string;
    name: string;
    role: UserRole;
    username: string;
    password?: string; // Optional for existing users or purely auto-login users (though highly recommended)
    autoLogin?: boolean;
    plant_ids?: string[]; // IDs das plantas que o usuário tem acesso
}

export type ChangeEntity = 'document' | 'alert' | 'user' | 'machine' | 'bi' | 'presentation' | 'settings' | 'navigation' | 'plant';

export interface ChangeLog {
    id: string;
    entity: ChangeEntity;
    action: 'create' | 'update' | 'delete' | 'view';
    targetId: string;
    label: string;
    timestamp: string;
    userId?: string; // ID do usuário que fez a ação
    userName?: string; // Nome do usuário para facilitar exibição
}

declare global {
    interface Window {
        electron?: {
            getOsUsername: () => string | null;
        };
    }
}
