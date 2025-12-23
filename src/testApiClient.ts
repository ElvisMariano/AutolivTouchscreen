/**
 * Script de teste do API Client
 * Testa a conexão e chamadas básicas aos endpoints
 */

import * as api from './services/api';

async function testApiClient() {
    console.log('🧪 Testando API Client...\n');

    try {
        // Teste 1: Buscar plantas
        console.log('1️⃣ Testando GET /api/plants...');
        const plants = await api.plants.getPlants();
        console.log(`✅ ${plants.length} plantas encontradas`);
        if (plants.length > 0) {
            console.log('   Primeira planta:', plants[0].name);
        }

        // Teste 2: Buscar linhas
        console.log('\n2️⃣ Testando GET /api/lines...');
        const lines = await api.lines.getLines();
        console.log(`✅ ${lines.length} linhas encontradas`);
        if (lines.length > 0) {
            console.log('   Primeira linha:', lines[0].name);
        }

        // Teste 3: Buscar estações
        console.log('\n3️⃣ Testando GET /api/stations...');
        const stations = await api.stations.getStations();
        console.log(`✅ ${stations.length} estações encontradas`);
        if (stations.length > 0) {
            console.log('   Primeira estação:', stations[0].name);
        }

        // Teste 4: Buscar documentos
        console.log('\n4️⃣ Testando GET /api/documents...');
        const documents = await api.documents.getDocuments();
        console.log(`✅ ${documents.length} documentos encontrados`);

        // Teste 5: Testar conexão L2L
        console.log('\n5️⃣ Testando GET /api/l2l/test-connection...');
        const l2lStatus = await api.l2l.testL2LConnection();
        console.log(`✅ L2L Status:`, l2lStatus);

        console.log('\n🎉 Todos os testes passaram!');

    } catch (error: any) {
        console.error('\n❌ Erro no teste:', error.message);
        console.error('Stack:', error.stack);
    }
}

// Executar apenas se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
    testApiClient();
}

export { testApiClient };
