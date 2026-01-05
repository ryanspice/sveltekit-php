import { spawn } from "node:child_process";
import { watch } from "node:fs";
import { resolve } from "node:path";

const PORT = process.env.PHP_PORT ?? "8080";
const HOST = process.env.PHP_HOST ?? "127.0.0.1";
const ROUTER = process.env.PHP_ROUTER ?? "router.php";

// What to rebuild. Adjust if your adapter uses other dirs.
const WATCH_DIRS = ["src", "adapter/src", "static", "svelte.config.js"];

let building = false;
let pending = false;
let phpProc = null;
let viteProc = null;

function run(cmd, args, opts = {}) {
  // Use bun if available, otherwise fallback (though we'll assume bun since user uses it)
  // But standard node spawn is fine.
  return spawn(cmd, args, { stdio: "inherit", shell: process.platform === "win32", ...opts });
}

function buildOnce() {
  return new Promise((resolveBuild, rejectBuild) => {
    // We use `bun run build` which triggers `vite build`
    // Ensure `build:adapter` is run first or as part of build if needed.
    // The user's prompt implies `svelte-kit build` or similar.
    // Let's stick to the user's explicit request: "bun run build" inside this script
    // Wait, the user prompt code says: run("bun", ["run", "build"])
    const p = run("bun", ["run", "build"]);
    console.log('[dev-php] build process started pid:', p.pid);
    p.on("exit", (code) => {
      console.log('[dev-php] build process exited with code:', code);
      (code === 0 ? resolveBuild() : rejectBuild(new Error(`build failed ${code}`)))
    });
    p.on("error", (err) => {
      console.error('[dev-php] build process error:', err);
    });
  });
}

async function rebuildDebounced() {
  if (building) {
    pending = true;
    return;
  }
  building = true;

  try {
    console.log('\n[dev-php] 🔄 Rebuilding...');
    // We also need to make sure the adapter is built if it's not part of the standard build script yet
    // The user's package.json has "build": "vite build".
    // "build:adapter" is separate.
    // We should probably run both or ensure "build" runs both.
    // For now, let's run build:adapter then build to be safe, or just follow the prompt's simplicity.
    // The prompt just said `run("bun", ["run", "build"])`.
    // I'll stick to that, but I'll add `build:adapter` to the `build` script in package.json later.
    await buildOnce();
    console.log('[dev-php] ✅ Build complete');
  } catch (e) {
    // Keep PHP server running on last good build.
    console.error("\n[dev-php] ❌ Build failed, serving last successful build\n");
  } finally {
    building = false;
    if (pending) {
      pending = false;
      setTimeout(rebuildDebounced, 50);
    }
  }
}

function startPhp() {
  // -t build tells PHP to serve from the build directory
  // router.php is usually at root or build/router.php depending on adapter
  // The adapter outputs to `build`.
  // The verification script uses: `php -S ... -t build router.php` (implicit relative to root?)
  // Wait, verify script: `spawn('php', ['-S', '127.0.0.1:8086', '-t', 'build', 'router.php']`
  // This implies router.php is inside `build/`.
  // Let's verify where router.php ends up.
  // The adapter writes to `outDir` which is `build`.
  // BUT, does it write a `router.php`?
  // Looking at `adapter/index.ts`, it writes `__data.php`, `__action.php`, `index.php` (for routes).
  // It DOES NOT seem to write a global `router.php`.
  // The verification script might be relying on a `router.php` that exists in the project root?
  // Let's check if `router.php` exists in root.
  // If not, we might need to rely on `index.php` handling or SvelteKit's routing logic.
  // Actually, standard PHP server needs a router script for SPA/rewrites if not using .htaccess.

  // Checking verify script again: `spawn('php', ... 'router.php')`
  // It expects `router.php` in CWD (project root).

  phpProc = run("php", ["-S", `${HOST}:${PORT}`, "-t", "build", ROUTER], {
    env: { ...process.env, APP_ENV: 'dev' }
  });
}

function startVite() {
  console.log('[dev-php] starting Vite dev server...');
  viteProc = run("bun", ["run", "dev:vite"]);
}

function shutdown() {
  if (phpProc) phpProc.kill("SIGTERM");
  if (viteProc) viteProc.kill("SIGTERM");
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

// Initial start
(async () => {
  console.log(`[dev-php] initial build…`);
  try {
    // Ensure adapter is built first since we are dev-ing the adapter too
    await new Promise((resolve, reject) => {
      const p = run("bun", ["run", "build:adapter"]);
      p.on("exit", code => code === 0 ? resolve() : reject(new Error("Adapter build failed")));
    });
    await buildOnce();
    console.log('[dev-php] ✅ Build complete');
  } catch (e) {
    console.error("[dev-php] Initial build failed. Waiting for changes...");
  }

  console.log(`[dev-php] starting PHP server at http://${HOST}:${PORT}`);
  startPhp();
  startVite();

  let t = null;
  for (const dir of WATCH_DIRS) {
    const abs = resolve(dir);
    try {
      watch(abs, { recursive: true }, () => {
        clearTimeout(t);
        t = setTimeout(rebuildDebounced, 120);
      });
    } catch {
      // Some platforms/filesystems don't support recursive watch everywhere.
      // It's dev; humans can survive occasional manual rebuilds.
    }
  }

  console.log(`[dev-php] 👀 Watching for changes in ${WATCH_DIRS.join(", ")}...`);
})();
