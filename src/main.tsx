import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const CHUNK_RELOAD_KEY = 'vite-chunk-reload';
const MAX_CHUNK_RELOADS = 2;

window.addEventListener('vite:preloadError', (event) => {
  const retries = Number(sessionStorage.getItem(CHUNK_RELOAD_KEY) ?? '0');
  if (retries >= MAX_CHUNK_RELOADS) {
    sessionStorage.removeItem(CHUNK_RELOAD_KEY);
    return;
  }
  sessionStorage.setItem(CHUNK_RELOAD_KEY, String(retries + 1));
  event.preventDefault();
  window.location.reload();
});

sessionStorage.removeItem(CHUNK_RELOAD_KEY);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <App />
);