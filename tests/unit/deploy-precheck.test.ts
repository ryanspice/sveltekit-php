import { beforeEach, describe, expect, it } from 'vitest';
import { assertDeployEnv } from '../../scripts/utils/config.mjs';

type TestEnv = Record<string, string | undefined>;

let testEnv: TestEnv = {};

function setDeployEnv(overrides: Record<string, string | undefined> = {}) {
	testEnv = {
		DEPLOY_HOST: 'deploy-target.local',
		DEPLOY_USER: 'deploy',
		DEPLOY_REMOTE: '/srv/sveltekit-php',
		DEPLOY_LOCAL: 'build',
		DEPLOY_IDENTITY_FILE: '',
		DEPLOY_PORT: '22',
		DEPLOY_PROFILE: '',
		ALPHA_SMOKE_BASE_URL: '',
		...overrides
	};
}

beforeEach(() => {
	setDeployEnv();
});

describe('deploy environment precheck', () => {
	it('accepts concrete deployment values and empty optional smoke URL', () => {
		expect(() => assertDeployEnv('test deploy', testEnv)).not.toThrow();
	});

	it('rejects missing and placeholder deployment values', () => {
		setDeployEnv({ DEPLOY_HOST: 'CHANGE_ME' });
		expect(() => assertDeployEnv('test deploy', testEnv)).toThrow(/DEPLOY_HOST/);

		setDeployEnv({ DEPLOY_USER: 'undefined' });
		expect(() => assertDeployEnv('test deploy', testEnv)).toThrow(/DEPLOY_USER/);

		setDeployEnv({ DEPLOY_REMOTE: undefined });
		expect(() => assertDeployEnv('test deploy', testEnv)).toThrow(/DEPLOY_REMOTE/);
	});

	it('rejects malformed deploy ports and parent-relative local paths', () => {
		setDeployEnv({ DEPLOY_PORT: '70000' });
		expect(() => assertDeployEnv('test deploy', testEnv)).toThrow(/DEPLOY_PORT/);

		setDeployEnv({ DEPLOY_LOCAL: '../build' });
		expect(() => assertDeployEnv('test deploy', testEnv)).toThrow(/DEPLOY_LOCAL/);

		setDeployEnv({ DEPLOY_IDENTITY_FILE: '../id_ed25519' });
		expect(() => assertDeployEnv('test deploy', testEnv)).toThrow(/DEPLOY_IDENTITY_FILE/);
	});

	it('rejects unsafe alpha smoke URLs', () => {
		setDeployEnv({ ALPHA_SMOKE_BASE_URL: 'https://user:pass@example.com/app' });
		expect(() => assertDeployEnv('test deploy', testEnv)).toThrow(/ALPHA_SMOKE_BASE_URL/);

		setDeployEnv({ ALPHA_SMOKE_BASE_URL: 'https://example.com/app?token=secret' });
		expect(() => assertDeployEnv('test deploy', testEnv)).toThrow(/ALPHA_SMOKE_BASE_URL/);
	});
});
