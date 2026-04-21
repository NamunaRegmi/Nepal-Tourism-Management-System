import { useEffect, useRef } from 'react';

/** Fired in this tab when shared backend data may have changed */
export const APP_DATA_CHANGED = 'ttms-app-data-changed';

const REVISION_KEY = 'ttms_data_revision';

function bumpRevision() {
  try {
    localStorage.setItem(REVISION_KEY, String(Date.now()));
  } catch {
    /* private mode / quota */
  }
}

/**
 * Call after any mutation that other roles or browse pages should reflect
 * (bookings, hotels, rooms, admin user delete, etc.).
 */
export function notifyAppDataChanged() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(APP_DATA_CHANGED));
  bumpRevision();
}

/**
 * Refetch when: another part of the app notifies, another tab bumps revision,
 * or this tab becomes visible again (e.g. returning from another app).
 */
export function useAppDataSync(refetch) {
  const refetchRef = useRef(refetch);
  const debounceRef = useRef(null);

  useEffect(() => {
    refetchRef.current = refetch;
  }, [refetch]);

  useEffect(() => {
    const schedule = () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        debounceRef.current = null;
        refetchRef.current?.();
      }, 120);
    };

    const onCustom = () => schedule();

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        refetchRef.current?.();
      }
    };

    const onStorage = (e) => {
      if (e.key === REVISION_KEY) schedule();
    };

    window.addEventListener(APP_DATA_CHANGED, onCustom);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('storage', onStorage);

    return () => {
      window.removeEventListener(APP_DATA_CHANGED, onCustom);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('storage', onStorage);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);
}
