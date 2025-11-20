
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
}

export interface Document {
    id: string;
    title: string;
    url: string; // URL to the PDF file
    version: number;
    lastUpdated: string;
    category: DocumentCategory;
}

export interface PowerBiReport {
    id: string;
    name: string;
    embedUrl: string;
}

export interface Presentation {
    id: string;
    name: string;
    slides: string[]; // URLs to slide images
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
    pdfUrl?: string; // URL do PDF específico do alerta (opcional)
    pdfName?: string; // Nome do arquivo PDF
}

export interface SystemSettings {
    inactivityTimeout: number; // in seconds
    notificationDuration: number; // in days
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

export type UserRole = 'admin' | 'operator' | 'processo' | 'qualidade' | 'aps';

export interface User {
    id: string;
    name: string;
    role: UserRole;
    pin: string; // 4-digit string
}

export type ChangeEntity = 'document' | 'alert' | 'user' | 'machine' | 'bi' | 'presentation' | 'settings' | 'navigation';

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