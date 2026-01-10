import React, { useEffect, useRef, useState } from 'react';
import { useData } from '../contexts/DataContext';
import { QualityAlert, AlertSeverity } from '../types';
import Modal from './common/Modal';
import { PencilSquareIcon, TrashIcon } from './common/Icons';
import { usePDFStorage } from '../hooks/usePDFStorage';
import { useI18n } from '../contexts/I18nContext';
import { useLine } from '../contexts/LineContext';

const AdminAlertsManagement: React.FC = () => {
  const { alerts, addAlert, updateAlert, deleteAlert } = useData();
  const { selectedLine } = useLine();
  const { t, locale } = useI18n();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<QualityAlert | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  // Filter alerts for the selected line
  const filteredAlerts = (alerts || []).filter(a => selectedLine && a.lineId === selectedLine.id);

  const openModal = (item: QualityAlert | null = null) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setEditingItem(null);
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    setItemToDelete(id);
    setIsDeleteModalOpen(true);
  }

  const confirmDelete = () => {
    if (itemToDelete) {
      deleteAlert(itemToDelete);
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
    }
  }

  const cancelDelete = () => {
    setIsDeleteModalOpen(false);
    setItemToDelete(null);
  }

  const AlertsList: React.FC = () => {
    const [visibleCount, setVisibleCount] = useState(20);
    const [isLoading, setIsLoading] = useState(false);
    const sentinelRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => { setVisibleCount(20); }, [filteredAlerts.length]);

    const loadMore = async () => {
      if (isLoading) return;
      setIsLoading(true);
      await new Promise(r => setTimeout(r, 150));
      setVisibleCount(v => Math.min(v + 20, filteredAlerts.length));
      setIsLoading(false);
    };

    useEffect(() => {
      const el = sentinelRef.current;
      if (!el) return;
      const io = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && visibleCount < filteredAlerts.length) loadMore();
        }
      }, { rootMargin: '200px' });
      io.observe(el);
      return () => io.disconnect();
    }, [visibleCount, filteredAlerts.length]);

    return (
      <div className="overflow-x-auto mt-6">
        <table className="w-full text-left text-lg">
          <thead className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 uppercase">
            <tr>
              <th className="p-4">{t('common.title')}</th>
              <th className="p-4">{t('admin.severity')}</th>
              <th className="p-4">{t('admin.expiresAt')}</th>
              <th className="p-4 text-right">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
            {filteredAlerts.slice(0, visibleCount).map(item => (
              <tr key={item.id} className="border-b border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <td className="p-4 font-medium">{item.title}</td>
                <td className="p-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-bold text-white ${item.severity === 'A' ? 'bg-red-500' :
                    item.severity === 'B' ? 'bg-yellow-500 text-gray-900' :
                      'bg-gray-500'
                    }`}>
                    {item.severity}
                  </span>
                </td>
                <td className="p-4 text-gray-600 dark:text-gray-300">{new Date(item.expiresAt).toLocaleString(locale)}</td>
                <td className="p-4 flex justify-end space-x-3">
                  <button onClick={() => openModal(item)} className="p-2 text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors" title={t('common.edit')}>
                    <PencilSquareIcon className="h-6 w-6" />
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="p-2 text-red-600 dark:text-red-400 hover:text-red-500 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors" title={t('common.delete')}>
                    <TrashIcon className="h-6 w-6" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div ref={sentinelRef} className="p-4 text-center space-y-2">
          {isLoading && <span className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-md text-gray-700 dark:text-gray-300">{t('common.loading')}</span>}
          {filteredAlerts.length === 0 && !isLoading && <div className="text-gray-500">{t('admin.noAlerts')}</div>}
        </div>
      </div>
    );
  };

  const FormModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [formData, setFormData] = useState<Partial<QualityAlert>>(editingItem || { severity: AlertSeverity.A });
    const [uploadMode, setUploadMode] = useState<'url' | 'upload'>('url');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploadProgress, setUploadProgress] = useState<string>('');
    const { savePDF } = usePDFStorage();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.type !== 'application/pdf') {
        alert(t('admin.onlyPdf'));
        return;
      }

      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        alert(t('admin.fileTooLarge'));
        return;
      }

      setSelectedFile(file);
      setUploadProgress(`${t('admin.fileSelected')}: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();

      if (uploadMode === 'upload' && selectedFile) {
        try {
          setUploadProgress(t('admin.uploading'));
          const targetId = editingItem ? editingItem.id : `alert-${Date.now()}`;
          const indexedDBUrl = await savePDF(selectedFile, targetId);
          formData.pdfUrl = indexedDBUrl;
          formData.pdfName = selectedFile.name;
          setUploadProgress(t('admin.uploadComplete'));
        } catch (error) {
          alert(t('admin.uploadError'));
          console.error('Upload error:', error);
          return;
        }
      }

      // Ensure expiresAt is in correct ISO format
      const alertData = { ...formData };
      if (alertData.expiresAt) {
        // Convert to ISO string if needed
        const expiresDate = new Date(alertData.expiresAt);
        alertData.expiresAt = expiresDate.toISOString();
      }

      if (editingItem) {
        updateAlert({ ...editingItem, ...alertData } as QualityAlert);
      } else {
        // Ensure lineId is added if not present (though addAlert might handle it based on DataContext, we should ideally pass it explicitly if we moved away from DataContext dependency)
        // DataContext's addAlert uses selectedLineId from DataContext, which might be auto-selected.
        // But since we are blocking the UI if no line is selected, we assume selectedLine exists here.
        addAlert({ ...alertData, lineId: selectedLine?.id } as any);
      }
      onClose();
    }

    const commonClass = "w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-white p-3 rounded-lg text-lg border-2 border-gray-300 dark:border-gray-600 focus:border-cyan-500 focus:outline-none transition-colors";

    return (
      <Modal isOpen={true} onClose={onClose} title={editingItem ? t('admin.editAlert') : t('admin.addAlert')}>
        <form onSubmit={handleSubmit} className="space-y-6">
          <label className="text-xl block text-gray-900 dark:text-white">{t('common.title')}<input name="title" value={formData.title || ''} onChange={handleChange} className={commonClass} required /></label>
          <label className="text-xl block text-gray-900 dark:text-white">{t('common.description')}<textarea name="description" value={formData.description || ''} onChange={handleChange} className={commonClass} required /></label>
          <label className="text-xl block text-gray-900 dark:text-white">
            {t('admin.severity')}
            <div className="flex gap-4 mt-2">
              {(['A', 'B', 'C'] as const).map((sev) => (
                <button
                  key={sev}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, severity: sev as AlertSeverity }))}
                  className={`flex-1 min-h-[60px] px-8 py-4 text-2xl font-bold rounded-lg border-4 transition-all ${formData.severity === sev
                    ? sev === 'A'
                      ? 'bg-red-500 border-red-400 text-white shadow-lg scale-105'
                      : sev === 'B'
                        ? 'bg-yellow-500 border-yellow-400 text-gray-900 shadow-lg scale-105'
                        : 'bg-gray-500 border-gray-400 text-white shadow-lg scale-105'
                    : sev === 'A'
                      ? 'bg-gray-800 border-red-500 text-red-400 hover:bg-red-500 hover:text-white'
                      : sev === 'B'
                        ? 'bg-gray-800 border-yellow-500 text-yellow-400 hover:bg-yellow-500 hover:text-gray-900'
                        : 'bg-gray-800 border-gray-500 text-gray-400 hover:bg-gray-500 hover:text-white'
                    }`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </label>
          <label className="text-xl block text-gray-900 dark:text-white">{t('admin.expiresAt')}
            <input name="expiresAt" type="datetime-local" value={formData.expiresAt ? new Date(formData.expiresAt).toISOString().slice(0, 16) : ''} onChange={handleChange} className={commonClass} required />
          </label>

          <div className="mt-6 border-t border-gray-300 dark:border-gray-700 pt-4">
            <h4 className="text-xl font-bold mb-4 text-cyan-600 dark:text-cyan-400">{t('admin.attachPdf')}</h4>

            <div className="flex gap-3 mb-4">
              <button
                type="button"
                onClick={() => setUploadMode('url')}
                className={`flex-1 py-3 px-4 rounded-lg text-lg font-medium transition-all border-2 ${uploadMode === 'url'
                  ? 'bg-cyan-600 border-cyan-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
                  }`}
              >
                🔗 {t('admin.externalUrl')}
              </button>
              <button
                type="button"
                onClick={() => setUploadMode('upload')}
                className={`flex-1 py-3 px-4 rounded-lg text-lg font-medium transition-all border-2 ${uploadMode === 'upload'
                  ? 'bg-cyan-600 border-cyan-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
                  }`}
              >
                📁 {t('admin.uploadFile')}
              </button>
            </div>

            {uploadMode === 'url' ? (
              <label className="text-xl block text-gray-900 dark:text-white">
                {t('admin.pdfUrl')}
                <input
                  name="pdfUrl"
                  type="url"
                  value={formData.pdfUrl || ''}
                  onChange={handleChange}
                  className={commonClass}
                  placeholder="https://exemplo.com/documento.pdf"
                />
              </label>
            ) : (
              <div className="space-y-3">
                <label className="block">
                  <div className="text-xl mb-2 text-gray-900 dark:text-white">{t('admin.selectPdf')}</div>
                  <div className="relative">
                    <input
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={handleFileSelect}
                      className="w-full text-gray-900 dark:text-white file:mr-4 file:py-3 file:px-6 file:rounded-lg file:border-0 file:text-lg file:font-medium file:bg-cyan-600 file:text-white hover:file:bg-cyan-700 file:cursor-pointer cursor-pointer bg-gray-100 dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg p-3"
                    />
                  </div>
                </label>
                {formData.pdfUrl && (
                  <div className="mt-2 text-sm text-green-600 dark:text-green-400">
                    ✅ {t('admin.pdfLinked')}: {formData.pdfName || t('admin.fileAttached')}
                  </div>
                )}
                {uploadProgress && (
                  <div className="p-3 bg-cyan-100 dark:bg-cyan-900/30 border border-cyan-300 dark:border-cyan-500/30 rounded-lg text-cyan-800 dark:text-cyan-300 text-sm">
                    {uploadProgress}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-4">
            <button type="button" onClick={onClose} className="px-6 py-3 bg-gray-600 rounded-lg text-xl hover:bg-gray-500 text-white">{t('common.cancel')}</button>
            <button type="submit" className="px-6 py-3 bg-cyan-600 rounded-lg text-xl hover:bg-cyan-500 text-white">{t('common.save')}</button>
          </div>
        </form>
      </Modal>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-cyan-600 dark:text-cyan-400">{t('header.alerts')}</h2>
        <div className="flex flex-col items-end gap-2">
          <button
            onClick={() => openModal()}
            disabled={!selectedLine}
            className={`px-6 py-3 rounded-lg text-xl font-bold text-white shadow-lg transition-transform transform ${!selectedLine ? 'bg-gray-400 cursor-not-allowed' : 'bg-cyan-600 hover:bg-cyan-500 hover:scale-105'}`}
          >
            + {t('admin.newAlert')}
          </button>
          {!selectedLine && <p className="text-red-500 text-sm font-semibold">{t('admin.selectLineToEnable')}</p>}
        </div>
      </div>

      <AlertsList />

      {isModalOpen && <FormModal onClose={closeModal} />}

      <Modal isOpen={isDeleteModalOpen} onClose={cancelDelete} title={t('admin.confirmDelete')}>
        <div className="space-y-6">
          <p className="text-xl text-gray-800 dark:text-gray-300">{t('admin.deleteAlertConfirm')}</p>
          <div className="flex justify-end space-x-4">
            <button onClick={cancelDelete} className="px-6 py-3 bg-gray-600 rounded-lg text-xl hover:bg-gray-500 text-white">{t('common.cancel')}</button>
            <button onClick={confirmDelete} className="px-6 py-3 bg-red-600 rounded-lg text-xl hover:bg-red-500 text-white">{t('common.delete')}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminAlertsManagement;