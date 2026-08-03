import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {registerSW} from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Register the service worker after first paint so it doesn't race WebGL init.
if (import.meta.env.PROD) {
  window.addEventListener(
    'load',
    () => {
      window.setTimeout(() => {
        registerSW({
          immediate: true,
          onRegisterError(error) {
            console.warn('PWA registration failed', error);
          },
        });
      }, 1500);
    },
    {once: true},
  );
}
