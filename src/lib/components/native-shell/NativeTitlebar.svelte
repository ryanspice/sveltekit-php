<script lang="ts">
	type NativePlatform = 'auto' | 'windows' | 'macos';
	type NativeWindowAction = 'start-dragging' | 'toggle-maximize';
	type PendingDrag = {
		pointerId: number;
		startX: number;
		startY: number;
	} | null;

	let {
		appMark = 'APP',
		eyebrow,
		title,
		titleId,
		badges = [],
		platform = 'auto',
		dragStartThresholdPx = 4
	}: {
		appMark?: string;
		eyebrow: string;
		title: string;
		titleId?: string;
		badges?: string[];
		platform?: NativePlatform;
		dragStartThresholdPx?: number;
	} = $props();

	const dragBlockSelector = [
		'button',
		'input',
		'label',
		'a',
		'select',
		'textarea',
		'summary',
		'details',
		'output',
		"[contenteditable='true']",
		'[data-no-window-drag]',
		'.segmented',
		'.chip',
		'.icon-chip',
		'.caption-button',
		'.caption-actions',
		'.windows-caption-controls',
		'.traffic-lights'
	].join(', ');

	let pendingDrag: PendingDrag = null;
	let titlebarElement: HTMLElement | null = null;

	function clearPendingDrag() {
		const pointerId = pendingDrag?.pointerId;
		pendingDrag = null;

		if (pointerId !== undefined && titlebarElement?.hasPointerCapture(pointerId)) {
			titlebarElement.releasePointerCapture(pointerId);
		}
	}

	function hasActiveTextSelection() {
		const selection = window.getSelection();
		return Boolean(selection && selection.type === 'Range' && selection.toString().trim().length > 0);
	}

	function canStartWindowDrag(target: EventTarget | null) {
		const element = target instanceof Element ? target : null;

		if (element?.closest(dragBlockSelector)) {
			return false;
		}

		return !hasActiveTextSelection();
	}

	function dispatchHostWindowAction(action: NativeWindowAction) {
		titlebarElement?.dispatchEvent(
			new CustomEvent('native-window-action', {
				bubbles: true,
				detail: {
					action,
					source: 'NativeTitlebar',
					dragStartThresholdPx
				}
			})
		);
	}

	function handlePointerDown(event: PointerEvent) {
		if (!event.isPrimary || event.button !== 0) {
			return;
		}

		if (!canStartWindowDrag(event.target)) {
			clearPendingDrag();
			return;
		}

		clearPendingDrag();
		pendingDrag = {
			pointerId: event.pointerId,
			startX: event.clientX,
			startY: event.clientY
		};
		titlebarElement?.setPointerCapture(event.pointerId);
	}

	function handlePointerMove(event: PointerEvent) {
		if (!pendingDrag || event.pointerId !== pendingDrag.pointerId) {
			return;
		}

		if ((event.buttons & 1) === 0) {
			clearPendingDrag();
			return;
		}

		const movedEnough =
			Math.abs(event.clientX - pendingDrag.startX) >= dragStartThresholdPx ||
			Math.abs(event.clientY - pendingDrag.startY) >= dragStartThresholdPx;

		if (!movedEnough) {
			return;
		}

		clearPendingDrag();
		event.preventDefault();
		dispatchHostWindowAction('start-dragging');
	}

	function handlePointerUp(event: PointerEvent) {
		if (pendingDrag && event.pointerId === pendingDrag.pointerId) {
			clearPendingDrag();
		}
	}

	function handlePointerCancel(event: PointerEvent) {
		if (pendingDrag && event.pointerId === pendingDrag.pointerId) {
			clearPendingDrag();
		}
	}

	function handleLostPointerCapture(event: PointerEvent) {
		if (pendingDrag && event.pointerId === pendingDrag.pointerId) {
			clearPendingDrag();
		}
	}

	function handleDoubleClick(event: MouseEvent) {
		if (!canStartWindowDrag(event.target)) {
			clearPendingDrag();
			return;
		}

		clearPendingDrag();
		event.preventDefault();
		dispatchHostWindowAction('toggle-maximize');
	}

	$effect(() => {
		const handleWindowBlur = () => {
			clearPendingDrag();
		};

		window.addEventListener('blur', handleWindowBlur);

		return () => {
			clearPendingDrag();
			window.removeEventListener('blur', handleWindowBlur);
		};
	});
</script>

