
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
    ProductionLines = 'Linhas de Produção',
    Users = 'Cadastro de Usuários',
    Roles = 'Gerenciamento de Roles',
    History = 'Histórico de Ações',
    Settings = 'Configurações',
    L2LSync = 'Sincronização L2L',
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
    description?: string;
}

export interface ProductionLine {
    id: string;
    name: string;
    machines: Machine[];
    plantId?: string;
    plant_id?: string; // Backend/DB field style
    plantName?: string;
    external_id?: string;
    description?: string;
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
    stationName?: string;
    viewinfo?: string; // Data URL do PDF fornecido pelo PLM através da API L2L
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
    slides?: string[];
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
    gestureNavigation: boolean; // Enable gesture navigation
    gestureSensitivity: number; // Swipe threshold in pixels
    shiftCheckInterval: number; // in seconds
    productionRefreshInterval: number; // in seconds
    standbyEnabled: boolean; // Enable standby screen
    standbyTimeout: number; // Standby activation time in seconds
}

export interface ShiftConfig {
    name: string;
    startTime: string; // HH:mm
    endTime: string; // HH:mm
    isActive: boolean;
}

export interface Plant {
    id: string;
    name: string;
    location: string;
    status: 'active' | 'inactive';
    created_at: string;
    updated_at: string;
    created_by?: string;
    shift_config?: ShiftConfig[];
    external_id?: string; // ID do sistema Leading2Lean (L2L Site ID)
}


export const isAlertActive = (alert: QualityAlert): boolean => {
    const now = Date.now();
    const exp = new Date(alert.expiresAt).getTime();
    const flagExpired = alert.isExpired === true;
    return exp > now && !flagExpired;
};

// Role & Permissions Types
export interface Role {
    id: string;
    name: string;
    allowed_resources: string[];
    created_at?: string;
}

export interface RoleAuditLog {
    id: string;
    actor_id: string;
    role_id: string;
    action: string;
    details: string;
    timestamp: string;
    actor_name?: string; // Joined field
    role_name?: string; // Joined field
}

export type UserRole = 'admin' | 'operator' | 'processo' | 'qualidade' | 'aps'; // Deprecated type usage, prefer Role interface

export interface User {
    id: string;
    name: string;
    role?: { // Made optional to match API response on creation
        id: string;
        name: string;
        allowed_resources: string[];
    };
    username: string;
    password?: string; // Optional for existing users or purely auto-login users (though highly recommended)
    autoLogin?: boolean;
    plant_ids?: string[]; // IDs das plantas que o usuário tem acesso
    settings?: Partial<SystemSettings>; // Configurações personalizadas do usuário

    // API compatibility fields (optional for now to allow mixed usage)
    email: string;
    role_id?: string;
    status?: string;
    created_at?: string;
    updated_at?: string;
    role_name?: string;
    allowed_resources?: string;
}

export type ChangeEntity = 'document' | 'alert' | 'user' | 'machine' | 'bi' | 'presentation' | 'settings' | 'navigation' | 'plant' | 'role';

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

export const AVAILABLE_RESOURCES = {
    // Acesso Geral
    'view:dashboard': 'Visualizar Dashboard Principal',
    'view:admin_panel': 'Acessar Painel Administrativo',
    'view:admin_access_button': 'Visualizar Botão de Admin no Cabeçalho',

    // Módulos Administrativos (Menu)
    'admin:view_plants': 'Ver Plantas',
    'admin:manage_plants': 'Gerenciar Plantas',
    'admin:view_lines': 'Ver Linhas de Produção',
    'admin:manage_lines': 'Gerenciar Linhas de Produção',
    'admin:manage_stations': 'Gerenciar Estações de Trabalho',

    // Gestão de Documentos
    'admin:view_work_instructions': 'Ver Instruções de Trabalho',
    'admin:manage_work_instructions': 'Gerenciar Instruções de Trabalho',
    'admin:view_acceptance_criteria': 'Ver Critérios de Aceitação',
    'admin:manage_acceptance_criteria': 'Gerenciar Critérios de Aceitação',
    'admin:view_standardized_work': 'Ver Trabalho Padronizado',
    'admin:manage_standardized_work': 'Gerenciar Trabalho Padronizado',
    'admin:view_presentations': 'Ver Apresentações',
    'admin:manage_presentations': 'Gerenciar Apresentações',
    'admin:view_powerbi': 'Ver Relatórios PowerBI',
    'admin:manage_powerbi': 'Gerenciar Relatórios PowerBI',

    // Qualidade e Alertas
    'view:quality_alerts': 'Visualizar Alertas (Dashboard)',
    'admin:view_quality_alerts': 'Ver Gestão de Alertas',
    'admin:manage_quality_alerts': 'Gerenciar Alertas',

    // Usuários e Acesso
    'admin:view_users': 'Ver Usuários',
    'admin:manage_users': 'Gerenciar Usuários',
    'admin:view_roles': 'Ver Roles',
    'admin:manage_roles': 'Gerenciar Roles e Permissões',

    // Configurações e Sistema
    'admin:view_settings': 'Ver Configurações',
    'admin:manage_settings': 'Alterar Configurações',
    'admin:view_history': 'Ver Histórico de Ações',
    'admin:backup_view': 'Acessar Área de Backup',
    'admin:backup_create': 'Criar Backup',
    'admin:backup_restore': 'Restaurar Backup',
    'system:debug_tools': 'Ferramentas de Debug',
    'system:kiosk_mode': 'Iniciar aplicativo em modo Kiosk',
};

declare global {
    interface Window {
        electron?: {
            getOsUsername: () => string | null;
        };
    }
}
