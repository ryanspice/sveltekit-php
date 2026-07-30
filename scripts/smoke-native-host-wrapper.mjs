import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { buildAlphaNativeHostWrapperSmoke } from '../src/lib/alpha-native-host-wrapper-smoke.ts';
import { buildAlphaReadinessReport } from '../src/lib/alpha-readiness.ts';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = path.join(repoRoot, 'report');

export async function writeNativeHostWrapperSmoke() {
	const report = buildAlphaReadinessReport();
	const smoke = buildAlphaNativeHostWrapperSmoke(report);
	const outputPath = path.join(outputDir, 'alpha-native-host-wrapper-smoke.json');

	await mkdir(outputDir, { recursive: true });
	await writeFile(outputPath, `${JSON.stringify(smoke, null, 2)}\n`, 'utf8');

	return { smoke, outputPath };
}

function validateNativeHostWrapperSmoke(smoke) {
	const failures = [];
	const replayContract = smoke.eventReplayContract;
	const replayTranscript = smoke.eventReplayTranscript ?? [];
	const requiredResultFields = new Set(replayContract?.requiredResultFields ?? []);

	if (replayContract?.marker !== 'native-host-wrapper-event-replay') {
		failures.push('missing native-host-wrapper-event-replay contract marker');
	}

	if (replayContract?.eventName !== 'native-window-action') {
		failures.push('event replay contract must target native-window-action');
	}

	if (replayContract?.expectedHandled !== true || replayContract?.expectedMode !== 'native-host') {
		failures.push('event replay contract must require handled=true and mode=native-host');
	}

	if (replayContract?.noFallbackAllowedForRealHost !== true) {
		failures.push('event replay contract must reject browser fallback for a real host');
	}

	for (const field of [
		'action',
		'handled',
		'mode',
		'desktopShellUiHelper',
		'desktopShellUiSource',
		'desktopShellUiEvidence',
		'requiredHostPermission'
	]) {
		if (!requiredResultFields.has(field)) {
			failures.push(`event replay result fields must include ${field}`);
		}
	}

	if (smoke.hostPermissionContract?.marker !== 'lg-ultragear-host-permission-checklist') {
		failures.push('host permission contract must include lg-ultragear-host-permission-checklist marker');
	}

	if ((smoke.summary?.missingRequiredHostPermissions ?? []).length > 0) {
		failures.push(
			`missing required host permissions: ${smoke.summary.missingRequiredHostPermissions.join(', ')}`
		);
	}

	if (replayTranscript.length !== smoke.summary.eventReplayExpectationCount) {
		failures.push('event replay transcript count does not match summary.eventReplayExpectationCount');
	}

	for (const entry of replayTranscript) {
		if (entry.marker !== 'native-host-wrapper-event-replay-step') {
			failures.push(`event replay entry ${entry.order ?? 'unknown'} is missing replay-step marker`);
		}

		if (entry.expectedHistoryResult?.handled !== true || entry.expectedHistoryResult?.mode !== 'native-host') {
			failures.push(`event replay entry ${entry.action ?? entry.order} must expect handled native-host history`);
		}

		if (
			entry.expectedDesktopShellUiHelper &&
			entry.expectedHistoryResult?.desktopShellUiHelper !== entry.expectedDesktopShellUiHelper
		) {
			failures.push(`event replay entry ${entry.action ?? entry.order} helper does not match expected history`);
		}

		if (!entry.requiredHostPermission || entry.expectedHistoryResult?.requiredHostPermission !== entry.requiredHostPermission) {
			failures.push(`event replay entry ${entry.action ?? entry.order} must carry requiredHostPermission`);
		}
	}

	return failures;
}

async function main() {
	const { smoke, outputPath } = await writeNativeHostWrapperSmoke();
	const relativePath = path.relative(repoRoot, outputPath);
	const replayContract = smoke.eventReplayContract;
	const firstReplayStep = smoke.eventReplayTranscript?.[0];
	const failures = validateNativeHostWrapperSmoke(smoke);

	console.log(`Native host wrapper smoke contract written to ${relativePath}`);
	console.log(
		`Status: ${smoke.status}; steps: ${smoke.summary.probeStepCount}; required helpers: ${smoke.summary.requiredHelpers.join(', ')}`
	);
	console.log(
		`Event replay: ${replayContract?.marker ?? 'missing'}; events: ${smoke.summary.eventReplayExpectationCount}; history: handled=${replayContract?.expectedHandled}, mode=${replayContract?.expectedMode}`
	);
	if (firstReplayStep) {
		console.log(
			`First replay: ${firstReplayStep.action} -> ${firstReplayStep.expectedHandler} -> ${firstReplayStep.expectedDesktopShellUiHelper}`
		);
	}

	if (smoke.status !== 'contract-ready' || failures.length > 0) {
		console.error(
			`Native host wrapper smoke contract is incomplete: ${JSON.stringify({
				summary: smoke.summary,
				failures
			})}`
		);
		process.exit(1);
	}
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	await main();
}
