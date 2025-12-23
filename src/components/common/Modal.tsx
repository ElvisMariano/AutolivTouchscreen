
import React, { useEffect } from 'react';
import { XMarkIcon } from './Icons';
import { motion, AnimatePresence } from 'framer-motion';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'lg' }) => {

    // Close on ESC key
    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            window.addEventListener('keydown', handleEsc);
        }

        return () => {
            window.removeEventListener('keydown', handleEsc);
        };
    }, [isOpen, onClose]);

    const sizeClasses = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        full: 'max-w-full h-full'
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                >
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70"
                        onClick={onClose}
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 10 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 10 }}
                        transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 30
                        }}
                        className={`bg-white dark:bg-gray-800 p-5 w-full ${sizeClasses[size]} ${size === 'full' ? 'h-[90vh]' : 'max-h-[90vh]'} rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-gray-300 dark:border-gray-700 relative z-10`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex p-2 justify-between items-center mb-2 flex-shrink-0">
                            <h2 className="text-2xl ml-4 font-bold text-gray-900 dark:text-white truncate pr-4">{title}</h2>
                            <button onClick={onClose} className="text-gray-600 mr-4 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                                <XMarkIcon className="h-8 w-8" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-auto">
                            {children}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default Modal;
