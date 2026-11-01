import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { ErrorBoundary } from './ui/ErrorBoundary';
import '@fontsource/inter/400.css';
import '@fontsource/inter/400-italic.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/oswald/600.css';
import '@fontsource/oswald/700.css';
import '@fontsource/graduate/400.css';
import '@fontsource/yellowtail/400.css';
import './styles/classical.css';
import './styles/app.css';
import './styles/hover.css';

// Offline play: the service worker (pwa/sw-template.js, written by the build) keeps a full copy of the game.
// A new version (2026-11-01): checked when the game opens, every 20 minutes and whenever you come back to the tab;
// once it has installed and taken over, the page still runs the old version, so it says so ('bm-update', UpdateBanner).
if (import.meta.env.PROD && 'serviceWorker' in navigator) window.addEventListener('load', () => {
  const sw = navigator.serviceWorker, had = !!sw.controller; // the very first install isn't an update
  sw.addEventListener('controllerchange', () => { if (had) window.dispatchEvent(new Event('bm-update')); });
  sw.register('./sw.js').then(reg => {
    const check = () => reg.update().catch(() => {});
    setInterval(check, 20 * 60 * 1000);
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') check(); });
  }).catch(() => {});
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary full><App /></ErrorBoundary>
  </StrictMode>,
);