<!-- Titlebar gestures dispatch inert host events; controls inside data-no-window-drag stay normal links/buttons. -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<header
	bind:this={titlebarElement}
	class="titlebar"
	data-native-titlebar
	data-native-platform={platform}
	data-native-platform-provenance="lg-ultragear-native-platform-provenance"
	data-native-platform-mode={platform === 'auto' ? 'hybrid-proof' : platform}
	data-desktop-shell-ui-binding="desktopShellUiBinding"
	data-desktop-shell-helper-package="@scriptgpt/desktop-shell-ui"
	data-window-action-source="BridgeTopbar.svelte"
	data-macos-chrome="traffic-light-row"
	data-windows-chrome="caption-control-row"
	data-window-drag
	data-drag-start-threshold-px={dragStartThresholdPx}
	data-drag-block-selector={dragBlockSelector}
	onpointerdown={handlePointerDown}
	onpointermove={handlePointerMove}
	onpointerup={handlePointerUp}
	onpointercancel={handlePointerCancel}
	onlostpointercapture={handleLostPointerCapture}
	ondblclick={handleDoubleClick}
>
	<div class="traffic-lights" aria-hidden="true" data-window-control-group="macos">
		<span class="traffic traffic-close"></span>
		<span class="traffic traffic-minimize"></span>
		<span class="traffic traffic-maximize"></span>
	</div>
	<div class="title-lockup">
		<span class="app-mark">{appMark}</span>
		<div>
			<p>{eyebrow}</p>
			<h1 id={titleId}>{title}</h1>
		</div>
	</div>
	<div class="titlebar-drag-strip" aria-hidden="true"></div>
	<div class="windows-caption-controls" aria-hidden="true" data-no-window-drag data-window-control-group="windows">
		<span class="caption-button" data-window-control="minimize" data-action="minimize"></span>
		<span class="caption-button" data-window-control="maximize" data-action="maximize"></span>
		<span class="caption-button" data-window-control="close" data-action="close"></span>
	</div>
	<div class="caption-actions" aria-label="Native styling source" data-no-window-drag>
		{#each badges as badge (badge)}
			<span>{badge}</span>
		{/each}
	</div>
</header>

<style>
	.titlebar {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr) minmax(1.5rem, 0.28fr) auto auto;
		gap: 1rem;
		align-items: center;
		padding: 1rem 1.25rem 0.75rem;
		border-bottom: 1px solid rgba(79, 93, 128, 0.12);
		background:
			linear-gradient(180deg, rgba(255, 255, 255, 0.34), rgba(255, 255, 255, 0.08)),
			radial-gradient(circle at 10% 0%, rgba(68, 117, 255, 0.12), transparent 32%),
			radial-gradient(circle at 92% 0%, rgba(255, 45, 122, 0.09), transparent 28%),
			var(--surface-chrome, transparent);
		user-select: none;
		-webkit-app-region: drag;
	}

	.traffic-lights,
	.windows-caption-controls,
	.caption-actions,
	.title-lockup {
		display: flex;
		align-items: center;
	}

	.traffic-lights {
		gap: 0.5rem;
		border: 1px solid rgba(79, 93, 128, 0.12);
		border-radius: 999px;
		padding: 0.38rem 0.46rem;
		background: rgba(255, 255, 255, 0.24);
		box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.42);
	}

	[data-no-window-drag] {
		-webkit-app-region: no-drag;
	}

	.traffic {
		width: 0.78rem;
		height: 0.78rem;
		border-radius: 999px;
		box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.08);
		transition: transform 140ms ease, filter 140ms ease;
	}

	.traffic:hover {
		transform: scale(1.08);
	}

	.titlebar[data-native-platform-mode='hybrid-proof'] .traffic,
	.titlebar[data-native-platform-mode='hybrid-proof'] .windows-caption-controls span {
		filter: saturate(1.08);
	}

	.titlebar[data-native-platform-mode='hybrid-proof'] .traffic-lights::after,
	.titlebar[data-native-platform-mode='hybrid-proof'] .windows-caption-controls::before {
		color: #64708a;
		font-size: 0.58rem;
		font-weight: 850;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	.titlebar[data-native-platform-mode='hybrid-proof'] .traffic-lights::after {
		content: 'mac';
		margin-left: 0.2rem;
	}

	.titlebar[data-native-platform-mode='hybrid-proof'] .windows-caption-controls::before {
		content: 'win';
		padding: 0 0.24rem;
	}

	.traffic-close {
		background: #ff5f57;
	}

	.traffic-minimize {
		background: #ffbd2e;
	}

	.traffic-maximize {
		background: #28c840;
	}

	.title-lockup {
		gap: 0.9rem;
		min-width: 0;
	}

	.titlebar-drag-strip {
		min-height: 2.25rem;
		border-radius: 999px;
		background: linear-gradient(90deg, transparent, rgba(79, 93, 128, 0.06), transparent);
	}

	.windows-caption-controls {
		justify-content: flex-end;
		gap: 0.3rem;
		border: 1px solid rgba(79, 93, 128, 0.14);
		border-radius: 999px;
		padding: 0.25rem;
		background: rgba(255, 255, 255, 0.28);
		box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.5);
	}

	.windows-caption-controls span {
		position: relative;
		display: grid;
		place-items: center;
		width: 1.8rem;
		height: 1.45rem;
		border-radius: 999px;
		color: #46516a;
		font-size: 0.75rem;
		font-weight: 900;
		transition: background 120ms ease, color 120ms ease, transform 120ms ease;
	}

	.windows-caption-controls span:hover {
		background: var(--caption-hover-bg);
	}

	.windows-caption-controls span:active {
		background: var(--caption-active-bg);
		transform: translateY(1px);
	}

	.windows-caption-controls span::before {
		line-height: 1;
	}

	.windows-caption-controls [data-window-control='minimize']::before {
		content: '-';
	}

	.windows-caption-controls [data-window-control='maximize']::before {
		content: '';
		width: 0.52rem;
		height: 0.42rem;
		border: 1px solid currentColor;
		border-radius: 1px;
	}

	.windows-caption-controls [data-window-control='close']::before {
		content: 'x';
	}

	.windows-caption-controls [data-window-control='close'] {
		color: #a5122e;
	}

	.windows-caption-controls [data-window-control='close']:hover {
		background: var(--danger-hover-bg);
		color: white;
	}

	.app-mark {
		display: grid;
		place-items: center;
		width: 2.75rem;
		height: 2.75rem;
		border-radius: 0.95rem;
		background: linear-gradient(135deg, #182238, #1a7bc7 48%, #11b79d);
		color: white;
		font-size: 0.78rem;
		font-weight: 800;
		letter-spacing: 0.04em;
		box-shadow: 0 12px 28px rgba(26, 123, 199, 0.3);
	}

	.title-lockup p {
		margin: 0 0 0.25rem;
		color: #64708a;
		font-size: 0.75rem;
		font-weight: 800;
		letter-spacing: 0.12em;
		text-transform: uppercase;
	}

	h1 {
		margin: 0;
		font-size: clamp(1.4rem, 3vw, 2.15rem);
		letter-spacing: -0.045em;
	}

	.caption-actions {
		justify-content: flex-end;
		gap: 0.45rem;
		flex-wrap: wrap;
	}

	.caption-actions span {
		border: 1px solid rgba(79, 93, 128, 0.18);
		border-radius: 999px;
		padding: 0.42rem 0.66rem;
		background: rgba(255, 255, 255, 0.46);
		color: #46516a;
		font-size: 0.72rem;
		font-weight: 750;
	}

	.titlebar[data-native-platform='windows'] .traffic-lights {
		display: none;
	}

	.titlebar[data-native-platform='macos'] .windows-caption-controls {
		display: none;
	}

	@media (prefers-color-scheme: dark) {
		h1 {
			color: #f8fafc;
		}

		.title-lockup p {
			color: #b8c3d8;
		}

		.windows-caption-controls {
			border-color: rgba(255, 255, 255, 0.08);
			background: rgba(255, 255, 255, 0.035);
			box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.035);
		}

		.traffic-lights {
			border-color: rgba(255, 255, 255, 0.08);
			background: rgba(255, 255, 255, 0.035);
			box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.035);
		}

		.titlebar[data-native-platform-mode='hybrid-proof'] .traffic-lights::after,
		.titlebar[data-native-platform-mode='hybrid-proof'] .windows-caption-controls::before {
			color: #b8c3d8;
		}

		.windows-caption-controls span {
			color: #dbeafe;
		}

		.windows-caption-controls [data-window-control='close'] {
			color: #fecdd3;
		}

		.caption-actions span {
			border-color: rgba(255, 255, 255, 0.09);
			background: rgba(255, 255, 255, 0.045);
			color: #dbeafe;
		}

		.titlebar-drag-strip {
			background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.055), transparent);
		}
	}

	@media (max-width: 900px) {
		.titlebar {
			grid-template-columns: 1fr;
		}

		.titlebar-drag-strip {
			display: none;
		}

		.caption-actions {
			justify-content: flex-start;
		}

		.windows-caption-controls {
			justify-content: flex-start;
			width: fit-content;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.traffic,
		.windows-caption-controls span {
			transition: none;
		}
	}
</style>
