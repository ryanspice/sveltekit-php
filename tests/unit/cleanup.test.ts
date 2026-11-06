import { describe, expect, it, vi } from 'vitest';
import { cleanBuildDirectory } from '../../adapter/src/utils/fs.ts';

describe('build directory cleanup', () => {
	it('retries a transient Windows cleanup failure', async () => {
		const remove = vi.fn().mockImplementationOnce(() => {
			throw new Error('EPERM');
		});
		const wait = vi.fn(async () => {});

		await cleanBuildDirectory('B:\\safe\\build', {
			strict: true,
			warn: vi.fn(),
			remove,
			pathExists: () => true,
			wait
		});

		expect(remove).toHaveBeenCalledTimes(2);
		expect(wait).toHaveBeenCalledWith(200);
	});

	it('fails strict builds after the retry is exhausted', async () => {
		const remove = vi.fn(() => {
			throw new Error('EPERM');
		});

		await expect(
			cleanBuildDirectory('B:\\safe\\build', {
				strict: true,
				warn: vi.fn(),
				remove,
				pathExists: () => true,
				wait: async () => {}
			})
		).rejects.toThrow(/Failed to clean/);
	});

	it('warns but still fails closed when strict mode is disabled', async () => {
		const warn = vi.fn();
		await expect(
			cleanBuildDirectory('B:\\safe\\build', {
				strict: false,
				warn,
				remove: () => {
					throw new Error('EPERM');
				},
				pathExists: () => true,
				wait: async () => {}
			})
		).rejects.toThrow(/Failed to clean/);
		expect(warn).toHaveBeenCalledWith(expect.stringContaining('Failed to clean'));
	});
});
