<script lang="ts">
	import {
		getNativeHostWindowController,
		type NativeHostCommandResult,
		type NativeWindowAction,
		type NativeWindowActionDetail
	} from '$lib/native-shell/native-host-event-bridge';

	type Props = {
		contractHref: string;
		bridgeReuseHref: string;
		guideHref: string;
	};

	let { contractHref, bridgeReuseHref, guideHref }: Props = $props();

	let mounted = $state(false);
	let nativeHostAvailable = $state(false);
	let commandHistory: NativeHostCommandResult[] = $state([]);

	type HandoffCommand = {
		id: string;
		action: NativeWindowAction;
		label: string;
		description: string;
		detail?: Partial<Omit<NativeWindowActionDetail, 'action' | 'source'>>;
	};

	const handoffCommands: HandoffCommand[] = $derived(buildHandoffCommands(bridgeReuseHref));

	function buildHandoffCommands(reportHref: string): HandoffCommand[] {
		return [
		{
			id: 'set-window-effect-mica',
			action: 'set-window-effect',
			label: 'Send Mica effect',
			description: 'Emit the Windows 11 Mica handoff event a desktop host can map to Effect.Mica.',
			detail: {
				windowEffect: 'mica'
			}
		},
		{
			id: 'set-progress-indeterminate',
			action: 'set-progress',
			label: 'Send busy progress',
			description: 'Emit the UltraGear-style indeterminate progress cue used while evidence is collecting.',
			detail: {
				progressStatus: 'indeterminate'
			}
		},
		{
			id: 'set-progress-normal',
			action: 'set-progress',
			label: 'Send progress 18%',
			description: 'Emit the UltraGear-style report generation progress cue.',
			detail: {
				progress: 18,
				progressStatus: 'normal'
			}
		},
		{
			id: 'clear-progress-none',
			action: 'clear-progress',
			label: 'Clear progress',
			description: 'Emit the ProgressBarStatus.None cue used when alpha evidence is no longer busy.',
			detail: {
				progressStatus: 'none'
			}
		},
		{
			id: 'report-ready-bundle',
			action: 'report-ready',
			label: 'Send report-ready',
			description: 'Emit the structured report handoff cue with a review bundle link.',
			detail: {
				reportHref,
				reportKind: 'bundle',
				reportLabel: 'Alpha native evidence bundle'
			}
		}
		];
	}

	const refreshStatus = () => {
		nativeHostAvailable = Boolean(getNativeHostWindowController());
		commandHistory = window.__SVELTEKIT_PHP_NATIVE_HOST_HISTORY__ ?? [];
	};

	const dispatchNativeHostHandoff = (command: HandoffCommand) => {
		if (typeof document === 'undefined') {
			return;
		}

		document.dispatchEvent(
			new CustomEvent('native-window-action', {
				detail: {
					action: command.action,
					source: 'NativeHostBridgeStatus',
					...command.detail
				}
			})
		);

		window.setTimeout(refreshStatus, 0);
	};

	$effect(() => {
		mounted = true;
		refreshStatus();

		const intervalId = window.setInterval(refreshStatus, 750);

		return () => window.clearInterval(intervalId);
	});
</script>

<section
	class="native-host-status"
	aria-labelledby="native-host-status-heading"
	data-native-host-bridge-status
