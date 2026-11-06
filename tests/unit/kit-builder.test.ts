import { describe, expect, it } from 'vitest';
import { normalizeBuilder } from '../../adapter/src/utils/builder.js';
import { getNodeHandlerMjs, getPhpProxy } from '../../adapter/src/runtime/js-ssr-templates.js';
import { REMOTE_FUNCTION_FILE_RE } from '../../adapter/src/utils/guards.js';

describe('Kit builder compatibility', () => {
	it('strips a complete base segment for local prerender handling and proxies mutative requests', () => {
		const proxy = getPhpProxy('http://127.0.0.1:3000', '/sites/cos');
		expect(proxy).toContain("strpos($path, $base . '/') === 0");
		expect(proxy).toContain("if (!$hasBody && ($localPath === '/'");
	});
	it('keeps Kit 3 remote runes modules inside the unsupported-feature guard', () => {
		expect(REMOTE_FUNCTION_FILE_RE.test('query.remote.svelte.ts')).toBe(true);
		expect(REMOTE_FUNCTION_FILE_RE.test('query.remote.js')).toBe(true);
		expect(REMOTE_FUNCTION_FILE_RE.test('ordinary.svelte.ts')).toBe(false);
	});
	it('retains the Kit 2 builder and nested configuration', () => {
		const builder = { config: { kit: { paths: { base: '/sites/cos' } } } };
		expect(normalizeBuilder(builder)).toBe(builder);
	});
	it('normalizes Kit 3 config without mutating its builder or losing method context', () => {
		const config = Object.freeze({
			paths: { base: '/sites/cos' },
			files: { routes: 'src/marketing' }
		});
		const builder = Object.freeze({
			config,
			getBuildDirectory: () => '.svelte-kit',
			generateServerInstance() {
				return this.getBuildDirectory();
			}
		});
		const normalized = normalizeBuilder(builder);
		expect(normalized.config.kit).toBe(config);
		expect(builder.config).toBe(config);
		expect(normalized.generateServerInstance?.('instance.js')).toBe('.svelte-kit');
	});
	it('does not invoke the deprecated Kit 3 config.kit compatibility getter', () => {
		const config = { paths: { base: '/base' }, files: { routes: 'src/marketing' } };
		Object.defineProperty(config, 'kit', {
			get() {
				throw new Error('Deprecated config.kit getter invoked');
			}
		});
		const normalized = normalizeBuilder({ config });
		expect(normalized.config.kit).toBe(config);
		expect(normalized.config.kit.paths.base).toBe('/base');
	});
	it('uses generated server instance on Kit 3 and retains Kit 2 bootstrap', () => {
		expect(getNodeHandlerMjs('', true)).toContain("import { server } from './instance.js'");
		expect(getNodeHandlerMjs('', true)).not.toContain('new Server');
		expect(getNodeHandlerMjs()).toContain('new Server(manifest)');
		expect(getNodeHandlerMjs('', true)).toContain('Readable.toWeb(createReadStream');
	});
});
