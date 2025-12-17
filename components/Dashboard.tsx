
import React, { useState, Suspense } from 'react';
import { Page, PowerBiReport as PowerBiReportType, Presentation } from '../types';
import Modal from './common/Modal';
import Ripple from './common/Ripple';
import Skeleton from './common/Skeleton';
import {
    PencilSquareIcon,
    ClipboardDocumentCheckIcon,
    DocumentTextIcon,
    ChartBarIcon,
    PresentationChartBarIcon
} from './common/Icons';

import { useI18n } from '../contexts/I18nContext';
import { useLog } from '../contexts/LogContext';
import { useDocuments } from '../hooks/useDocuments';
import { useLine } from '../contexts/LineContext';

// Lazy load PowerBiReport
const PowerBiReport = React.lazy(() => import('./common/PowerBiReport'));

interface DashboardProps {
    navigateTo: (page: Page) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ navigateTo }) => {
    const { t } = useI18n();
    const { logEvent } = useLog();
    const { lines, selectedLine, setSelectedLineId } = useLine();
    const selectedLineId = selectedLine?.id || '';

    const { data: unifiedDocs } = useDocuments();
    const biReports = unifiedDocs?.reports || [];
    const presentations = unifiedDocs?.presentations || [];

    const [selectedReport, setSelectedReport] = useState<PowerBiReportType | null>(null);
    const [selectedPresentation, setSelectedPresentation] = useState<Presentation | null>(null);

    const mainNavItems = [
        {
            page: Page.WorkInstructions,
            label: t('dashboard.workInstructions'),
            icon: PencilSquareIcon,
            style: 'bg-gradient-to-br from-green-500 to-green-700 hover:from-green-600 hover:to-green-800'
        },
        {
            page: Page.AcceptanceCriteria,
            label: t('dashboard.acceptanceCriteria'),
            icon: ClipboardDocumentCheckIcon,
            style: 'bg-gradient-to-br from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700'
        },
        {
            page: Page.StandardizedWork,
            label: t('dashboard.standardizedWork'),
            icon: DocumentTextIcon,
            style: 'bg-gradient-to-br from-orange-500 to-orange-700 hover:from-orange-600 hover:to-orange-800'
        },
    ];

    const handleReportClick = (report: PowerBiReportType) => {
        setSelectedReport(report);
        logEvent('bi', 'view', report.id, report.name);
    }

    const handlePresentationClick = (presentation: Presentation) => {
        setSelectedPresentation(presentation);
        logEvent('presentation', 'view', presentation.id, presentation.title);
    }

    const sqdcmReport = React.useMemo(() =>
        biReports.find(r => r.lineId === selectedLineId && r.name === 'SQDCM'),
        [biReports, selectedLineId]
    );

    const filteredReports = React.useMemo(() =>
        biReports.filter(report =>
            (!report.lineId || report.lineId === selectedLineId) &&
            report.name !== 'SQDCM'
        ),
        [biReports, selectedLineId]
    );

    const filteredPresentations = React.useMemo(() =>
        presentations.filter(pres => !pres.lineId || pres.lineId === selectedLineId),
        [presentations, selectedLineId]
    );

    return (
        <div className="h-full flex p-4 flex-col gap-6">
            {/* Line Global Selector */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 flex flex-col md:flex-row items-center justify-between">
                <div className="w-full md:w-auto mb-4 md:mb-0">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('workInstructions.selectLine')}</h2>
                    <p className="text-gray-500 text-sm">{t('dashboard.selectLineSubtitle') || 'Selecione a linha para filtrar o conteúdo'}</p>
                </div>
                <div className="w-full md:w-1/3">
                    <select
                        value={selectedLineId || ''}
                        onChange={(e) => setSelectedLineId(e.target.value)}
                        className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors text-lg font-medium"
                    >
                        {!selectedLineId && <option value="">Selecione uma linha...</option>}
                        {lines.map(line => (
                            <option key={line.id} value={line.id}>
                                {line.name} {line.plantName ? `| ${line.plantName}` : ''}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 flex-1">
                {mainNavItems.map(item => (
                    <Ripple
                        key={item.page}
                        onClick={() => navigateTo(item.page)}
                        className={`rounded-2xl text-white font-bold flex flex-col items-center justify-center p-4 md:p-8 transition-all transform hover:scale-105 shadow-2xl ${item.style}`}
                    >
                        <item.icon className="h-16 w-16 md:h-24 md:w-24 mb-4 opacity-90" />
                        <span className="text-xl md:text-3xl text-center">{item.label}</span>
                    </Ripple>
                ))}
            </div>

            <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 shrink-0`}>
                {/* SQDCM Button - Fixo e Destacado */}
                {sqdcmReport && (
                    <Ripple
                        onClick={() => handleReportClick(sqdcmReport)}
                        className="bg-gradient-to-br from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 rounded-2xl text-white font-bold flex flex-col items-center justify-center p-4 md:p-6 transition-all transform hover:scale-105 shadow-xl border border-blue-500"
                    >
                        {/* Ícone Diferente para SQDCM */}
                        <ChartBarIcon className="h-10 w-10 md:h-14 md:w-14 mb-2 md:mb-3 text-white" />
                        <span className="text-xl md:text-3xl text-center tracking-wider">SQDCM</span>
                    </Ripple>
                )}

                {/* Outros Relatórios */}
                {filteredReports.map((report) => (
                    <Ripple
                        key={report.id}
                        onClick={() => handleReportClick(report)}
                        className="bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-700 dark:to-gray-800 hover:from-gray-400 hover:to-gray-500 dark:hover:from-gray-600 dark:hover:to-gray-700 rounded-2xl text-gray-900 dark:text-white font-semibold flex flex-col items-center justify-center p-4 md:p-6 transition-all transform hover:scale-105 shadow-xl border border-gray-400 dark:border-gray-600"
                    >
                        <ChartBarIcon className="h-10 w-10 md:h-12 md:w-12 mb-2 md:mb-3 text-blue-600 dark:text-blue-400" />
                        <span className="text-sm md:text-xl text-center truncate w-full">{report.name}</span>
                    </Ripple>
                ))}

                {/* Apresentações */}
                {filteredPresentations.map((pres) => (
                    <Ripple
                        key={pres.id}
                        onClick={() => handlePresentationClick(pres)}
                        className="bg-gradient-to-br from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 rounded-2xl text-white font-semibold flex flex-col items-center justify-center p-4 md:p-6 transition-all transform hover:scale-105 shadow-xl border border-pink-400"
                    >
                        <PresentationChartBarIcon className="h-10 w-10 md:h-12 md:w-12 mb-2 md:mb-3 text-white" />
                        <span className="text-sm md:text-xl text-center truncate w-full">{pres.title}</span>
                    </Ripple>
                ))}
            </div>

            <Modal
                isOpen={!!selectedReport}
                onClose={() => setSelectedReport(null)}
                title={selectedReport?.name || ''}
                size="full"
            >
                {selectedReport && (
                    <Suspense fallback={
                        <div className="w-full h-full bg-gray-900 rounded-lg flex flex-col p-4 animate-pulse">
                            <Skeleton width="100%" height="100%" />
                        </div>
                    }>
                        <PowerBiReport report={selectedReport} />
                    </Suspense>
                )}
            </Modal>

            {/* Presentation Modal */}
            <Modal
                isOpen={!!selectedPresentation}
                onClose={() => setSelectedPresentation(null)}
                title={selectedPresentation?.title || ''}
                size="full"
            >
                {selectedPresentation && (
                    <div className="w-full h-[85vh] bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden relative">
                        <iframe
                            src={selectedPresentation.url}
                            className="w-full h-full border-0"
                            allowFullScreen
                            title={selectedPresentation.title}
                            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                        />
                        <div className="absolute bottom-4 right-4">
                            <a
                                href={selectedPresentation.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-4 py-2 bg-gray-800 text-white rounded-lg shadow-lg opacity-50 hover:opacity-100 transition-opacity text-sm"
                            >
                                Abrir em nova aba ↗
                            </a>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default Dashboard;
