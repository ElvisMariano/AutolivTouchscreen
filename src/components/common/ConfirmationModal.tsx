import React from 'react';
import Modal from './Modal';
import { useI18n } from '../../contexts/I18nContext';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'primary' | 'warning';
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText,
    cancelText,
    variant = 'danger'
}) => {
    const { t } = useI18n();

    const getConfirmButtonClass = () => {
        switch (variant) {
            case 'danger':
                return 'bg-red-600 hover:bg-red-500 text-white';
            case 'warning':
                return 'bg-yellow-600 hover:bg-yellow-500 text-white';
            case 'primary':
            default:
                return 'bg-cyan-600 hover:bg-cyan-500 text-white';
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} size="md">
            <div className="space-y-6">
                <p className="text-lg text-gray-800 dark:text-gray-300">
                    {message}
                </p>

                <div className="flex justify-end space-x-4">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 bg-gray-600 rounded-lg text-lg font-medium hover:bg-gray-500 text-white transition-colors"
                    >
                        {cancelText || t('common.cancel')}
                    </button>
                    <button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className={`px-6 py-3 rounded-lg text-lg font-medium transition-colors ${getConfirmButtonClass()}`}
                    >
                        {confirmText || t('common.confirm')}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default ConfirmationModal;
