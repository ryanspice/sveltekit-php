import { describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fixture, port, start } from '../helpers/runtime-security';
import { getPhpProxy } from '../../adapter/src/runtime/js-ssr-templates';

const php = execFileSync('php', ['-n', '-r', 'echo PHP_BINARY;'], { encoding: 'utf8' }).trim();
const extensionDir = path.join(path.dirname(php), 'ext');
const transports = ['stream', ...(existsSync(path.join(extensionDir, 'php_curl.dll')) ? ['curl'] : [])];

async function proxyFixture(base = '', transport = 'stream', ini: string[] = [], env: NodeJS.ProcessEnv = {}, before = '') {
	const f = fixture();
	writeFileSync(path.join(f.root, 'capture.mjs'), `
import { createServer } from 'node:http';
import { Readable } from 'node:stream';
import { appendFileSync } from 'node:fs';
createServer(async (req,res) => {
 if (req.url === '/__health') { res.end('ok'); return; }
 appendFileSync(new URL('./dispatched.marker', import.meta.url), 'executed');
 const request = new Request('http://capture.test'+req.url,{method:req.method,headers:req.headers,body:Readable.toWeb(req),duplex:'half'});
 try {
  let body;
  if (req.url.includes('/raw')) body = { raw:Buffer.from(await request.arrayBuffer()).toString('base64') };
  else { body=[]; for(const [name,value] of await request.formData()) body.push([name,typeof value==='string'?value:{filename:value.name,type:value.type,size:value.size,base64:Buffer.from(await value.arrayBuffer()).toString('base64')}]); }
  res.setHeader('Content-Type','application/json');res.end(JSON.stringify({body,url:req.url,contentType:req.headers['content-type'],contentLength:req.headers['content-length'],origin:req.headers.origin}));
 } catch(error) { res.statusCode=500;res.end(String(error)); }
}).listen(Number(process.env.PORT),'127.0.0.1');`);
	const upstream = `http://127.0.0.1:${await port()}`;
	await start(f, process.execPath, ['capture.mjs'], upstream, { PORT: upstream.split(':').at(-1) });
	mkdirSync(path.join(f.root, '_runtime'));
	writeFileSync(path.join(f.root, '_runtime/compat.php'), '<?php');
	writeFileSync(path.join(f.root, 'index.php'), `<?php header('X-Test-Transport: ' . (function_exists('curl_init') ? 'curl' : 'stream')); ${before} ?>` + getPhpProxy(upstream, base));
	const origin = `http://127.0.0.1:${await port()}`;
	const args = ['-n', '-d', 'display_errors=0', ...(transport === 'curl' ? ['-d', `extension_dir=${extensionDir}`, '-d', 'extension=curl'] : []), ...ini.flatMap(value => ['-d', value]), '-S', origin.slice(7), '-t', f.root, 'index.php'];
	await start(f, php, args, origin, { PHP_SIDECAR_URL: upstream, SK_ORIGIN: origin, MAX_BODY_BYTES: '10485760', ...env });
	return { ...f, origin, base, transport };
}

type Part = { name: string; value: string | Buffer; filename?: string; type?: string };
function multipart(parts: Part[], boundary = 'test-boundary', closing = true) {
	const chunks: Buffer[] = [];
	for (const part of parts) {
		chunks.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${part.name}"${part.filename !== undefined ? `; filename="${part.filename}"` : ''}\r\n${part.type ? `Content-Type: ${part.type}\r\n` : ''}\r\n`));
		chunks.push(Buffer.from(part.value));
		chunks.push(Buffer.from('\r\n'));
	}
	if (closing) chunks.push(Buffer.from(`--${boundary}--\r\n`));
	return Buffer.concat(chunks);
}
async function post(f: Awaited<ReturnType<typeof proxyFixture>>, body: Buffer, contentType = 'multipart/form-data; boundary=test-boundary', route = '/upload') {
	return fetch(f.origin + f.base + route, { method: 'POST', headers: { 'Content-Type': contentType, Origin: f.origin }, body });
}

