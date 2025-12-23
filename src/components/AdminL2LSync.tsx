/**
 * Painel Administrativo de Sincronização com Leading2Lean (L2L)
 * 
 * @description
 * Interface para gerenciar sincronização de dados com a API L2L,
 * incluindo execução manual, visualização de logs e status.
 */

import React, { useState } from 'react';
import { useL2LSync, useL2LSyncStatus } from '../hooks/useL2LSync';
import { testConnection, getApiConfig } from '../services/l2lApiService';
import { useI18n } from '../contexts/I18nContext';

export const AdminL2LSync: React.FC = () => {
    const { t } = useI18n();
    const {
        syncState,
        lastLog,
        syncHistory,
        syncPlants,
        syncLines,
        syncMachines,
        syncDocuments,
        syncAll,
        clearError,
        isSyncing,
    } = useL2LSync();

    const { lastSync, lastStatus, lastRecords } = useL2LSyncStatus();

    const [testingConnection, setTestingConnection] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');

    const apiConfig = getApiConfig();

    // ========== HANDLERS ==========

    const handleTestConnection = async () => {
        setTestingConnection(true);
        setConnectionStatus('idle');

        try {
            const success = await testConnection();
            setConnectionStatus(success ? 'success' : 'error');
        } catch (error) {
            setConnectionStatus('error');
        } finally {
            setTestingConnection(false);
        }
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'Nunca';
        const date = new Date(dateString);
        return date.toLocaleString('pt-BR');
    };

    const getStatusBadge = (status: string | null) => {
        switch (status) {
            case 'success':
                return <span className="badge badge-success">Sucesso</span>;
            case 'error':
                return <span className="badge badge-error">Erro</span>;
            case 'partial':
                return <span className="badge badge-warning">Parcial</span>;
            default:
                return <span className="badge badge-neutral">Desconhecido</span>;
        }
    };

    return (
        <div className="admin-l2l-sync">
            <h2>🔄 Sincronização Leading2Lean (L2L)</h2>

            {/* Configuração da API */}
            <section className="config-section card">
                <h3>⚙️ Configuração da API</h3>
                <div className="config-info">
                    <div className="info-row">
                        <span className="label">Base URL:</span>
                        <code>{apiConfig.baseUrl}</code>
                    </div>
                    <div className="info-row">
                        <span className="label">API Key Configurada:</span>
                        <span className={apiConfig.hasApiKey ? 'text-success' : 'text-error'}>
                            {apiConfig.hasApiKey ? '✅ Sim' : '❌ Não'}
                        </span>
                    </div>
                </div>

                <button
                    onClick={handleTestConnection}
                    disabled={testingConnection || !apiConfig.hasApiKey}
                    className="btn btn-outline"
                >
                    {testingConnection ? '🔄 Testando...' : '🔌 Testar Conexão'}
                </button>

                {connectionStatus === 'success' && (
                    <div className="alert alert-success">✅ Conexão estabelecida com sucesso!</div>
                )}
                {connectionStatus === 'error' && (
                    <div className="alert alert-error">❌ Falha ao conectar com a API L2L</div>
                )}
            </section>

            {/* Status da Última Sincronização */}
            <section className="status-section card">
                <h3>📊 Status da Última Sincronização</h3>
                {lastSync ? (
                    <div className="status-grid">
                        <div className="status-item">
                            <span className="label">Data/Hora:</span>
                            <span>{formatDate(lastSync)}</span>
                        </div>
                        <div className="status-item">
                            <span className="label">Status:</span>
                            {getStatusBadge(lastStatus)}
                        </div>
                        {lastRecords && (
                            <>
                                <div className="status-item">
                                    <span className="label">Criados:</span>
                                    <span className="badge badge-info">{lastRecords.created}</span>
                                </div>
                                <div className="status-item">
                                    <span className="label">Atualizados:</span>
                                    <span className="badge badge-info">{lastRecords.updated}</span>
                                </div>
                                <div className="status-item">
                                    <span className="label">Desativados:</span>
                                    <span className="badge badge-warning">{lastRecords.deactivated}</span>
                                </div>
                            </>
                        )}
                    </div>
                ) : (
                    <p className="text-muted">Nenhuma sincronização realizada ainda.</p>
                )}
            </section>

            {/* Erros */}
            {syncState.error && (
                <div className="alert alert-error">
                    <strong>❌ Erro:</strong> {syncState.error}
                    <button onClick={clearError} className="btn btn-sm btn-ghost">
                        Limpar
                    </button>
                </div>
            )}

            {/* Sincronização Manual */}
            <section className="sync-actions card">
                <h3>🚀 Sincronização Manual</h3>
                <p className="text-muted">
                    Execute a sincronização manualmente para atualizar os dados do sistema com a API L2L.
                </p>

                <div className="action-grid">
                    <button
                        onClick={syncPlants}
                        disabled={isSyncing}
                        className="btn btn-primary"
                        title="Sincronizar Plants (Sites)"
                    >
                        🏭 Sincronizar Plantas
                    </button>

                    <button
                        onClick={syncLines}
                        disabled={isSyncing}
                        className="btn btn-primary"
                        title="Sincronizar Lines"
                    >
                        🏭 Sincronizar Linhas
                    </button>

                    <button
                        onClick={syncMachines}
                        disabled={isSyncing}
                        className="btn btn-primary"
                        title="Sincronizar Machines (Estações)"
                    >
                        ⚙️ Sincronizar Estações
                    </button>

                    <button
                        onClick={syncDocuments}
                        disabled={isSyncing}
                        className="btn btn-primary"
                        title="Sincronizar Documents"
                    >
                        📄 Sincronizar Documentos
                    </button>

                    <button
                        onClick={syncAll}
                        disabled={isSyncing}
                        className="btn btn-success btn-lg"
                        title="Sincronização Completa"
                    >
                        {isSyncing ? '🔄 Sincronizando...' : '🔄 Sincronizar Tudo'}
                    </button>
                </div>

                {isSyncing && (
                    <div className="progress-bar">
                        <div className="progress-bar-inner animating"></div>
                    </div>
                )}
            </section>

            {/* Histórico de Sincronizações */}
            <section className="history-section card">
                <h3>📜 Histórico de Sincronizações</h3>
                {syncHistory && syncHistory.length > 0 ? (
                    <div className="history-table-container">
                        <table className="history-table">
                            <thead>
                                <tr>
                                    <th>Data/Hora</th>
                                    <th>Tipo</th>
                                    <th>Status</th>
                                    <th>Criados</th>
                                    <th>Atualizados</th>
                                    <th>Desativados</th>
                                    <th>Erros</th>
                                </tr>
                            </thead>
                            <tbody>
                                {syncHistory.map((log: any) => (
                                    <tr key={log.id}>
                                        <td>{formatDate(log.synced_at)}</td>
                                        <td>
                                            <span className="badge badge-neutral">{log.sync_type}</span>
                                        </td>
                                        <td>{getStatusBadge(log.status)}</td>
                                        <td>{log.records_created || 0}</td>
                                        <td>{log.records_updated || 0}</td>
                                        <td>{log.records_deactivated || 0}</td>
                                        <td>
                                            {log.errors && Array.isArray(log.errors) && log.errors.length > 0 ? (
                                                <details>
                                                    <summary className="text-error">
                                                        {log.errors.length} erro(s)
                                                    </summary>
                                                    <ul className="error-list">
                                                        {log.errors.map((error: string, idx: number) => (
                                                            <li key={idx}>{error}</li>
                                                        ))}
                                                    </ul>
                                                </details>
                                            ) : (
                                                <span className="text-success">-</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-muted">Nenhum histórico disponível.</p>
                )}
            </section>

            {/* Aviso Importante */}
            <section className="warning-section card">
                <h4>⚠️ Avisos Importantes</h4>
                <ul className="warning-list">
                    <li>
                        <strong>Backup Recomendado:</strong> Recomenda-se fazer backup do banco de dados
                        antes da primeira sincronização.
                    </li>
                    <li>
                        <strong>Mapeamento via external_id:</strong> A sincronização usa o campo{' '}
                        <code>external_id</code> para mapear entidades entre L2L e o sistema.
                    </li>
                    <li>
                        <strong>Dados Sobrescritos:</strong> Dados locais serão atualizados com informações
                        da API L2L quando houver correspondência de <code>external_id</code>.
                    </li>
                    <li>
                        <strong>Desativação Automática:</strong> Entidades que não existem mais na API L2L
                        serão marcadas como inativas.
                    </li>
                </ul>
            </section>

            <style>{`
                .admin-l2l-sync {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 20px;
                }

                .card {
                    background: white;
                    border-radius: 8px;
                    padding: 20px;
                    margin-bottom: 20px;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                }

                h2 {
                    font-size: 24px;
                    margin-bottom: 20px;
                    color: #2c3e50;
                }

                h3 {
                    font-size: 18px;
                    margin-bottom: 15px;
                    color: #34495e;
                }

                .config-info {
                    margin-bottom: 15px;
                }

                .info-row,
                .status-item {
                    display: flex;
                    justify-content: space-between;
                    padding: 8px 0;
                    border-bottom: 1px solid #ecf0f1;
                }

                .label {
                    font-weight: 600;
                    color: #7f8c8d;
                }

                code {
                    background: #ecf0f1;
                    padding: 2px 6px;
                    border-radius: 4px;
                    font-family: 'Courier New', monospace;
                }

                .action-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 15px;
                    margin-top: 15px;
                }

                .btn {
                    padding: 10px 20px;
                    border: none;
                    border-radius: 6px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .btn-primary {
                    background: #3498db;
                    color: white;
                }

                .btn-primary:hover:not(:disabled) {
                    background: #2980b9;
                }

                .btn-success {
                    background: #27ae60;
                    color: white;
                }

                .btn-success:hover:not(:disabled) {
                    background: #229954;
                }

                .btn-outline {
                    background: white;
                    border: 2px solid #3498db;
                    color: #3498db;
                }

                .btn-lg {
                    grid-column: 1 / -1;
                    font-size: 16px;
                    padding: 15px;
                }

                .badge {
                    padding: 4px 12px;
                    border-radius: 12px;
                    font-size: 12px;
                    font-weight: 600;
                }

                .badge-success {
                    background: #d4edda;
                    color: #155724;
                }

                .badge-error {
                    background: #f8d7da;
                    color: #721c24;
                }

                .badge-warning {
                    background: #fff3cd;
                    color: #856404;
                }

                .badge-info {
                    background: #d1ecf1;
                    color: #0c5460;
                }

                .badge-neutral {
                    background: #e9ecef;
                    color: #495057;
                }

                .alert {
                    padding: 12px 16px;
                    border-radius: 6px;
                    margin: 15px 0;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .alert-success {
                    background: #d4edda;
                    color: #155724;
                }

                .alert-error {
                    background: #f8d7da;
                    color: #721c24;
                }

                .text-success {
                    color: #27ae60;
                }

                .text-error {
                    color: #e74c3c;
                }

                .text-muted {
                    color: #95a5a6;
                }

                .progress-bar {
                    width: 100%;
                    height: 4px;
                    background: #ecf0f1;
                    border-radius: 2px;
                    overflow: hidden;
                    margin-top: 15px;
                }

                .progress-bar-inner {
                    height: 100%;
                    background: #3498db;
                }

                .progress-bar-inner.animating {
                    animation: progress 1.5s ease-in-out infinite;
                }

                @keyframes progress {
                    0% {
                        transform: translateX(-100%);
                    }
                    100% {
                        transform: translateX(400%);
                    }
                }

                .history-table-container {
                    overflow-x: auto;
                }

                .history-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 14px;
                }

                .history-table th,
                .history-table td {
                    padding: 12px;
                    text-align: left;
                    border-bottom: 1px solid #ecf0f1;
                }

                .history-table th {
                    background: #f8f9fa;
                    font-weight: 600;
                    color: #495057;
                }

                .history-table tbody tr:hover {
                    background: #f8f9fa;
                }

                .error-list {
                    margin: 8px 0 0 20px;
                    list-style: disc;
                    color: #e74c3c;
                    font-size: 12px;
                }

                .warning-list {
                    margin: 10px 0 0 20px;
                    list-style: disc;
                }

                .warning-list li {
                    margin-bottom: 10px;
                    color: #7f8c8d;
                }
            `}</style>
        </div>
    );
};
