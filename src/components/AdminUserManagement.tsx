import React, { useEffect, useState } from 'react';
import { useUsers } from '../hooks/useUsers';
import { usePlants } from '../hooks/usePlants';
import { useI18n } from '../contexts/I18nContext';
import { User } from '../services/api/users';
import Modal from './common/Modal';
import ConfirmationModal from './common/ConfirmationModal';
import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';

const AdminUserManagement: React.FC = () => {
    const {
        users,
        createUser: createUserMutation,
        updateUser: updateUserMutation,
        deleteUser: deleteUserMutation
    } = useUsers();

    // Admin usually sees ALL plants to assign
    const { plants: apiPlants } = usePlants(true);
    const plants = apiPlants as any[]; // cast because types might mismatch slightly or usePlants returns simplified objects

    // Helper wrappers
    const addUser = async (data: any) => {
        try {
            return await createUserMutation.mutateAsync(data);
        } catch (e) { console.error(e); return null; }
    };
    const updateUser = (data: any) => updateUserMutation.mutate(data);
    const deleteUser = (id: string) => deleteUserMutation.mutate(id);
    const { t } = useI18n();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [roles, setRoles] = useState<Array<{ id: string; name: string }>>([]);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<string | null>(null);

    const openModal = (user: User | null = null) => {
        setEditingUser(user);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setEditingUser(null);
        setIsModalOpen(false);
    };

    useEffect(() => {
        let mounted = true;
        getRoles().then(r => {
            if (mounted) setRoles(r);
        }).catch(() => { });
        return () => { mounted = false; };
    }, []);

    const handleDelete = (id: string) => {
        setUserToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (userToDelete) {
            await deleteUser(userToDelete);
            setIsDeleteModalOpen(false);
            setUserToDelete(null);
        }
    };

    const cancelDelete = () => {
        setIsDeleteModalOpen(false);
        setUserToDelete(null);
    };

    const getPlantNames = (plantIds?: string[]) => {
        if (!plantIds || plantIds.length === 0) return 'Todas (Admin) ou Nenhuma';
        if (!plants || plants.length === 0) return plantIds.join(', '); // Fallback se plants não carregou
        return plantIds.map(id => plants.find(p => p.id === id)?.name || id).join(', ');
    };

    const UserFormModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
        const [formData, setFormData] = useState<Partial<User>>(() => {
            if (editingUser) {
                // Flatten role object to string for the form select
                const roleValue = typeof editingUser.role === 'object'
                    ? editingUser.role.name.toLowerCase()
                    : editingUser.role;
                return {
                    ...editingUser,
                    role: roleValue as any
                };
            }
            return {
                role: (roles[0]?.name?.toLowerCase() as any) || 'operator',
                plant_ids: []
            };
        });

        // Effect to set default role_id when roles load
        useEffect(() => {
            if (!formData.role_id && roles.length > 0) {
                setFormData(prev => ({ ...prev, role_id: roles[0].id }));
            }
        }, [roles, formData.role_id]);

        const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
            const { name, value } = e.target;
            const v = name === 'role' ? value.toLowerCase() : value;
            setFormData(prev => ({ ...prev, [name]: v as any }));
        };

        const handlePlantChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
            const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
            setFormData(prev => ({ ...prev, plant_ids: selectedOptions }));
        };

        const handleSubmit = async (e: React.FormEvent) => {
            e.preventDefault();
            if (!formData.name || !formData.email) {
                alert(t('common.required'));
                return;
            }

            const userData = {
                ...formData,
                role_id: formData.role_id || (roles.length > 0 ? roles[0].id : undefined), // Fallback to default role
                username: formData.email
            } as User;

            if (editingUser) {
                // TODO: Update plant assignments on edit if needed
                updateUser(userData);
            } else {
                const newUser = await addUser(userData);
                if (newUser && formData.plant_ids && formData.plant_ids.length > 0) {
                    // Assign selected plants
                    try {
                        const { assignUserToPlant } = await import('@/services/api/users');
                        await Promise.all(formData.plant_ids.map(plantId =>
                            assignUserToPlant(newUser.id, plantId)
                        ));
                    } catch (error) {
                        console.error("Failed to assign plants:", error);
                        // Optional: show warning
                    }
                }
            }
            onClose();
        }

        const commonClass = "w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-white p-3 rounded-lg text-lg border-2 border-gray-300 dark:border-gray-600 focus:border-cyan-500 focus:outline-none transition-colors";

        return (
            <Modal isOpen={true} onClose={onClose} title={editingUser ? t('admin.editUser') : t('admin.addUser')}>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <label className="text-xl block text-gray-900 dark:text-white">{t('common.name')}
                        <input name="name" value={formData.name || ''} onChange={handleChange} className={commonClass} required />
                    </label>
                    <label className="text-xl block text-gray-900 dark:text-white">{t('common.email')}
                        <input
                            name="email"
                            type="email"
                            value={formData.email || ''}
                            onChange={handleChange}
                            className={commonClass}
                            required
                            placeholder="exemplo@autoliv.com"
                        />
                    </label>
                    <label className="text-xl block text-gray-900 dark:text-white">{t('admin.role')}
                        <select
                            name="role_id"
                            value={formData.role_id || (roles.length > 0 ? roles[0].id : '')}
                            onChange={handleChange}
                            className={commonClass}
                            required
                        >
                            <option value="" disabled>Selecione uma função</option>
                            {roles.length > 0 ? (
                                roles.map(r => (
                                    <option key={r.id} value={r.id}>
                                        {r.name}
                                    </option>
                                ))
                            ) : (
                                <option value="" disabled>Carregando funções...</option>
                            )}
                        </select>
                    </label>

                    <label className="text-xl block text-gray-900 dark:text-white">Acesso às Plantas
                        <p className="text-sm text-gray-500 mb-1">Segure Ctrl (ou Cmd) para selecionar múltiplas.</p>
                        <select
                            name="plant_ids"
                            multiple
                            value={formData.plant_ids || []}
                            onChange={handlePlantChange}
                            className={`${commonClass} h-32`}
                        >
                            {plants.map(plant => (
                                <option key={plant.id} value={plant.id} disabled={plant.status !== 'active'}>
                                    {plant.name} {plant.status !== 'active' ? '(Inativa)' : ''}
                                </option>
                            ))}
                        </select>
                    </label>

                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={onClose} className="px-6 py-3 bg-gray-600 rounded-lg text-xl hover:bg-gray-500 text-white">{t('common.cancel')}</button>
                        <button type="submit" className="px-6 py-3 bg-cyan-600 rounded-lg text-xl hover:bg-cyan-500 text-white">{t('common.save')}</button>
                    </div>
                </form>
            </Modal>
        )
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-300">{t('admin.userManagement')}</h2>
                <button onClick={() => openModal()} className="px-6 py-3 bg-green-600 rounded-lg text-xl font-semibold text-white hover:bg-green-500 shadow-md transition-transform transform hover:scale-105">{t('admin.addUser')}</button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-lg">
                    <thead className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 uppercase">
                        <tr>
                            <th className="p-4">{t('common.name')}</th>
                            <th className="p-4">{t('common.email')}</th>
                            <th className="p-4">{t('admin.role')}</th>
                            <th className="p-4">Plantas</th>
                            <th className="p-4 text-right">{t('common.actions')}</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                        {users.map(user => (
                            <tr key={user.id} className="border-b border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                <td className="p-4 font-medium">{user.name}</td>
                                <td className="p-4">{user.email}</td>
                                <td className="p-4 capitalize">
                                    {typeof user.role === 'object' ? user.role.name : user.role}
                                </td>
                                <td className="p-4 text-sm text-gray-500 dark:text-gray-400">
                                    {getPlantNames(user.plant_ids)}
                                </td>
                                <td className="p-4 flex justify-end space-x-3">
                                    <button onClick={() => openModal(user)} className="p-2 text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors" title={t('common.edit')}>
                                        <PencilSquareIcon className="h-6 w-6" />
                                    </button>
                                    <button onClick={() => handleDelete(user.id)} className="p-2 text-red-600 dark:text-red-400 hover:text-red-500 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors" title={t('common.delete')}>
                                        <TrashIcon className="h-6 w-6" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {isModalOpen && <UserFormModal onClose={closeModal} />}

            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={cancelDelete}
                onConfirm={confirmDelete}
                title={t('admin.confirmDelete')}
                message={t('admin.deleteUserConfirm')}
                confirmText={t('common.delete')}
                variant="danger"
            />
        </div>
    );
};

export default AdminUserManagement;
