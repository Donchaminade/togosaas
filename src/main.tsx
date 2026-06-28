import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Retire le contenu SEO pré-rendu (statique, injecté au build) avant que
// React ne prenne la main, pour éviter tout doublon visuel à l'hydratation.
document.getElementById('seo-prerender')?.remove();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
