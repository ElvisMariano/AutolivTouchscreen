// Hook para gerenciamento de arquivos PDF com IndexedDB
import { useCallback } from 'react';

const DB_NAME = 'AutolivPDFStorage';
const STORE_NAME = 'pdfs';
const DB_VERSION = 1;

interface PDFFile {
    id: string;
    fileName: string;
    fileSize: number;
    fileType: string;
    blob: Blob;
    uploadedAt: string;
}

// Inicializar IndexedDB
const initDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };
    });
};

export const usePDFStorage = () => {
    // Salvar arquivo PDF no IndexedDB
    const savePDF = useCallback(async (file: File, id: string): Promise<string> => {
        const db = await initDB();

        const pdfFile: PDFFile = {
            id,
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            blob: file,
            uploadedAt: new Date().toISOString()
        };

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.put(pdfFile);

            request.onsuccess = () => resolve(`indexeddb://${id}`);
            request.onerror = () => reject(request.error);
        });
    }, []);

    // Recuperar arquivo PDF do IndexedDB
    const getPDF = useCallback(async (id: string): Promise<Blob | null> => {
        const db = await initDB();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get(id);

            request.onsuccess = () => {
                const result = request.result as PDFFile | undefined;
                resolve(result ? result.blob : null);
            };
            request.onerror = () => reject(request.error);
        });
    }, []);

    // Criar URL temporária para visualização
    const getPDFUrl = useCallback(async (id: string): Promise<string | null> => {
        const blob = await getPDF(id);
        if (!blob) return null;
        return URL.createObjectURL(blob);
    }, [getPDF]);

    // Deletar arquivo PDF
    const deletePDF = useCallback(async (id: string): Promise<void> => {
        const db = await initDB();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }, []);

    // Listar todos os arquivos
    const listPDFs = useCallback(async (): Promise<PDFFile[]> => {
        const db = await initDB();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }, []);

    // Obter informações do arquivo
    const getPDFInfo = useCallback(async (id: string): Promise<Omit<PDFFile, 'blob'> | null> => {
        const db = await initDB();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get(id);

            request.onsuccess = () => {
                const result = request.result as PDFFile | undefined;
                if (!result) {
                    resolve(null);
                } else {
                    const { blob, ...info } = result;
                    resolve(info);
                }
            };
            request.onerror = () => reject(request.error);
        });
    }, []);

    return {
        savePDF,
        getPDF,
        getPDFUrl,
        deletePDF,
        listPDFs,
        getPDFInfo
    };
};

// Helper para verificar se URL é IndexedDB
export const isIndexedDBUrl = (url: string): boolean => {
    return url.startsWith('indexeddb://');
};

// Helper para extrair ID do URL IndexedDB
export const getIndexedDBId = (url: string): string => {
    return url.replace('indexeddb://', '');
};
