
import { ProductionLine, Document, QualityAlert, AlertSeverity, PowerBiReport, Presentation, User, DocumentCategory } from '../types';

export const MOCK_DOCS: Document[] = [
    { id: 'doc-001', title: 'Instrução de Montagem - Eixo Principal', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', version: 2, lastUpdated: '2023-10-26T10:00:00Z', category: DocumentCategory.WorkInstruction },
    { id: 'doc-002', title: 'Procedimento de Calibração - Sensor de Pressão', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', version: 1, lastUpdated: '2023-10-25T14:30:00Z', category: DocumentCategory.WorkInstruction },
    { id: 'doc-003', title: 'Critério de Aceitação - Solda TIG', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', version: 4, lastUpdated: '2023-10-27T08:00:00Z', category: DocumentCategory.AcceptanceCriteria },
    { id: 'doc-004', title: 'Padrão de Embalagem - Produto Final', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', version: 1, lastUpdated: '2023-10-20T11:00:00Z', category: DocumentCategory.StandardizedWork },
    { id: 'doc-005', title: 'Norma de Segurança NR-12', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', version: 5, lastUpdated: '2023-09-01T09:00:00Z', category: DocumentCategory.StandardizedWork },
    { id: 'doc-006', title: 'Manutenção Preventiva - Torno CNC', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', version: 3, lastUpdated: '2023-10-15T16:00:00Z', category: DocumentCategory.WorkInstruction },
    { id: 'alert-doc-01', title: 'Alerta: Risco de Contaminação', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', version: 1, lastUpdated: new Date().toISOString(), category: DocumentCategory.QualityAlert },
    { id: 'alert-doc-02', title: 'Alerta: Falha no Lote 23-B', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', version: 1, lastUpdated: new Date().toISOString(), category: DocumentCategory.QualityAlert },
];

export const MOCK_LINES: ProductionLine[] = [
    {
        id: 'line-a',
        name: 'Linha de Montagem A',
        machines: [
            { id: 'ma-01', name: 'Prensa Hidráulica', instructionId: 'doc-001', position: { x: 15, y: 20 }, status: 'offline' },
            { id: 'ma-02', name: 'Torno CNC', instructionId: 'doc-006', position: { x: 40, y: 45 }, status: 'offline' },
            { id: 'ma-03', name: 'Estação de Solda', instructionId: 'doc-003', position: { x: 65, y: 25 }, status: 'offline' },
            { id: 'ma-04', name: 'Cabine de Pintura', instructionId: 'doc-002', position: { x: 85, y: 55 }, status: 'offline' },
        ]
    }
];

export const MOCK_ALERTS: QualityAlert[] = [
    {
        id: 'alert-1',
        title: 'Não conformidade no lote 23-B',
        description: 'Detectada variação de cor fora do padrão. Inspecionar todas as unidades do lote.',
        severity: AlertSeverity.A, // Alta
        documentId: 'alert-doc-02',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        expiresAt: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
        isRead: false
    },
    {
        id: 'alert-2',
        title: 'Ajuste no parâmetro de pressão',
        description: 'A pressão da máquina MA-01 deve ser ajustada para 85 bar.',
        severity: AlertSeverity.B, // Média
        documentId: 'doc-001',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        expiresAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
        isRead: true
    },
    {
        id: 'alert-3',
        title: 'Risco de contaminação',
        description: 'Fornecedor de matéria-prima reportou possível contaminação. Segregar material do lote F-891.',
        severity: AlertSeverity.A, // Alta
        documentId: 'alert-doc-01',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        expiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        isRead: false
    },
    {
        id: 'alert-4',
        title: 'Atualização de Software',
        description: 'O software do Torno CNC (MA-02) foi atualizado. Consultar novo manual de operações.',
        severity: AlertSeverity.C, // Baixa
        documentId: 'doc-006',
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        expiresAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // Expired
        isRead: true
    },
];

export const MOCK_BI_REPORTS: PowerBiReport[] = [
    { id: 'bi-01', name: 'Eficiência Geral (OEE)', embedUrl: 'https://app.powerbi.com/view?r=eyJrIjoiYjcwNjllYjEtYWFlMi00MDQ3LTkyMDItY2Y3ZGRmY2JlZDY5IiwidCI6IjJjMTgyMzEwLTIzODItNDRhYy1hYmI1LTc4M2E4YTYyM2Y5NyJ9' },
    { id: 'bi-02', name: 'Produção por Turno', embedUrl: 'https://app.powerbi.com/view?r=eyJrIjoiYjcwNjllYjEtYWFlMi00MDQ3LTkyMDItY2Y3ZGRmY2JlZDY5IiwidCI6IjJjMTgyMzEwLTIzODItNDRhYy1hYmI1LTc4M2E4YTYyM2Y5NyJ9' },
    { id: 'bi-03', name: 'Índice de Refugo', embedUrl: 'https://app.powerbi.com/view?r=eyJrIjoiYjcwNjllYjEtYWFlMi00MDQ3LTkyMDItY2Y3ZGRmY2JlZDY5IiwidCI6IjJjMTgyMzEwLTIzODItNDRhYy1hYmI1LTc4M2E4YTYyM2Y5NyJ9' },
];

export const MOCK_PRESENTATIONS: Presentation[] = [
    {
        id: 'ppt-01',
        title: 'Integração de Novos Colaboradores',
        url: 'https://example.com/dummy-presentation',
        slides: [
            'https://picsum.photos/1080/1920?random=1',
            'https://picsum.photos/1080/1920?random=2',
            'https://picsum.photos/1080/1920?random=3',
            'https://picsum.photos/1080/1920?random=4',
        ]
    }
];

export const MOCK_USERS: User[] = [
    { id: 'user-01', name: 'Admin', role: { id: 'admin', name: 'Admin', allowed_resources: [] }, username: 'admin', password: '123' },
    { id: 'user-02', name: 'Operador 1', role: { id: 'operator', name: 'Operador', allowed_resources: [] }, username: 'operador', password: '123' },
];