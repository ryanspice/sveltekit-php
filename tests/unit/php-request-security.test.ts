import { describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import { getPhpRequestSecurity } from '../../adapter/src/runtime/php-templates';

function runSecurityProbe(source: string, env: NodeJS.ProcessEnv = {}) {
	const result = spawnSync(
		'php',
		['-n', '-d', 'disable_functions=ctype_digit', '-r', getPhpRequestSecurity() + source],
		{
			encoding: 'utf8',
			env: { ...process.env, SK_BODY_SIZE_LIMIT: '', ...env }
		}
	);
	expect(result.error).toBeUndefined();
	expect(result.status, result.stderr || result.stdout).toBe(0);
	return result.stdout;
}

describe('PHP request security without the optional ctype extension', () => {
	it('accepts the default body limit when ctype_digit is unavailable', () => {
		const result = runSecurityProbe(`
echo json_encode(['ctypeAvailable' => function_exists('ctype_digit'), 'body' => sk_read_limited_body()]);
`);
		expect(JSON.parse(result)).toEqual({ ctypeAvailable: false, body: '' });
	});

	it.each([
		['1', '203.0.113.2'],
		['2', '203.0.113.1'],
		['02', '203.0.113.1'],
		['3', '127.0.0.1'],
		['-1', '127.0.0.1'],
		['+1', '127.0.0.1'],
		[' 1', '127.0.0.1'],
		['1\n', '127.0.0.1'],
		['1.0', '127.0.0.1'],
		['1e0', '127.0.0.1'],
		['١', '127.0.0.1']
	])(
		'validates trusted forwarded depth %j before selecting a client address',
		(depth, expected) => {
			const result = runSecurityProbe(
				`
$_SERVER['REMOTE_ADDR'] = '127.0.0.1';
$_SERVER['HTTP_X_FORWARDED_FOR'] = '203.0.113.1, 203.0.113.2';
echo sk_client_address();
`,
				{
					SK_TRUSTED_PROXY_HEADERS: 'true',
					SK_TRUSTED_PROXY_IPS: '127.0.0.1',
					SK_XFF_DEPTH: depth
				}
			);
			expect(result).toBe(expected);
		}
	);

	it.each(['', '-1', '+1', ' 1', '1\n', '1.0', '1e0', '١'])(
		'rejects malformed content length %j before reading a body',
		(length) => {
			const result = runSecurityProbe(
				`
register_shutdown_function(function () { echo ':' . http_response_code(); });
$_SERVER['CONTENT_LENGTH'] = getenv('FIXTURE_CONTENT_LENGTH');
sk_read_limited_body();
echo 'body read';
`,
				{ FIXTURE_CONTENT_LENGTH: length }
			);
			expect(result).toBe('Payload Too Large:413');
		}
	);
});
