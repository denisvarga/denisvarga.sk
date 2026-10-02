import './styles/fonts.css';
import './styles/tokens.css';
import './styles/global.css';
import './styles/reveal.css';
// 404.html is static and links this same stylesheet, so its styles must be in the client graph.
import './not-found/not-found.css';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { App } from './app';
import { logConsoleGreeting } from './lib/console-greeting';

const root = document.getElementById('root');
if (!root) throw new Error('#root is missing from index.html');

const lang = document.documentElement.lang === 'en' ? 'en' : 'sk';
const app = <App lang={lang} />;

// Prerendered pages carry markup in #root; the dev server serves the bare template.
if (root.firstElementChild) {
  hydrateRoot(root, app, {
    onRecoverableError: (error) => console.error('hydration_recoverable_error', error),
  });
} else {
  createRoot(root).render(app);
}

logConsoleGreeting(lang);
