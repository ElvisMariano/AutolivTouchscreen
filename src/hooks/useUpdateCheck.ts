import { useEffect, useState } from 'react';

const useUpdateCheck = (intervalMs: number = 60000) => {
  const [hasUpdate, setHasUpdate] = useState(false);
  const [currentVersion, setCurrentVersion] = useState<string | null>(null);
  useEffect(() => {
    let mounted = true;
    const check = async () => {
      try {
        const res = await fetch('/metadata.json?ts=' + Date.now());
        const meta = await res.json();
        const version = meta.version || '0.0.0';
        if (!currentVersion) {
          if (mounted) setCurrentVersion(version);
        } else if (version !== currentVersion) {
          if (mounted) setHasUpdate(true);
        }
      } catch {}
    };
    check();
    const id = setInterval(check, intervalMs);
    return () => { mounted = false; clearInterval(id); };
  }, [intervalMs, currentVersion]);
  return { hasUpdate };
};

export default useUpdateCheck;