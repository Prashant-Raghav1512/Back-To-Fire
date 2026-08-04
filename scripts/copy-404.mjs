import { copyFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// GitHub Pages is a static host with no server-side rewrites: a direct load
// or refresh of a client-side route (e.g. /contact) has no matching file, so
// GitHub serves its own 404 page instead of ever running our app. GitHub
// Pages does special-case a 404.html at the site root, though — serving it
// (still with a 404 status) for any unmatched path. Making that file an
// exact copy of index.html means the app boots normally and the router
// reads the real intended path from the URL and renders the right page.
const distDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
copyFileSync(join(distDir, 'index.html'), join(distDir, '404.html'));
console.log('Copied dist/index.html -> dist/404.html');
