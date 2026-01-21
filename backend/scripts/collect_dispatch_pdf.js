const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const fs = require('fs');
const https = require('https');
const l2lApiService = require('../src/services/l2lApiService');

// ID do dispatch solicitado
const DISPATCH_ID = 82195;

async function downloadFile(url, destination) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(destination);
        https.get(url, (response) => {
            if (response.statusCode !== 200) {
                return reject(new Error(`Falha no download. Status Code: ${response.statusCode}`));
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close(resolve);
            });
        }).on('error', (err) => {
            fs.unlink(destination, () => { }); // Delete the file async
            reject(err);
        });
    });
}

function findPdfUrl(data) {
    // Procura recursivamente por URLs que terminam com .pdf ou parecem anexos
    let foundUrl = null;

    JSON.stringify(data, (key, value) => {
        if (typeof value === 'string' && (value.toLowerCase().endsWith('.pdf') || value.includes('attachment'))) {
            console.log(`🔎 Possível URL encontrada na chave '${key}': ${value}`);
            if (!foundUrl && value.startsWith('http')) {
                foundUrl = value;
            }
        }
        return value;
    });

    return foundUrl;
}

async function main() {
    try {
        console.log(`🚀 Iniciando coleta de dados para Dispatch ID: ${DISPATCH_ID}`);

        const siteId = 902;
        console.log(`✅ Usando Site ID fornecido: ${siteId}`);

        // 2. Buscar Dispatch com Site ID
        // Tentativa 4: Usar dispatch_number, pois 82195 parece pequeno para ser ID.
        // Mantemos lastupdated por precaução.
        const data = await l2lApiService.getEventData({
            site: siteId,
            dispatch_number: DISPATCH_ID,
            lastupdated: '2020-01-01 00:00:00'
        });

        if (!data || data.length === 0) {
            console.error('❌ Nenhum dado encontrado para este Dispatch ID.');

            return;
        }

        const dispatchData = data[0]; // Assume que retorna uma lista e queremos o primeiro item

        // Salvar JSON completo
        const jsonFilename = path.join(__dirname, `dispatch_${DISPATCH_ID}.json`);
        fs.writeFileSync(jsonFilename, JSON.stringify(dispatchData, null, 2));
        console.log(`✅ Dados JSON salvos em: ${jsonFilename}`);

        // Tentar encontrar e baixar PDF
        // Nota: A estrutura exata do anexo não foi especificada na documentação fornecida pelo usuário.
        // O código abaixo tenta adivinhar ou encontrar campos comuns.

        // Verificamos campos comuns de anexos ou documentos
        let pdfUrl = findPdfUrl(dispatchData);

        // 3. Explorar Outros Endpoints se URL não encontrada
        // 3. Método Data Export (Recomendado pelo usuário)
        console.log('🚀 Iniciando Data Export do L2L...');

        // Define range de tempo para tentar pegar o dispatch específico
        // Usando lastupdated_since um pouco antes da última atualização conhecida
        const exportParams = {
            site: siteId,
            lastupdated_since: '2026-01-01 00:00:00'
        };

        const exportStart = await l2lApiService.startDispatchExport(exportParams);

        if (!exportStart || !exportStart.jobid) {
            console.error('❌ Falha ao iniciar exportação. Resposta:', exportStart);
            return;
        }

        const jobId = exportStart.jobid;
        console.log(`⏳ Job iniciado. ID: ${jobId}. Aguardando conclusão...`);

        // Polling loop
        let downloadUrl = null;
        let attempts = 0;
        const maxAttempts = 20;

        while (attempts < maxAttempts) {
            await new Promise(r => setTimeout(r, 5000)); // Esperar 5s
            attempts++;

            const statusData = await l2lApiService.getAsyncJobStatus(jobId);
            console.log(`   Tentativa ${attempts}/${maxAttempts}: Status = ${statusData.status}`);

            if (statusData.status === 'finished') {
                downloadUrl = statusData.download_url;
                console.log('✅ Exportação concluída!');
                break;
            } else if (statusData.status === 'failed' || statusData.error) {
                console.error('❌ Job falhou:', statusData.error);
                break;
            }
        }

        if (downloadUrl) {
            console.log(`📥 Baixando arquivo de exportação: ${downloadUrl}`);
            const exportFilename = path.join(__dirname, `export_${jobId}.jsonl`); // Formato provável JSON Lines
            await downloadFile(downloadUrl, exportFilename);
            console.log(`✅ Arquivo salvo: ${exportFilename}`);

            // Ler o arquivo exportado para procurar nosso dispatch
            console.log('🔎 Inspecionando arquivo exportado...');
            const fileContent = fs.readFileSync(exportFilename, 'utf-8');
            const lines = fileContent.split('\n');

            let targetDispatch = null;

            for (const line of lines) {
                if (!line.trim()) continue;
                try {
                    const record = JSON.parse(line);
                    // Verifica ID ou Dispatch Number
                    if (record.dispatchnumber == DISPATCH_ID || record.id == DISPATCH_ID) {
                        targetDispatch = record;
                        console.log('🎯 Dispatch alvo encontrado na exportação!');
                        break;
                    }
                } catch (e) { }
            }

            if (targetDispatch) {
                // Salvar o dispatch encontrado isoladamente
                const targetFilename = path.join(__dirname, `dispatch_${DISPATCH_ID}_export.json`);
                fs.writeFileSync(targetFilename, JSON.stringify(targetDispatch, null, 2));
                console.log(`✅ Dispatch extraído salvo em: ${targetFilename}`);

                // Procurar URL de PDF novamente neste novo objeto
                const pdfUrl = findPdfUrl(targetDispatch);
                if (pdfUrl) {
                    console.log(`🔗 URL encontrada no export: ${pdfUrl}`);
                } else {
                    console.log('⚠️ PDF URL ainda não encontrada explicitamente no export.');
                }
            } else {
                console.log('⚠️ Dispatch alvo NÃO encontrado no range exportado.');
            }

        } else {
            console.error('❌ Timeout ou falha ao obter URL de download.');
        }

    } catch (error) {
        console.error('❌ Erro fatal:', error);
    }
}

main();
