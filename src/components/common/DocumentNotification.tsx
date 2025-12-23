import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { useLine } from '../../contexts/LineContext';
import { useUnreadDocuments } from '../../hooks/useUnreadDocuments';
import { BellIcon, EyeIcon } from './Icons';
import Modal from './Modal';
import { DocumentCategory } from '../../types';
import { useNavigate } from 'react-router-dom';

interface DocumentNotificationProps {
    // navigateTo removed
}

const DocumentNotification: React.FC<DocumentNotificationProps> = () => {
    const { setAutoOpenDocId, currentShift, activeShifts } = useData();
    const { selectedLine } = useLine();
    const selectedLineId = selectedLine?.id || null;

    // Use hook that respects LineContext instead of DataContext auto-selection
    const unreadDocuments = useUnreadDocuments(selectedLineId, currentShift, activeShifts);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const navigate = useNavigate();

    const handleOpenDoc = (doc: any) => {
        // Map category to page path
        let targetPath = '/work-instructions'; // Default
        switch (doc.category) {
            case DocumentCategory.WorkInstruction:
                targetPath = '/work-instructions';
                break;
            case DocumentCategory.QualityAlert:
                targetPath = '/quality-alerts';
                break;
            case DocumentCategory.StandardizedWork:
                targetPath = '/standardized-work';
                break;
            case DocumentCategory.AcceptanceCriteria:
                targetPath = '/acceptance-criteria';
                break;
            default:
                targetPath = '/work-instructions';
        }

        // Set context to auto-open
        setAutoOpenDocId(doc.id);

        // Navigate
        setIsModalOpen(false);
        navigate(targetPath);
    };

    if (!selectedLineId || unreadDocuments.length === 0) return null;

    return (
        <>
            <button
                onClick={() => setIsModalOpen(true)}
                className="relative p-2 md:p-3 bg-white dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-all shadow-md group border border-gray-200 dark:border-gray-600"
                title="Documentos com atualização pendente"
            >
                <BellIcon className="h-6 w-6 md:h-8 md:w-8 text-gray-600 dark:text-gray-400 group-hover:text-amber-500 transition-colors" />
                <span className="absolute -top-1 -right-1 md:-top-2 md:-right-2 bg-red-500 text-white text-xs md:text-sm font-bold rounded-full h-5 w-5 md:h-6 md:w-6 flex items-center justify-center border-2 border-white dark:border-gray-800 shadow-sm animate-pulse">
                    {unreadDocuments.length}
                </span>
            </button>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={`Atualizações Pendentes (${unreadDocuments.length})`}
                size="lg"
            >
                <div className="space-y-4">
                    <p className="text-gray-600 dark:text-gray-300">
                        Os seguintes documentos foram atualizados. Clique em <strong>Abrir</strong> para visualizar o documento e realizar a confirmação de leitura.
                    </p>

                    <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto pr-2">
                        {unreadDocuments.map((doc) => (
                            <div
                                key={doc.id}
                                className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 transition"
                            >
                                <div className="mb-3 md:mb-0">
                                    <h4 className="font-semibold text-gray-800 dark:text-white text-lg">{doc.title}</h4>
                                    <div className="flex flex-wrap gap-2 text-sm mt-1">
                                        <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                                            {doc.category}
                                        </span>
                                        <span className="text-gray-500 dark:text-gray-400">
                                            Atualizado em: {new Date(doc.lastUpdated).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleOpenDoc(doc)}
                                        className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium shadow"
                                        title="Abrir Documento"
                                    >
                                        <EyeIcon className="h-5 w-5" />
                                        Abrir
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </Modal>
        </>
    );
};

export default DocumentNotification;
