import React, { useMemo, useState } from 'react';
import { useData } from '../contexts/DataContext';
import { ChangeEntity, ChangeLog } from '../types';
import { useI18n } from '../contexts/I18nContext';

const AdminChangeLog: React.FC = () => {
    const { changeLogs } = useData();
    const { t, locale } = useI18n();
    const [entityFilter, setEntityFilter] = useState<ChangeEntity | 'all'>('all');
    const [actionFilter, setActionFilter] = useState<'all' | 'create' | 'update' | 'delete' | 'view'>('all');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');

    const logs = useMemo(() => {
        return changeLogs
            .filter(l => entityFilter === 'all' ? true : l.entity === entityFilter)
            .filter(l => actionFilter === 'all' ? true : l.action === actionFilter)
            .filter(l => {
                if (startDate && new Date(l.timestamp) < new Date(startDate)) return false;
                if (endDate && new Date(l.timestamp) > new Date(endDate)) return false;
                return true;
            })
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [changeLogs, entityFilter, actionFilter]);

    const entities: (ChangeEntity | 'all')[] = ['all', 'document', 'alert', 'user', 'machine', 'bi', 'presentation', 'settings'];
    const actions: ('all' | 'create' | 'update' | 'delete' | 'view')[] = ['all', 'create', 'update', 'delete', 'view'];

    const getEntityLabel = (entity: string) => {
        switch (entity) {
            case 'all': return t('common.all');
            case 'document': return t('common.document');
            case 'alert': return t('common.alert');
            case 'user': return t('common.user');
            case 'machine': return t('common.machine');
            case 'bi': return t('common.bi');
            case 'presentation': return t('common.presentation');
            case 'settings': return t('common.settings');
            default: return entity;
        }
    };

    const getActionLabel = (action: string) => {
        switch (action) {
            case 'all': return t('common.all');
            case 'create': return t('common.create');
            case 'update': return t('common.update');
            case 'delete': return t('common.delete');
            case 'view': return t('common.view');
            default: return action;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap gap-4 items-center">
                <div className="bg-gray-200 dark:bg-gray-800 p-2 rounded-lg">
                    {entities.map(e => (
                        <button key={e} onClick={() => setEntityFilter(e as any)} className={`px-4 py-2 rounded-md text-lg transition-colors ${entityFilter === e ? 'bg-cyan-600 text-white' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'}`}>{getEntityLabel(e)}</button>
                    ))}
                </div>
                <div className="bg-gray-200 dark:bg-gray-800 p-2 rounded-lg">
                    {actions.map(a => (
                        <button key={a} onClick={() => setActionFilter(a)} className={`px-4 py-2 rounded-md text-lg transition-colors ${actionFilter === a ? 'bg-purple-600 text-white' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'}`}>{getActionLabel(a)}</button>
                    ))}
                </div>
                <div className="flex items-center gap-3 bg-gray-200 dark:bg-gray-800 p-2 rounded-lg">
                    <input type="datetime-local" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded-md border border-gray-300 dark:border-gray-600" />
                    <input type="datetime-local" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded-md border border-gray-300 dark:border-gray-600" />
                </div>
                <button onClick={() => {
                    const blob = new Blob([JSON.stringify(changeLogs, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `changeLogs-${new Date().toISOString()}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                }} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors">{t('admin.exportJson')}</button>
                <button onClick={() => {
                    const headers = ['timestamp', 'userName', 'entity', 'action', 'label'];
                    const rows = logs.map(l => [l.timestamp, l.userName || t('common.system'), l.entity, l.action, l.label]);
                    const csv = [headers.join(','), ...rows.map(r => r.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(','))].join('\n');
                    const blob = new Blob([csv], { type: 'text/csv' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `changeLogs-${new Date().toISOString()}.csv`;
                    a.click();
                    URL.revokeObjectURL(url);
                }} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors">{t('admin.exportCsv')}</button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-lg">
                    <thead className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 uppercase">
                        <tr>
                            <th className="p-4">{t('admin.dateTime')}</th>
                            <th className="p-4">{t('admin.user')}</th>
                            <th className="p-4">{t('admin.entity')}</th>
                            <th className="p-4">{t('admin.action')}</th>
                            <th className="p-4">{t('common.description')}</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                        {logs.map((log: ChangeLog) => (
                            <tr key={log.id} className="border-b border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                <td className="p-4 text-gray-600 dark:text-gray-300">{new Date(log.timestamp).toLocaleString(locale)}</td>
                                <td className="p-4 font-medium">{log.userName || t('common.system')}</td>
                                <td className="p-4 capitalize text-gray-600 dark:text-gray-300">{log.entity}</td>
                                <td className="p-4 capitalize text-gray-600 dark:text-gray-300">{log.action}</td>
                                <td className="p-4 text-gray-600 dark:text-gray-300">{log.label}</td>
                            </tr>
                        ))}
                        {logs.length === 0 && (
                            <tr>
                                <td colSpan={5} className="p-6 text-center text-gray-500 dark:text-gray-400">{t('admin.noLogsFound')}</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminChangeLog;