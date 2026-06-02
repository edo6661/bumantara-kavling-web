import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const RELOAD_FLAG = 'vite-chunk-reloaded-at';
const RELOAD_COOLDOWN_MS = 10_000;

const getMessage = (reason: unknown): string => {
  if (typeof reason === 'string') return reason;
  if (reason instanceof Error) return reason.message;
  return '';
};

const isModuleLoadError = (reason: unknown): boolean => {
  const message = getMessage(reason);
  return (
    message.includes('Failed to fetch dynamically imported module') ||
    message.includes('Importing a module script failed') ||
    message.includes('error loading dynamically imported module')
  );
};

// Reload at most once per cooldown window. This recovers a tab that still holds
// an old index.html (pointing at chunk hashes deleted by a fresh deploy) while
// preventing an infinite reload loop if the new chunk genuinely cannot load.
const reloadOnce = (): void => {
  const last = Number(sessionStorage.getItem(RELOAD_FLAG) ?? '0');
  if (Date.now() - last < RELOAD_COOLDOWN_MS) return;
  sessionStorage.setItem(RELOAD_FLAG, String(Date.now()));
  window.location.reload();
};

// Vite's official signal for a failed lazy/preloaded chunk (most reliable path).
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault(); // suppress the uncaught error whether or not we reload
  reloadOnce();
});

// Safety nets for dynamic-import failures that don't surface as vite:preloadError.
window.addEventListener('unhandledrejection', (event) => {
  if (isModuleLoadError(event.reason)) {
    event.preventDefault();
    reloadOnce();
  }
});

window.addEventListener('error', (event) => {
  if (isModuleLoadError(event.message)) {
    reloadOnce();
  }
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <App />
);
