
import React from 'react';
import { XMarkIcon } from './Icons';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'lg' }) => {
    if (!isOpen) return null;

    const sizeClasses = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        full: 'max-w-full h-full'
    };

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4"
        // Removed onClick={onClose} from the outer div as per the provided code edit.
        // If clicking outside should close the modal, this line needs to be re-added.
        >
            <div
                className="bg-white dark:bg-gray-800 p-5 w-full max-w-7xl h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-gray-300 dark:border-gray-700 relative"
                onClick={(e) => e.stopPropagation()} // Keep stopPropagation for the inner modal
            >
                <div className="flex p-2 justify-between items-center mb-2">
                    <h2 className="text-2xl ml-4 font-bold text-gray-900 dark:text-white">{title}</h2>
                    <button onClick={onClose} className="text-gray-600 mr-4 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                        <XMarkIcon className="h-10 w-10" />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
};

export default Modal;
