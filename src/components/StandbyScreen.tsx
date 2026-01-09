import React from 'react';
import { useI18n } from '../contexts/I18nContext';
import { useShiftProduction, ShiftProductionData } from '../hooks/useShiftProduction';
import '../styles/StandbyScreen.css';

interface StandbyScreenProps {
    lineId: string;
    lineName: string;
    siteId: string;
    shiftStart: string;
    shiftEnd: string;
    onExit: () => void;
}

const StandbyScreen: React.FC<StandbyScreenProps> = ({
    lineId,
    lineName,
    siteId,
    shiftStart,
    shiftEnd,
    onExit
}) => {
    const { t } = useI18n();
    const { data, loading, error } = useShiftProduction(
        lineId,
        siteId,
        shiftStart,
        shiftEnd,
        60 // Atualizar a cada 60 segundos
    );

    // Current time
    const [currentTime, setCurrentTime] = React.useState(new Date());

    React.useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const formatTime = (date: Date): string => {
        return date.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    return (
        <div className="standby-screen" onClick={onExit}>
            {/* Header */}
            <div className="standby-header">
                <div className="standby-status">
                    <span className="status-indicator"></span>
                    <span className="status-text">{lineName} - {t('standby.lineStatus')}</span>
                </div>
                <div className="standby-time">{formatTime(currentTime)}</div>
            </div>

            {/* Content */}
            <div className="standby-content">
                {loading && !data && (
                    <div className="standby-loading">
                        <div className="spinner"></div>
                        <p>{t('common.loading')}</p>
                    </div>
                )}

                {error && (
                    <div className="standby-error">
                        <p>{t('common.error')}: {error}</p>
                    </div>
                )}

                {data && (
                    <div className="metrics-grid">
                        {/* Target */}
                        <div className="metric-card metric-target">
                            <div className="metric-label">{t('standby.target')}</div>
                            <div className="metric-value">{data.target.toLocaleString('pt-BR')}</div>
                        </div>

                        {/* Actuals */}
                        <div className="metric-card metric-actuals">
                            <div className="metric-label">{t('standby.actuals')}</div>
                            <div className="metric-value">{data.actuals.toLocaleString('pt-BR')}</div>
                        </div>

                        {/* Efficiency */}
                        <div className="metric-card metric-efficiency">
                            <div className="metric-label">{t('standby.efficiency')}</div>
                            <div className="metric-value">{data.efficiency}%</div>
                        </div>

                        {/* Shift Downtime */}
                        <div className="metric-card metric-downtime">
                            <div className="metric-label">{t('standby.shiftDowntime')}</div>
                            <div className="metric-value">{data.downtimeFormatted}</div>
                        </div>
                    </div>
                )}
            </div>

            {/* Hint */}
            <div className="standby-hint">
                {t('standby.tapToReturn')}
            </div>
        </div>
    );
};

export default StandbyScreen;
