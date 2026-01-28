import React, { useState, Suspense } from 'react';
import { PowerBiReport as PowerBiReportType, Presentation, Page } from '../types';
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
import { useNavigate } from 'react-router-dom';

// Lazy load PowerBiReport
const PowerBiReport = React.lazy(() => import('./common/PowerBiReport'));

interface DashboardProps {
    // navigateTo removed
}

const Dashboard: React.FC<DashboardProps> = () => {
    const { t } = useI18n();
    const { logEvent } = useLog();
    const { lines, selectedLine, setSelectedLineId } = useLine();
    const selectedLineId = selectedLine?.id || '';
    const navigate = useNavigate();

    const { data: unifiedDocs } = useDocuments();
    const biReports = unifiedDocs?.reports || [];
    const presentations = unifiedDocs?.presentations || [];

    const [selectedReport, setSelectedReport] = useState<PowerBiReportType | null>(null);
    const [selectedPresentation, setSelectedPresentation] = useState<Presentation | null>(null);

    const mainNavItems = [
        {
            path: '/work-instructions',
            label: t('dashboard.workInstructions'),
            icon: PencilSquareIcon,
            style: 'bg-gradient-to-br from-green-500 to-green-700 hover:from-green-600 hover:to-green-800'
        },
        {
            path: '/acceptance-criteria',
            label: t('dashboard.acceptanceCriteria'),
            icon: ClipboardDocumentCheckIcon,
            style: 'bg-gradient-to-br from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700'
        },
        {
            path: '/standardized-work',
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
        presentations.filter(pres =>
            (!pres.lineId || pres.lineId === selectedLineId) &&
            pres.metadata?.show_in_dashboard !== false
        ),
        [presentations, selectedLineId]
    );

    return (
        <div className="h-full flex p-6 flex-col gap-6 overflow-y-auto bg-gray-50 dark:bg-gray-900">
            {/* Header / Line Selector Section */}
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row items-center justify-between sticky top-0 z-10">
                <div className="w-full md:w-auto mb-4 md:mb-0">
                    <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-400 dark:to-blue-200">
                        {t('workInstructions.selectLine')}
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                        {t('dashboard.selectLineSubtitle') || 'Selecione a linha para visualizar o conteúdo'}
                    </p>
                </div>
                <div className="w-full md:w-1/3 min-w-[300px]">
                    <div className="relative">
                        <select
                            value={selectedLineId || ''}
                            onChange={(e) => setSelectedLineId(e.target.value)}
                            className="w-full pl-4 pr-10 py-3 appearance-none bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 focus:outline-none transition-all text-lg font-medium cursor-pointer hover:bg-white dark:hover:bg-gray-800"
                        >
                            {!selectedLineId && <option value="">Selecione uma linha...</option>}
                            {lines.map(line => (
                                <option key={line.id} value={line.id}>
                                    {line.name} {(line as any).plantName ? `| ${(line as any).plantName}` : ''}
                                </option>
                            ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-500">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Action Grid - Controlled Height */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-8xl mx-auto">
                {mainNavItems.map((item, index) => (
                    <Ripple
                        key={item.path}
                        onClick={() => navigate(item.path)}
                        className={`
                            relative overflow-hidden group rounded-3xl p-8 
                            flex flex-col items-center justify-center 
                            transition-all duration-300 ease-out 
                            transform hover:-translate-y-1 hover:shadow-2xl shadow-lg
                            aspect-[4/5] md:aspect-[3/4] max-h-[500px] w-full
                            ${item.style}
                        `}
                    >
                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                        <div className="relative z-10 flex flex-col items-center text-center">
                            <div className="p-6 rounded-2xl mb-6 backdrop-blur-sm shadow-2xl group-hover:scale-110 transition-transform duration-300">
                                <item.icon className="h-20 w-20 text-white drop-shadow-md" />
                            </div>
                            <span className="text-2xl md:text-3xl font-bold text-white tracking-tight drop-shadow-sm leading-tight">
                                {item.label}
                            </span>
                        </div>
                    </Ripple>
                ))}
            </div>

            {/* Secondary Actions / Reports Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-8xl mx-auto pb-8">
                {/* SQDCM - Featured Card */}
                {sqdcmReport && (
                    <Ripple
                        onClick={() => handleReportClick(sqdcmReport)}
                        className="col-span-2 md:col-span-1 bg-gradient-to-br from-indigo-600 to-blue-700 hover:from-indigo-500 hover:to-blue-600 rounded-2xl text-white p-6 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 flex flex-row md:flex-col items-center justify-center gap-4 group cursor-pointer border border-indigo-400/30"
                    >
                        <div className="p-3 bg-white/20 rounded-xl group-hover:rotate-6 transition-transform">
                            <ChartBarIcon className="h-10 w-10 text-white" />
                        </div>
                        <span className="text-xl font-bold tracking-wider">SQDCM</span>
                    </Ripple>
                )}

                {/* Other Reports */}
                {filteredReports.map((report) => (
                    <Ripple
                        key={report.id}
                        onClick={() => handleReportClick(report)}
                        className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 rounded-2xl p-6 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-1 flex flex-col items-center justify-center gap-3 border border-gray-100 dark:border-gray-700 group cursor-pointer"
                    >
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl group-hover:scale-110 transition-transform">
                            <ChartBarIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                        </div>
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 text-center line-clamp-2">
                            {report.name}
                        </span>
                    </Ripple>
                ))}

                {/* Presentations */}
                {filteredPresentations.map((pres) => (
                    <Ripple
                        key={pres.id}
                        onClick={() => handlePresentationClick(pres)}
                        className="bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 hover:from-pink-100 hover:to-rose-100 dark:hover:from-pink-900/30 dark:hover:to-rose-900/30 rounded-2xl p-6 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-1 flex flex-col items-center justify-center gap-3 border border-pink-100 dark:border-pink-800/30 group cursor-pointer"
                    >
                        <div className="p-3 bg-pink-100 dark:bg-pink-900/50 rounded-xl group-hover:scale-110 transition-transform">
                            <PresentationChartBarIcon className="h-8 w-8 text-pink-600 dark:text-pink-400" />
                        </div>
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 text-center line-clamp-2">
                            {pres.title}
                        </span>
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
