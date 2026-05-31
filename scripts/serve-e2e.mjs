import { spawn } from 'node:child_process';
import http from 'node:http';
import { getBasePath, normalizeAdapterMode } from './utils/config.mjs';

const BASE = getBasePath();
const BASE_PREFIX = BASE === '/' ? '' : BASE;

// Standard E2E Configuration
const CONFIGS = [
    {
        name: 'php-static',
        script: 'scripts/serve-php-static.ts',
        args: [],
        env: {
            E2E_PHP_PORT: '8086',
            ADAPTER_OUT: 'build-e2e-php-static',
            SK_BASE_PATH: BASE
        },
        // Probe /status?code=200 to ensure routing and data-bridge are alive
        checkUrl: `http://127.0.0.1:8086${BASE_PREFIX}/status?code=200`
    },
    {
        name: 'js-ssr-root',
        script: 'tools/serve-js-ssr.ts',
        args: [],
        env: {
            PORT: '3001',
            PHP_PORT: '8087',
            ADAPTER_OUT: 'build-e2e-js-ssr-root',
            SK_BASE_PATH: ''
        },
        // Probe /ssr-data to ensure SSR + Sidecar bridge are alive
        checkUrl: 'http://127.0.0.1:8087/ssr-data'
    },
    {
        name: 'js-ssr-subdir',
        script: 'tools/serve-js-ssr.ts',
        args: [],
        env: {
            PORT: '3002',
            PHP_PORT: '8088',
            ADAPTER_OUT: 'build-e2e-js-ssr-subdir',
            SK_BASE_PATH: BASE
        },
        // Probe /ssr-data to ensure SSR + Sidecar bridge are alive in subdir
        checkUrl: `http://127.0.0.1:8088${BASE_PREFIX}/ssr-data`
    }
];

const children = [];

// Filter configs based on ADAPTER_MODE env (if set)
const targetMode = process.env.ADAPTER_MODE ? normalizeAdapterMode(process.env.ADAPTER_MODE) : undefined;
let activeConfigs = CONFIGS;
if (targetMode === 'php-static') {
    activeConfigs = CONFIGS.filter(c => c.name === 'php-static');
} else if (targetMode === 'js-ssr') {
    activeConfigs = CONFIGS.filter(c => c.name.startsWith('js-ssr'));
}

function checkUrl(url) {
    return new Promise((resolve) => {
        const req = http.get(url, (res) => {
            // We accept 200, 301, 308, 404 (means server is up, even if path missing)
            if (res.statusCode >= 200 && res.statusCode < 500) {
                resolve(true);
            } else {
                resolve(false);
            }
            res.resume(); // consume body
        });
        req.on('error', () => resolve(false));
        req.setTimeout(500, () => {
            req.destroy();
            resolve(false);
        });
    });
}

async function waitForServer(name, url, timeoutMs = 15000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
        const up = await checkUrl(url);
        if (up) {
            console.log(`✓ [${name}] is ready at ${url}`);
            return true;
        }
        await new Promise(r => setTimeout(r, 500));
    }
    console.error(`✗ [${name}] failed to start at ${url} within ${timeoutMs}ms`);
    return false;
}

console.log('🚀 Starting E2E Servers...');
if (targetMode) console.log(`Mode filtered: ${targetMode}`);

for (const cfg of activeConfigs) {
    console.log(`\n[${cfg.name}] Starting...`);
    // Use 'inherit' for stderr to see errors, but maybe 'pipe' for stdout to reduce noise?
    // User requested "Doesn't deadlock on stdout buffering".
    // 'inherit' avoids buffering issues.
    const proc = spawn('bun', [cfg.script, ...cfg.args], {
        stdio: 'inherit',
        env: {
            ...process.env,
            ...cfg.env
        }
    });
    children.push(proc);
}

// Wait for all servers
Promise.all(activeConfigs.map(cfg => waitForServer(cfg.name, cfg.checkUrl)))
    .then((results) => {
        if (results.some(r => !r)) {
            console.error('\n🛑 Some servers failed to start. Exiting.');
            cleanup();
            process.exit(1);
        }
        console.log('\n✅ All servers ready! Press Ctrl+C to stop.');
    });

const cleanup = () => {
    console.log('\n🛑 Shutting down E2E servers...');
    children.forEach(proc => {
        if (!proc.killed) {
            proc.kill(); // SIGTERM
            // On Windows, child processes might need tree kill, but Bun/Node usually handles direct children.
            // If they spawned grandchild processes (php, node), those might linger.
            // serve-php-static.ts and serve-js-ssr.ts have their own cleanup handlers.
        }
    });
    process.exit();
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
// Don't use process.on('exit') to kill, as it might be too late or redundant with signal handlers.

// Keep alive
setInterval(() => { }, 10000);
