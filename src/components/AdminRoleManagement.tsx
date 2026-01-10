
import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { Role, AVAILABLE_RESOURCES, RoleAuditLog } from '../types';
import { getRoles, createRole, updateRole, deleteRole } from '@/services/api/roles';
// import { getRoleAuditLogs } from '@/services/api/roles'; // Missing in API
const getRoleAuditLogs = async () => []; // Stub
import Modal from './common/Modal';
import { PencilSquareIcon, TrashIcon, UserGroupIcon, ClockIcon } from './common/Icons';

// Helper to group resources by category (prefix)
const groupResources = () => {
    const grouped: Record<string, { key: string; label: string }[]> = {};

    // Custom mapping for nicer headers
    const headers: Record<string, string> = {
        'view': 'Acesso Geral',
        'admin': 'Administração',
        'system': 'Sistema'
    };

    Object.entries(AVAILABLE_RESOURCES).forEach(([key, label]) => {
        const prefix = key.split(':')[0]; // 'view', 'admin', 'system'
        const header = headers[prefix] || prefix.toUpperCase();

        if (!grouped[header]) grouped[header] = [];
        grouped[header].push({ key, label });
    });

    return grouped;
};

const resourceGroups = groupResources();

const AdminRoleManagement: React.FC = () => {
    const { currentUser } = useAuth();
    const { t } = useI18n();
    const [roles, setRoles] = useState<Role[]>([]);
    const [logs, setLogs] = useState<RoleAuditLog[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'roles' | 'logs'>('roles');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | null>(null);
    const [formData, setFormData] = useState<{ name: string; allowed_resources: string[] }>({ name: '', allowed_resources: [] });

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [rolesData, logsData] = await Promise.all([
                getRoles(),
                getRoleAuditLogs()
            ]);
            setRoles(rolesData);
            setLogs(logsData);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const openModal = (role?: Role) => {
        if (role) {
            setEditingRole(role);
            setFormData({ name: role.name, allowed_resources: role.allowed_resources || [] });
        } else {
            setEditingRole(null);
            setFormData({ name: '', allowed_resources: [] });
        }
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;
        setIsLoading(true);
        try {
            if (editingRole) {
                await updateRole(editingRole.id, formData);
            } else {
                await createRole({ name: formData.name, allowed_resources: formData.allowed_resources });
            }
            await fetchData();
            setIsModalOpen(false);
        } catch (error) {
            alert('Erro ao salvar role: ' + (error as any).message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (roleId: string) => {
        if (!currentUser || !confirm('Tem certeza que deseja excluir esta role?')) return;
        setIsLoading(true);
        try {
            await deleteRole(roleId);
            await fetchData();
        } catch (error) {
            alert('Erro ao excluir: ' + (error as any).message);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleResource = (resourceKey: string) => {
        setFormData(prev => {
            const exists = prev.allowed_resources.includes(resourceKey);
            if (exists) {
                return { ...prev, allowed_resources: prev.allowed_resources.filter(r => r !== resourceKey) };
            } else {
                return { ...prev, allowed_resources: [...prev.allowed_resources, resourceKey] };
            }
        });
    };

    const toggleGroup = (groupLabel: string, enable: boolean) => {
        const resourcesInGroup = resourceGroups[groupLabel].map(r => r.key);
        setFormData(prev => {
            const current = new Set(prev.allowed_resources);
            resourcesInGroup.forEach(r => {
                if (enable) current.add(r);
                else current.delete(r);
            });
            return { ...prev, allowed_resources: Array.from(current) };
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-gray-700 pb-4">
                <h2 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                    <UserGroupIcon className="h-8 w-8 text-cyan-500" />
                    Gerenciamento de Roles
                </h2>
                <div className="flex gap-4">
                    <button
                        onClick={() => setActiveTab('roles')}
                        className={`px-4 py-2 rounded-lg text-lg ${activeTab === 'roles' ? 'bg-cyan-600 text-white' : 'bg-gray-700 text-gray-300'}`}
                    >
                        Roles
                    </button>
                    <button
                        onClick={() => setActiveTab('logs')}
                        className={`px-4 py-2 rounded-lg text-lg ${activeTab === 'logs' ? 'bg-cyan-600 text-white' : 'bg-gray-700 text-gray-300'}`}
                    >
                        Logs de Auditoria
                    </button>
                    {activeTab === 'roles' && (
                        <button
                            onClick={() => openModal()}
                            className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-lg flex items-center gap-2"
                        >
                            + Nova Role
                        </button>
                    )}
                </div>
            </div>

            {isLoading && <div className="text-center p-4">Carregando...</div>}

            {activeTab === 'roles' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {roles.map(role => (
                        <div key={role.id} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{role.name}</h3>
                                <div className="flex gap-2">
                                    <button onClick={() => openModal(role)} className="text-blue-500 hover:text-blue-400 p-2">
                                        <PencilSquareIcon className="h-6 w-6" />
                                    </button>
                                    <button onClick={() => handleDelete(role.id)} className="text-red-500 hover:text-red-400 p-2">
                                        <TrashIcon className="h-6 w-6" />
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <p className="text-gray-600 dark:text-gray-400">
                                    <span className="font-semibold">Permissões:</span> {role.allowed_resources?.length || 0}
                                </p>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {(Array.isArray(role.allowed_resources) ? role.allowed_resources : []).slice(0, 5).map(res => (
                                        <span key={res} className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs truncate max-w-[150px]">
                                            {AVAILABLE_RESOURCES[res as keyof typeof AVAILABLE_RESOURCES] || res}
                                        </span>
                                    ))}
                                    {(role.allowed_resources?.length || 0) > 5 && (
                                        <span className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs text-gray-500">
                                            +{role.allowed_resources.length - 5}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow">
                    <table className="w-full text-left">
                        <thead className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 uppercase text-sm">
                            <tr>
                                <th className="p-4">Data/Hora</th>
                                <th className="p-4">Usuário</th>
                                <th className="p-4">Ação</th>
                                <th className="p-4">Detalhes</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {logs.map(log => (
                                <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <td className="p-4 whitespace-nowrap text-gray-500">
                                        {new Date(log.timestamp).toLocaleString('pt-BR')}
                                    </td>
                                    <td className="p-4 font-medium text-gray-900 dark:text-white">
                                        {log.actor_name}
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${log.action === 'create' ? 'bg-green-100 text-green-800' :
                                            log.action === 'update' ? 'bg-blue-100 text-blue-800' :
                                                'bg-red-100 text-red-800'
                                            }`}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="p-4 text-gray-600 dark:text-gray-300">
                                        {log.details}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingRole ? 'Editar Role' : 'Nova Role'} size="lg">
                <form onSubmit={handleSave} className="space-y-6">
                    <div>
                        <label className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">Nome da Role</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="w-full p-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
                            required
                        />
                    </div>

                    <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
                        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 border-b border-gray-700 pb-2">Permissões de Acesso</h3>

                        {Object.entries(resourceGroups).map(([groupLabel, resources]) => (
                            <div key={groupLabel} className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
                                <div className="flex justify-between items-center mb-3">
                                    <h4 className="text-lg font-semibold text-cyan-600 dark:text-cyan-400">{groupLabel}</h4>
                                    <div className="flex gap-2 text-sm">
                                        <button type="button" onClick={() => toggleGroup(groupLabel, true)} className="text-blue-500 hover:underline">Marcar tudo</button>
                                        <span className="text-gray-400">|</span>
                                        <button type="button" onClick={() => toggleGroup(groupLabel, false)} className="text-gray-500 hover:underline">Desmarcar</button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {resources.map(({ key, label }) => (
                                        <label key={key} className="flex items-center space-x-3 cursor-pointer p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={formData.allowed_resources.includes(key)}
                                                onChange={() => toggleResource(key)}
                                                className="w-5 h-5 text-cyan-600 rounded border-gray-300 focus:ring-cyan-500"
                                            />
                                            <span className="text-gray-700 dark:text-gray-300 select-none">
                                                {label}
                                                <div className="text-xs text-gray-400 font-mono mt-0.5">{key}</div>
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-end gap-4 pt-4 border-t border-gray-700">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg">Cancelar</button>
                        <button type="submit" className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-medium">Salvar Role</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default AdminRoleManagement;
