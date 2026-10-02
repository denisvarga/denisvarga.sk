import './styles/fonts.css';
import './styles/tokens.css';
import './styles/global.css';
import './styles/reveal.css';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { App } from './app';

const root = document.getElementById('root');
if (!root) throw new Error('#root is missing from index.html');

const app = <App lang={document.documentElement.lang === 'en' ? 'en' : 'sk'} />;

// Prerendered pages carry markup in #root; the dev server serves the bare template.
if (root.firstElementChild) {
  hydrateRoot(root, app, {
    onRecoverableError: (error) => console.error('hydration_recoverable_error', error),
  });
} else {
  createRoot(root).render(app);
}
