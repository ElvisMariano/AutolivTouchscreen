/**
 * API Client - Barrel Export
 * Exporta todos os módulos de API em um único ponto de acesso
 */

export * as plants from './plants';
export * as lines from './lines';
export * as stations from './stations';
export * as documents from './documents';
export * as users from './users';
export * as roles from './roles';
export * as alerts from './alerts';
export * as l2l from './l2l';

// Re-export types
export type { Plant, CreatePlantDTO, UpdatePlantDTO } from './plants';
export type { ProductionLine, CreateLineDTO, UpdateLineDTO } from './lines';
export type { WorkStation, CreateStationDTO, UpdateStationDTO } from './stations';
export type { LineDocument, CreateDocumentDTO, UpdateDocumentDTO, DocumentFilters } from './documents';
export type { User, CreateUserDTO, UpdateUserDTO } from './users';
export type { Role, CreateRoleDTO, UpdateRoleDTO } from './roles';
export type { QualityAlert, CreateAlertDTO, UpdateAlertDTO, AlertFilters } from './alerts';
export type { L2LSyncResult, L2LSyncLog } from './l2l';
