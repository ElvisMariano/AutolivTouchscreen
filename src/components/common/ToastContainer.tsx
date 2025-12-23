import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast, Toast as ToastType } from '../../contexts/ToastContext';
import {
    CheckCircleIcon,
    XCircleIcon,
    ExclamationTriangleIcon,
    InformationCircleIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';

const Toast: React.FC<{ toast: ToastType; onClose: () => void }> = ({ toast, onClose }) => {
    const iconMap = {
        success: CheckCircleIcon,
        error: XCircleIcon,
        warning: ExclamationTriangleIcon,
        info: InformationCircleIcon
    };

    const colorMap = {
        success: 'bg-green-500 dark:bg-green-600',
        error: 'bg-red-500 dark:bg-red-600',
        warning: 'bg-yellow-500 dark:bg-yellow-600',
        info: 'bg-blue-500 dark:bg-blue-600'
    };

    const Icon = iconMap[toast.type];

    return (
        <motion.div
            initial={{ opacity: 0, x: 100, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={`${colorMap[toast.type]} text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 min-w-[300px] max-w-[500px] backdrop-blur-sm`}
        >
            <Icon className="w-6 h-6 flex-shrink-0" />
            <p className="flex-1 text-sm font-medium">{toast.message}</p>
            <button
                onClick={onClose}
                className="p-1 hover:bg-white/20 rounded transition-colors flex-shrink-0"
                aria-label="Fechar"
            >
                <XMarkIcon className="w-5 h-5" />
            </button>
        </motion.div>
    );
};

const ToastContainer: React.FC = () => {
    const { toasts, removeToast } = useToast();

    return (
        <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
            <AnimatePresence mode="popLayout">
                {toasts.map(toast => (
                    <div key={toast.id} className="pointer-events-auto">
                        <Toast toast={toast} onClose={() => removeToast(toast.id)} />
                    </div>
                ))}
            </AnimatePresence>
        </div>
    );
};

export default ToastContainer;
