import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeftStartOnRectangleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface UnauthorizedScreenProps {
    name: string;
}

const UnauthorizedScreen: React.FC<UnauthorizedScreenProps> = ({ name }) => {
    const { logout } = useAuth();

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-lg shadow-xl overflow-hidden">
                <div className="bg-red-50 p-6 flex flex-col items-center border-b border-red-100">
                    <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                        <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Acesso Negado</h2>
                </div>

                <div className="p-8 text-center">
                    <p className="text-gray-600 mb-6 text-lg">
                        O usuário <span className="font-bold text-gray-900">{name}</span> não possui autorização de acesso.
                    </p>
                    <p className="text-gray-500 mb-8">
                        Por favor, fale com o administrador do sistema para solicitar seu cadastro.
                    </p>

                    <button
                        onClick={logout}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors duration-200"
                    >
                        <ArrowLeftStartOnRectangleIcon className="h-5 w-5" />
                        Sair / Tentar outra conta
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UnauthorizedScreen;