>
	<div class="status-copy">
		<p class="eyebrow">Native host bridge</p>
		<h2 id="native-host-status-heading">Runtime seam for Windows Mica and macOS chrome</h2>
		<p>
			The browser/PHP runtime does not call native APIs. It exposes
			<code>window.__SVELTEKIT_PHP_NATIVE_HOST__</code> for optional host wrappers and records
			fallback command results in <code>window.__SVELTEKIT_PHP_NATIVE_HOST_HISTORY__</code>.
		</p>
	</div>

	<div class="status-grid">
		<article class:native-host-online={nativeHostAvailable}>
			<span>controller</span>
			<strong>{nativeHostAvailable ? 'native host registered' : 'browser fallback active'}</strong>
			<p>
				{#if mounted}
					{nativeHostAvailable
						? 'A wrapper has registered one or more native host handlers.'
						: 'No wrapper is registered, so titlebar, Mica, progress, and report commands stay inert and auditable.'}
				{:else}
					Runtime status is resolved after client mount.
				{/if}
			</p>
		</article>

		<article>
			<span>history</span>
			<strong>{commandHistory.length} recorded command{commandHistory.length === 1 ? '' : 's'}</strong>
			<p>
				Recent host bridge results are stored in a bounded browser history for screenshots,
				hosted smoke review, and wrapper debugging.
			</p>
		</article>
	</div>

	<div
		class="handoff-panel"
		aria-labelledby="native-host-handoff-heading"
		data-native-host-handoff-controls
	>
		<div>
			<span>live handoff</span>
			<h3 id="native-host-handoff-heading">Emit host-owned Mica, progress, and report events</h3>
			<p>
				These controls send browser-safe <code>native-window-action</code> events for
				<code>set-window-effect</code>, <code>set-progress</code>, <code>clear-progress</code>, and
				<code>report-ready</code>. Hosted PHP demos record fallback results; desktop wrappers can bind
				the same events to <code>setWindowEffect</code>, <code>setProgress</code>,
				<code>clearProgress</code>, and <code>reportReady</code>.
			</p>
		</div>

		<div class="handoff-grid">
			{#each handoffCommands as command (command.id)}
				<button type="button" onclick={() => dispatchNativeHostHandoff(command)}>
					<strong>{command.label}</strong>
					<code>{command.action}</code>
					<span>{command.description}</span>
				</button>
			{/each}
		</div>
	</div>

	<div class="history-panel" aria-label="Native host command history">
		{#if commandHistory.length > 0}
			{#each commandHistory.slice(-4).reverse() as result (result.timestamp)}
				<div>
					<span>{result.mode}</span>
					<strong>{result.action}</strong>
					<p>{result.reason}</p>
					<time datetime={result.timestamp}>{result.timestamp}</time>
				</div>
			{/each}
		{:else}
			<p>
				No host bridge commands have been recorded yet. Interacting with the titlebar drag/maximize
				seam will populate this panel when the bridge receives events.
			</p>
		{/if}
	</div>

	<div class="status-links">
		<a href={contractHref}>Open native host contract</a>
		<a href={guideHref}>Open native host guide</a>
		<a href={bridgeReuseHref}>Open bridge reuse map</a>
	</div>
</section>

<style>
	.native-host-status {
		margin: 0 1.25rem 1.25rem;
		border: 1px solid rgba(79, 93, 128, 0.15);
		border-radius: 24px;
		padding: clamp(1rem, 2vw, 1.5rem);
		background:
			linear-gradient(135deg, rgba(255, 255, 255, 0.6), rgba(238, 248, 251, 0.4)),
			radial-gradient(circle at 94% 12%, rgba(17, 164, 143, 0.14), transparent 28%);
		box-shadow: 0 12px 30px rgba(33, 42, 70, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.74);
	}

	.eyebrow {
		margin: 0 0 0.25rem;
		color: #64708a;
		font-size: 0.75rem;
		font-weight: 800;
		letter-spacing: 0.12em;
		text-transform: uppercase;
	}

	h2,
	p {
		margin-top: 0;
	}

	.status-copy h2 {
		margin-bottom: 0.55rem;
		color: #111827;
		font-size: clamp(1.25rem, 2.6vw, 2.2rem);
		line-height: 1.02;
		letter-spacing: -0.06em;
	}

	.status-copy p,
	.status-grid p,
	.history-panel p {
		color: #4b5872;
		line-height: 1.6;
	}

	code {
		border: 1px solid rgba(79, 93, 128, 0.14);
		border-radius: 8px;
		padding: 0.12rem 0.34rem;
		background: rgba(255, 255, 255, 0.46);
		color: #0f5c94;
		font-size: 0.86em;
		font-weight: 800;
	}

	.status-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 1rem;
		margin: 1rem 0;
	}

	.status-grid article,
	.handoff-panel,
	.handoff-grid button,
	.history-panel {
		border: 1px solid rgba(79, 93, 128, 0.13);
		border-radius: 20px;
		padding: 1rem;
		background: rgba(255, 255, 255, 0.38);
	}

	.status-grid span,
	.handoff-panel span,
	.history-panel span,
	.status-links a {
		display: inline-flex;
		border: 1px solid rgba(79, 93, 128, 0.16);
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.5);
		color: #0f5c94;
		font-size: 0.72rem;
		font-weight: 850;
		text-decoration: none;
		text-transform: uppercase;
		letter-spacing: 0.08em;
	}

	.status-grid span,
	.handoff-panel span,
	.history-panel span {
		padding: 0.36rem 0.58rem;
	}

	.status-grid strong,
	.handoff-grid strong,
	.history-panel strong {
		display: block;
		margin: 0.75rem 0 0.35rem;
		color: #111827;
		font-size: 1rem;
	}

	.handoff-panel {
		display: grid;
		gap: 1rem;
		margin: 1rem 0;
		background:
			linear-gradient(135deg, rgba(255, 255, 255, 0.5), rgba(238, 248, 251, 0.34)),
			radial-gradient(circle at 92% 10%, rgba(13, 116, 196, 0.12), transparent 32%);
	}

	.handoff-panel h3 {
		margin: 0.75rem 0 0.45rem;
		color: #111827;
		font-size: clamp(1rem, 2vw, 1.35rem);
		line-height: 1.08;
		letter-spacing: -0.04em;
	}

	.handoff-grid {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 0.65rem;
	}

	.handoff-grid button {
		display: grid;
		gap: 0.45rem;
		padding: 0.85rem;
		color: inherit;
		font: inherit;
		text-align: left;
		cursor: pointer;
		transition: transform 140ms ease, box-shadow 140ms ease, background 140ms ease;
	}

	.handoff-grid button:hover,
	.handoff-grid button:focus-visible {
		transform: translateY(-1px);
		background: rgba(255, 255, 255, 0.76);
		box-shadow: 0 14px 28px rgba(33, 42, 70, 0.12);
	}

	.handoff-grid button:focus-visible {
		outline: 3px solid rgba(13, 116, 196, 0.35);
		outline-offset: 2px;
	}

	.handoff-grid code {
		justify-self: start;
	}

	.handoff-grid button span {
		border: 0;
		padding: 0;
		background: transparent;
		color: #4b5872;
		font-size: 0.82rem;
		font-weight: 700;
		letter-spacing: 0;
		text-transform: none;
	}

	.native-host-online {
		background:
			linear-gradient(135deg, rgba(255, 255, 255, 0.62), rgba(236, 253, 245, 0.4)),
			radial-gradient(circle at 92% 12%, rgba(18, 164, 111, 0.16), transparent 30%);
	}

	.history-panel {
		display: grid;
		gap: 0.75rem;
	}

	.history-panel div {
		border: 1px solid rgba(79, 93, 128, 0.12);
		border-radius: 16px;
		padding: 0.75rem;
		background: rgba(255, 255, 255, 0.34);
	}

	.history-panel p {
		margin-bottom: 0;
	}

	time {
		display: block;
		margin-top: 0.5rem;
		color: #697690;
		font-size: 0.78rem;
		font-weight: 750;
	}

	.status-links {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
		margin-top: 1rem;
	}

	.status-links a {
		padding: 0.48rem 0.72rem;
		transition: transform 140ms ease, box-shadow 140ms ease, background 140ms ease;
	}

	.status-links a:hover {
		transform: translateY(-1px);
		background: rgba(255, 255, 255, 0.82);
		box-shadow: 0 12px 24px rgba(33, 42, 70, 0.12);
	}

	@media (prefers-color-scheme: dark) {
		.native-host-status {
			border-color: rgba(255, 255, 255, 0.08);
			background: rgba(15, 23, 42, 0.58);
			box-shadow: 0 24px 70px rgba(0, 0, 0, 0.26), inset 0 1px 0 rgba(255, 255, 255, 0.05);
		}

		.status-copy h2,
		.handoff-panel h3,
		.handoff-grid strong,
		.status-grid strong,
		.history-panel strong {
			color: #f8fafc;
		}

		.status-copy p,
		.status-grid p,
		.handoff-panel p,
		.handoff-grid button span,
		.history-panel p,
		.eyebrow,
		time {
			color: #b8c3d8;
		}

		.status-grid article,
		.handoff-panel,
		.handoff-grid button,
		.history-panel,
		.history-panel div,
		code,
		.status-grid span,
		.handoff-panel span,
		.history-panel span,
		.status-links a {
			border-color: rgba(255, 255, 255, 0.09);
			background: rgba(255, 255, 255, 0.045);
			color: #dbeafe;
		}

		.handoff-grid button span {
			background: transparent;
			color: #b8c3d8;
		}
	}

	@media (max-width: 900px) {
		.status-grid,
		.handoff-grid {
			grid-template-columns: 1fr;
		}
	}

	@media (max-width: 640px) {
		.native-host-status {
			margin: 0 0.75rem 0.75rem;
		}
	}
</style>
