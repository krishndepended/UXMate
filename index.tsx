import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

declare global {
  interface Window {
    __uxmate_root__?: Root;
  }
}

const root = window.__uxmate_root__ ?? createRoot(rootElement);
window.__uxmate_root__ = root;

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      // Ignore if dev/preview environment restricts service workers
    });
  });
}
