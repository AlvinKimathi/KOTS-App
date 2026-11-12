import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Lightweight in-memory cross-device sync endpoint (/api/dev-sync) for local/tunnel PoC demos.
 * Allows phones and laptops connected to the Vite dev server (via LAN or tunnel) to share
 * live scores, clocks, registrations, and random draws in real time even before Supabase is linked.
 */
function devCrossDeviceSyncPlugin(): Plugin {
  let sharedState: unknown = null;
  let sharedAccounts: unknown = null;
  let updatedAt = 0;

  return {
    name: 'kots-dev-cross-device-sync',
    configureServer(server) {
      server.middlewares.use('/api/dev-sync', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'no-store');

        if (req.method === 'GET') {
          res.end(
            JSON.stringify({
              updatedAt,
              state: sharedState,
              accounts: sharedAccounts,
            })
          );
          return;
        }

        if (req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const parsed = JSON.parse(body);
              if (parsed.state) {
                sharedState = parsed.state;
                updatedAt = Date.now();
              }
              if (parsed.accounts) {
                sharedAccounts = parsed.accounts;
                updatedAt = Date.now();
              }
              res.end(JSON.stringify({ ok: true, updatedAt }));
            } catch {
              res.statusCode = 400;
              res.end(JSON.stringify({ ok: false }));
            }
          });
          return;
        }

        res.statusCode = 405;
        res.end(JSON.stringify({ ok: false }));
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), devCrossDeviceSyncPlugin()],
  server: {
    host: true,
    port: 5173,
    allowedHosts: true,
  },
});