describe('PHP multipart proxy forwarding', () => {
	for (const transport of transports) {
		for (const base of ['', '/sites/demo']) {
			it(`${transport} ${base || '/'} preserves parsed fields, nested arrays, binary uploads and empty filenames`, async () => {
				const f = await proxyFixture(base, transport);
				const bytes = Buffer.from([0, 255, 13, 10, 128, 1]);
				const response = await post(f, multipart([
					{ name: 'title', value: 'A title' },
					{ name: 'tags[]', value: 'one' }, { name: 'tags[]', value: 'two' },
					{ name: 'profile[name]', value: 'nested' },
					{ name: 'uploads[docs][]', filename: 'binary.bin', type: 'application/octet-stream', value: bytes },
					{ name: 'uploads[docs][]', filename: 'other.txt', type: 'text/plain', value: 'text' },
					{ name: 'empty', filename: '', type: 'application/octet-stream', value: '' }
				]));
				expect(response.status, await response.clone().text()).toBe(200);
				expect(response.headers.get('x-test-transport')).toBe(transport);
				const data = await response.json();
				expect(data.url).toBe(base + '/upload');
				expect(data.origin).toBe(f.origin);
				expect(data.contentType).toMatch(/^multipart\/form-data; boundary=sk-proxy-/);
				expect(data.body).toContainEqual(['tags[]', 'one']);
				expect(data.body).toContainEqual(['tags[]', 'two']);
				expect(data.body).toContainEqual(['profile[name]', 'nested']);
				expect(data.body).toContainEqual(['uploads[docs][]', { filename: 'binary.bin', type: 'application/octet-stream', size: bytes.length, base64: bytes.toString('base64') }]);
				expect(data.body).toContainEqual(['empty', { filename: '', type: 'application/octet-stream', size: 0, base64: '' }]);
			}, 15000);
		}
	}
	it('forwards available raw multipart bytes unchanged when PHP parsing is disabled', async () => {
		const f = await proxyFixture('', 'stream', ['enable_post_data_reading=0']);
		const body = multipart([{ name: 'same', value: 'one' }, { name: 'same', value: 'two' }]);
		const response = await post(f, body, undefined, '/raw');
		expect(response.status).toBe(200);
		const data = await response.json();
		expect(data.body.raw).toBe(body.toString('base64'));
		expect(data.contentType).toBe('multipart/form-data; boundary=test-boundary');
		expect(Number(data.contentLength)).toBe(body.length);
	}, 15000);
	it('keeps ordinary binary raw bodies byte exact', async () => {
		const f = await proxyFixture();
		const body = Buffer.from([0, 255, 1, 13, 10]);
		const response = await post(f, body, 'application/octet-stream', '/raw');
		expect((await response.json()).body.raw).toBe(body.toString('base64'));
	}, 15000);
	it('parses supported INI size quantities without PHP 8.2 helpers', async () => {
		const f = await proxyFixture('', 'stream', [], {}, `if ($_SERVER['REQUEST_URI'] === '/quantity') { header('Content-Type: application/json'); echo json_encode(array_map('sk_proxy_ini_bytes', ['0', '-1', '1K', '2M', '3G', '999999999999999999999G'])); exit; }`);
		const response = await fetch(f.origin + '/quantity');
		expect(await response.json()).toEqual([0, 0, 1024, 2097152, 3221225472, Number('9223372036854775807')]);
	}, 15000);
	it('escapes parsed field and filename header parameters without changing file bytes', async () => {
		const before = `if (isset($_FILES['file'])) { $_POST["field\\\"\\\\\\r\\nInjected"] = 'literal'; $_FILES['file']['name'] = "quote\\\"slash\\\\\\r\\n.bin"; }`;
		const f = await proxyFixture('', 'stream', [], {}, before);
		const response = await post(f, multipart([{ name: 'file', filename: 'safe.bin', type: 'application/octet-stream', value: 'bytes' }]));
		expect(response.status, await response.clone().text()).toBe(200);
		const data = await response.json();
		expect(data.body).toContainEqual(['field%22%5C%0D%0AInjected', 'literal']);
		expect(data.body).toContainEqual(['file', { filename: 'quote%22slash%5C%0D%0A.bin', type: 'application/octet-stream', size: 5, base64: Buffer.from('bytes').toString('base64') }]);
	}, 15000);
	it('rejects an empty raw multipart request when PHP parsing is disabled', async () => {
		const f = await proxyFixture('', 'stream', ['enable_post_data_reading=0']);
		const response = await post(f, Buffer.alloc(0));
		expect(response.status).toBe(400);
		expect(existsSync(path.join(f.root, 'dispatched.marker'))).toBe(false);
	}, 15000);
	it('rejects an empty multipart POST instead of synthesizing a valid form', async () => {
		const f = await proxyFixture();
		const response = await post(f, Buffer.alloc(0));
		expect(response.status).toBe(400);
		expect(existsSync(path.join(f.root, 'dispatched.marker'))).toBe(false);
	}, 15000);
	it('rejects an empty non-POST multipart request before upstream dispatch', async () => {
		const f = await proxyFixture();
		const response = await fetch(f.origin + '/upload', { method: 'PUT', headers: { 'Content-Type': 'multipart/form-data; boundary=test-boundary', Origin: f.origin }, body: Buffer.alloc(0) });
		expect(response.status).toBe(400);
		expect(existsSync(path.join(f.root, 'dispatched.marker'))).toBe(false);
	}, 15000);
	it('rejects a parsed file whose temporary path is not an actual uploaded file', async () => {
		const before = `if ($_SERVER['REQUEST_METHOD'] === 'POST') $_FILES = ['file' => ['name' => 'unsafe.txt', 'type' => 'text/plain', 'tmp_name' => __FILE__, 'error' => UPLOAD_ERR_OK, 'size' => 123]];`;
		const f = await proxyFixture('', 'stream', [], {}, before);
		const response = await post(f, multipart([{ name: 'field', value: 'one' }]));
		expect(response.status).toBe(400);
		expect(existsSync(path.join(f.root, 'dispatched.marker'))).toBe(false);
	}, 15000);
	it('rejects an explicit zero proxy limit instead of using the default', async () => {
		const f = await proxyFixture('', 'stream', [], { MAX_BODY_BYTES: '0' });
		const response = await post(f, multipart([{ name: 'field', value: 'one' }]));
		expect(response.status).toBe(500);
		expect(await response.text()).toBe('Invalid MAX_BODY_BYTES');
		expect(existsSync(path.join(f.root, 'dispatched.marker'))).toBe(false);
	}, 15000);
	for (const scenario of ['proxy-limit', 'rebuilt-limit', 'post-limit', 'upload-limit', 'input-vars', 'partial-upload', 'missing-boundary']) {
		it(`rejects ${scenario} before the Node request handler`, async () => {
			const ini = scenario === 'post-limit' ? ['post_max_size=100'] : scenario === 'upload-limit' ? ['upload_max_filesize=4'] : scenario === 'input-vars' ? ['max_input_vars=1'] : [];
			const env = { MAX_BODY_BYTES: scenario === 'proxy-limit' ? '32' : '10485760' };
			let body = multipart([{ name: 'one', value: 'one' }, { name: 'two', value: 'two' }]);
			let type = 'multipart/form-data; boundary=test-boundary';
			if (scenario === 'upload-limit' || scenario === 'partial-upload') body = multipart([{ name: 'file', filename: 'binary.bin', type: 'application/octet-stream', value: Buffer.alloc(32) }], 'test-boundary', scenario !== 'partial-upload');
			if (scenario === 'missing-boundary') type = 'multipart/form-data';
			if (scenario === 'rebuilt-limit') {
				body = multipart([{ name: 'one', value: 'one' }], 'b'); type = 'multipart/form-data; boundary=b';
				env.MAX_BODY_BYTES = String(body.length + 10);
			}
			const f = await proxyFixture('', 'stream', ini, env);
			const response = await post(f, body, type);
			expect(response.status, await response.clone().text()).toBe(['proxy-limit', 'rebuilt-limit', 'post-limit', 'upload-limit'].includes(scenario) ? 413 : 400);
			expect(existsSync(path.join(f.root, 'dispatched.marker'))).toBe(false);
		}, 15000);
	}
});
