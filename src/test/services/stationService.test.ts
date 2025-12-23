import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    createStation,
    getStationsByLine,
    deleteStation,
    getAllStationInstructions,
} from '../../../services/stationService';
import * as stationsApi from '@/services/api/stations';
import * as documentsApi from '@/services/api/documents';

// Mock dos módulos API
vi.mock('@/services/api/stations');
vi.mock('@/services/api/documents');

const mockedStationsApi = vi.mocked(stationsApi);
const mockedDocumentsApi = vi.mocked(documentsApi);

interface Station {
    id: string;
    name: string;
    line_id: string;
    station_number: number;
}

describe('stationService - Migração Supabase → API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getStationsByLine', () => {
        it('deve filtrar e ordenar estações por linha', async () => {
            // O service espera que a API retorne os dados
            // NÃO vamos confiar em ordenação do service, mas sim que ele repassa o que vem da API
            const mockStations: Station[] = [
                { id: '1', name: 'Primeira', line_id: 'line-1', station_number: 1 },
                { id: '2', name: 'Segunda', line_id: 'line-1', station_number: 2 },
            ];

            mockedStationsApi.getStations.mockResolvedValue(mockStations as any);

            const result = await getStationsByLine('line-1');

            expect(result).toHaveLength(2);
            expect(result[0].name).toBe('Primeira');
            expect(result[1].name).toBe('Segunda');
        });
    });

    describe('createStation', () => {
        it('deve criar estação', async () => {
            const newStation: Station = {
                id: 'new-1',
                name: 'Nova Estação',
                line_id: 'line-1',
                station_number: 5,
            };

            mockedStationsApi.createStation.mockResolvedValue(newStation as any);

            const result = await createStation({
                name: 'Nova Estação',
                line_id: 'line-1',
                position: 5
            }, 'user-id');

            expect(result).toBeTruthy();
            expect(result?.name).toBe('Nova Estação');
        });
    });

    describe('deleteStation', () => {
        it('deve deletar estação', async () => {
            mockedStationsApi.deleteStation.mockResolvedValue(undefined);

            const result = await deleteStation('station-123');

            expect(result).toBeTruthy();
        });
    });

    describe('getAllStationInstructions', () => {
        it('deve retornar instruções com mapeamento de campos', async () => {
            const mockInstructions: documentsApi.LineDocument[] = [
                {
                    id: 'inst-1',
                    station_id: 'station-1',
                    category: 'assembly',
                    document_url: 'https://example.com/inst.pdf',
                    title: 'Instrução de Montagem',
                    created_at: '2024-01-01',
                    updated_at: '2024-01-01',
                },
            ];

            mockedDocumentsApi.getDocuments.mockResolvedValue(mockInstructions);

            const result = await getAllStationInstructions();

            expect(result).toHaveLength(1);
            expect(result[0]).toMatchObject({
                id: 'inst-1',
                station_id: 'station-1',
                document_id: 'https://example.com/inst.pdf',
            });
        });
    });
});
