const { contextBridge } = require('electron');

// No preload com contextIsolation, usamos process.env que é seguro
contextBridge.exposeInMainWorld('electron', {
    getOsUsername: () => {
        try {
            // Usar variáveis de ambiente do sistema
            const username = process.env.USERNAME || process.env.USER || null;
            console.log('Preload: Retrieved OS User:', username);
            return username;
        } catch (error) {
            console.error('Preload: Failed to get OS username:', error);
            return null;
        }
    }
});
