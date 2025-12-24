import { useState, useEffect, useRef } from 'react';

const env = import.meta.env;

const API_BASE_URL = env.VITE_BACKEND_URL || 'http://localhost:3001';

// L2L is now proxied via the Backend
const BASE_URL = API_BASE_URL;


interface PitchData {
    id: number;
    pitch_start: string;
    pitch_end: string;
    product_code: string;
    product_id: number;
    actual: number;
    scrap: number;
}

interface UseHourlyProductionResult {
    production: number | null;
    loading: boolean;
    error: string | null;
    lastUpdated: Date | null;
}

export const useHourlyProduction = (lineExternalId: string | undefined, refreshIntervalSeconds: number = 300): UseHourlyProductionResult => {
    const [production, setProduction] = useState<number | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    // Cache the internal line IDs to avoid repeated calls
    // Map externalId -> internalId
    const lineIdCacheRef = useRef<Record<string, number>>({});

    // Determine site from external ID if possible, or default to 902
    // Assuming default site 902 as per original script
    const SITE_ID = '902';

    const fetchInternalLineId = async (externalId: string): Promise<number | null> => {
        if (lineIdCacheRef.current[externalId]) {
            return lineIdCacheRef.current[externalId];
        }

        try {
            // Frontend calls /api/1.0/lines/ directly relative to BASE_URL (backend)
            // Backend will proxy this to L2L and inject auth
            const targetUrl = new URL('/api/1.0/lines/', BASE_URL);
            targetUrl.searchParams.append('site', SITE_ID);
            targetUrl.searchParams.append('externalid', externalId);

            console.log("🚀 Fetching Internal Line ID from:", targetUrl.toString());

            const response = await fetch(targetUrl.toString());
            if (!response.ok) {
                throw new Error(`HTTP Error ${response.status}`);
            }

            const json = await response.json();
            if (json.success && json.data && json.data.length > 0) {
                const id = json.data[0].id;
                lineIdCacheRef.current[externalId] = id;
                return id;
            }
            return null;
        } catch (err: any) {
            console.error('Error fetching line ID:', err);
            throw err;
        }
    };

    const fetchProduction = async () => {
        if (!lineExternalId) {
            setProduction(null);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const internalId = await fetchInternalLineId(lineExternalId);

            if (!internalId) {
                throw new Error(`Line ID not found for external ID: ${lineExternalId}`);
            }

            // Format date: YYYY-MM-DD HH:00:00
            const now = new Date();
            const pad = (n: number) => (n < 10 ? '0' + n : n);
            const YYYY = now.getFullYear();
            const MM = pad(now.getMonth() + 1);
            const DD = pad(now.getDate());
            const HH = pad(now.getHours());
            const pitchStart = `${YYYY}-${MM}-${DD} ${HH}:00:00`;

            const targetUrl = new URL('/api/1.0/pitches/', BASE_URL);
            // Auth is injected by backend proxy
            targetUrl.searchParams.append('site', SITE_ID);
            targetUrl.searchParams.append('line', internalId.toString());
            targetUrl.searchParams.append('pitch_start', pitchStart);

            const response = await fetch(targetUrl.toString());
            if (!response.ok) {
                throw new Error(`HTTP Error ${response.status}`);
            }

            const json = await response.json();

            if (json.success && json.data && json.data.length > 0) {
                const data = json.data[0] as PitchData;
                // Remove decimal places
                setProduction(Math.floor(data.actual));
            } else {
                // No pitch found for this hour yet (maybe start of hour)
                setProduction(0);
            }
            setLastUpdated(new Date());

        } catch (err: any) {
            setError(err.message || 'Error fetching production data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Reset state when line changes
        setProduction(null);
        setLoading(true);

        fetchProduction();

        // Refresh interval in milliseconds
        const intervalMs = refreshIntervalSeconds * 1000;
        const intervalId = setInterval(fetchProduction, intervalMs);
        return () => clearInterval(intervalId);
    }, [lineExternalId, refreshIntervalSeconds]);

    return { production, loading, error, lastUpdated };
};
