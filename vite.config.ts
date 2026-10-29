import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

/**
 * Local development has no Cloudflare Worker attached. Answer the two API
 * probes so the checkout cleanly falls back to local-order mode instead of
 * logging 404s in the browser console.
 */
function devApiStub(): Plugin {
  return {
    name: 'tidesmm-dev-api-stub',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        if (!request.url) return next();
        const pathname = new URL(request.url, 'http://localhost').pathname;
        if (pathname === '/api/health') {
          response.statusCode = 200;
          response.setHeader('content-type', 'application/json; charset=utf-8');
          response.end(JSON.stringify({ ok: true, orderChannel: 'none', version: 'dev' }));
          return;
        }
        if (pathname === '/api/orders') {
          response.statusCode = 503;
          response.setHeader('content-type', 'application/json; charset=utf-8');
          response.end(JSON.stringify({ ok: false, error: 'orders_not_configured' }));
          return;
        }
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), devApiStub()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    target: 'es2022',
    sourcemap: false,
  },
});
