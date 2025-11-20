
import React, { useEffect, useRef, useState } from 'react';
import { PowerBiReport as PowerBiReportType } from '../../types';

interface PowerBiReportProps {
    report: PowerBiReportType;
}

const PowerBiReport: React.FC<PowerBiReportProps> = ({ report }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [src, setSrc] = useState(report.embedUrl);
    useEffect(() => {
        const refresh = setInterval(() => {
            const url = new URL(report.embedUrl);
            url.searchParams.set('t', String(Date.now()));
            setSrc(url.toString());
        }, 60000);
        return () => clearInterval(refresh);
    }, [report.embedUrl]);
    useEffect(() => {
        const anyWindow = window as any;
        if (anyWindow.powerbi && containerRef.current) {
            try {
                const config = { type: 'report', embedUrl: report.embedUrl, permissions: anyWindow['powerbi-client']?.models?.Permissions?.All, settings: { filterPaneEnabled: false, navContentPaneEnabled: false } };
                anyWindow.powerbi.embed(containerRef.current, config);
            } catch {}
        }
    }, [report.embedUrl]);
    return (
        <div className="w-full h-full flex flex-col bg-gray-900 rounded-lg overflow-hidden">
            <div className="bg-gray-700 p-3">
                <h3 className="text-xl font-semibold truncate">{report.name}</h3>
            </div>
            <div ref={containerRef} className="w-full h-full flex-1">
                {!((window as any).powerbi) && (
                    <iframe title={report.name} src={src} className="w-full h-full border-0" allowFullScreen={true}></iframe>
                )}
            </div>
        </div>
    );
};

export default PowerBiReport;
