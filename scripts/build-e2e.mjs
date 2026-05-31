import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { getEnvForMode } from './utils/config.mjs';

// Define build configurations
const builds = [
    {
        name: 'php-static',
        mode: 'php-static',
        out: 'build-e2e-php-static',
        base: '/dev/sveltekit',
        fallback: '200.html',
        baseMode: 'fixed'
    },
    {
        name: 'php-static-fallback',
        mode: 'php-static',
        out: 'build-e2e-php-static-fallback',
        base: '/dev/sveltekit',
        fallback: '200.html',
        baseMode: 'fixed'
    },
    {
        name: 'php-static-base-auto',
        mode: 'php-static',
        out: 'build-e2e-php-static-base-auto',
        base: '/test-subdirectory',
        fallback: '200.html',
        baseMode: 'auto'
    },
    {
        name: 'php-static-base-auto-subdir',
        mode: 'php-static',
        out: 'build-e2e-php-static-base-auto-subdir',
        base: '/test-subdirectory',
        fallback: '200.html',
        baseMode: 'auto'
    },
    {
        name: 'js-ssr-root',
        mode: 'js-ssr',
        out: 'build-e2e-js-ssr-root',
        base: '/',
        fallback: '200.html',
        baseMode: 'fixed'
    },
    {
        name: 'js-ssr-subdir',
        mode: 'js-ssr',
        out: 'build-e2e-js-ssr-subdir',
        base: '/dev/sveltekit',
        fallback: '200.html',
        baseMode: 'fixed'
    }
];

// Allow filtering by mode via args (e.g. --mode=php-static)
const args = process.argv.slice(2);
const modeArg = args.find(a => a.startsWith('--mode='))?.split('=')[1];
const basePathArg = args.find(a => a.startsWith('--basePath='))?.split('=')[1];

// Filter builds
let targetBuilds = modeArg ? builds.filter(b => b.mode === modeArg) : builds;

// Apply overrides
if (basePathArg !== undefined) {
    targetBuilds = targetBuilds.map(b => ({
        ...b,
        base: basePathArg
    }));
}

console.log('Building adapter...');
try {
    execSync('bun run build:adapter', { stdio: 'inherit' });
} catch (e) {
    console.error('Adapter build failed');
    process.exit(1);
}

for (const build of targetBuilds) {
    console.log(`\n----------------------------------------`);
    console.log(`Building ${build.name} (${build.mode}, base: ${build.base}, baseMode: ${build.baseMode})...`);
    console.log(`Output: ${build.out}`);
    console.log(`----------------------------------------`);

    // Clean previous build
    if (fs.existsSync(build.out)) {
        fs.rmSync(build.out, { recursive: true, force: true });
    }

    const env = {
        ...getEnvForMode(build.mode, build.base),
        ADAPTER_OUT: build.out,
        ADAPTER_ASSETS: build.out, // Keep assets in build dir for e2e
        ADAPTER_BASE_MODE: build.baseMode,
        ADAPTER_FALLBACK: build.fallback,
        SVELTEKIT_OUTDIR: `.svelte-kit-${build.name}`
    };

    try {
        execSync('bun run build', { stdio: 'inherit', env });
        console.log(`✓ Built ${build.out}`);
    } catch (e) {
        console.error(`✗ Build failed for ${build.mode}`);
        process.exit(1);
    }
}

console.log('\nAll requested builds complete.');
