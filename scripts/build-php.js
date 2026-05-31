#!/usr/bin/env node

import { spawn } from 'child_process';
import { resolve } from 'path';
import { config } from 'dotenv';

config();

/**
 * Build script for PHP deployment
 * Runs the full adapter to generate production-ready PHP files
 */

const BUILD_DIR = resolve('build');

console.log('🚀 Building PHP deployment...');

// Run the adapter
const adapterProcess = spawn('node', ['adapter/index.js'], {
	stdio: 'inherit',
	env: { ...process.env, NODE_ENV: 'production' }
});

adapterProcess.on('close', (code) => {
	if (code === 0) {
		console.log('✅ PHP build completed successfully');
		console.log('📁 Files generated in:', BUILD_DIR);
		console.log('');
		const base = process.env.DEPLOY_BASE || '';
		const url = `http://localhost:8000${base}`;
		console.log('🌐 To test locally:');
		console.log('  php -S localhost:8000 -t build router.php');
		console.log(`  Then visit: ${url}`);
		console.log('');
		console.log('🚀 To deploy to Apache:');
		console.log('  1. Upload all files from build/ to your Apache document root');
		console.log('  2. Ensure mod_rewrite is enabled');
		console.log('  3. Check APACHE_DEPLOYMENT.md for detailed instructions');
	} else {
		console.error('❌ PHP build failed with code:', code);
		process.exit(1);
	}
});

adapterProcess.on('error', (err) => {
	console.error('❌ Failed to run adapter:', err);
	process.exit(1);
});
