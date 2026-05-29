import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Register offline progressive web app service worker
if ('serviceWorker' in navigator) {
  if ((import.meta as any).env.DEV) {
    // Unregister any stale service workers in development to prevent module caching issues
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister().then(() => {
          console.log('[Service Worker] Unregistered stale service worker in development');
        });
      }
    });
    // Clear any cached development assets to avoid react hook conflicts
    if (window.caches) {
      caches.keys().then((keys) => {
        keys.forEach((key) => {
          caches.delete(key).then(() => {
            console.log('[Cache] Cleared stale cache key:', key);
          });
        });
      });
    }
  } else {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => {
          console.log('[Service Worker] Registration successful with scope:', reg.scope);
        })
        .catch((err) => {
          console.error('[Service Worker] Registration failed:', err);
        });
    });
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
