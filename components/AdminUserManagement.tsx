import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { User } from '../types';
import Modal from './common/Modal';
import { PencilSquareIcon, TrashIcon } from './common/Icons';
import { useI18n } from '../contexts/I18nContext';

const AdminUserManagement: React.FC = () => {
    const { users, addUser, updateUser, deleteUser } = useData();
    const { t } = useI18n();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    const openModal = (user: User | null = null) => {
        setEditingUser(user);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setEditingUser(null);
        setIsModalOpen(false);
    };

    const handleDelete = (id: string) => {
        if (window.confirm(t('admin.deleteUserConfirm'))) {
            deleteUser(id);
        }
    };

    const UserFormModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
        const [formData, setFormData] = useState<Partial<User>>(editingUser || { role: 'operator' });

        const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
            const { name, value } = e.target;
            setFormData(prev => ({ ...prev, [name]: value }));
        };

        const handleSubmit = (e: React.FormEvent) => {
            e.preventDefault();
            if (!formData.name || !formData.pin || formData.pin.length !== 4) {
                alert(t('admin.fillAllFieldsPin'));
                return;
            }

            if (editingUser) {
                updateUser(formData as User);
            } else {
                addUser(formData as Omit<User, 'id'>);
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
                    <label className="text-xl block text-gray-900 dark:text-white">{t('admin.pin4Digits')}
                        <input name="pin" type="text" pattern="\d{4}" maxLength={4} value={formData.pin || ''} onChange={handleChange} className={commonClass} required />
                    </label>
                    <label className="text-xl block text-gray-900 dark:text-white">{t('admin.role')}
                        <select name="role" value={formData.role || 'operator'} onChange={handleChange} className={commonClass} required>
                            <option value="operator">{t('admin.operator')}</option>
                            <option value="admin">{t('admin.admin')}</option>
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
                            <th className="p-4">{t('admin.role')}</th>
                            <th className="p-4 text-right">{t('common.actions')}</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                        {users.map(user => (
                            <tr key={user.id} className="border-b border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                <td className="p-4 font-medium">{user.name}</td>
                                <td className="p-4 capitalize">{user.role === 'admin' ? t('admin.admin') : t('admin.operator')}</td>
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
        </div>
    );
};

export default AdminUserManagement;
