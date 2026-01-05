<script lang="ts">
	/**
	 * SvelteKit PHP Debug Tools
	 *
	 * A comprehensive debugging interface for the SvelteKit PHP Adapter.
	 *
	 * Features:
	 * - Overview: High-level metrics, request details, and request history.
	 * - Structured: Recursive JSON tree view with expand/collapse capabilities.
	 * - Raw: Raw JSON payload viewer.
	 * - Paths: Flattened key-path view with value previews and types (useful for verification).
	 * - Diff: Snapshot comparison (WIP).
	 *
	 * Interactions:
	 * - Drag handle to resize the panel.
	 * - Ctrl+Alt+D to toggle visibility.
	 * - Ctrl+F to focus search.
	 * - Theme toggling (Light/Dark).
	 * - Snapshot export/import (Save/Load logic).
	 */
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { dev, browser } from '$app/environment';
	import { transformDebugData } from '$lib/devtools/transform';
	import { DevToolsStore, HistoryStore } from '$lib/devtools/store';
	import type { TransformResult } from '$lib/devtools/transform';

	// PROPS
	let { data = undefined }: { data?: any } = $props();

	// Derived Data
	let rawData = $derived(data !== undefined ? data : page.data);
	let isDev = $derived(dev || (rawData && rawData.is_dev === true));

	// STATE
	const store = new DevToolsStore();
	const history = new HistoryStore();

	let settings = $state(store.settings);
	let snapshots = $state(history.snapshots);
	let currentSnapshot = $state<TransformResult | null>(null);
	let isResizing = $state(false);

	// Tree View State
	let expandedPaths = $state(new Set<string>(['root'])); // 'root' is special key for top level

	// React to data changes
	$effect(() => {
		if (!isDev || !browser) return;

		const result = transformDebugData(rawData);
		currentSnapshot = result;

		const latest = history.getLatest();
		if (
			!latest ||
			latest.url !== page.url.href ||
			JSON.stringify(latest.data) !== JSON.stringify(rawData)
		) {
			history.add(page.url.href, rawData, result.meta);
			snapshots = [...history.snapshots];
		}

		// Auto-expand top level groups in structured view on new data
		if (result.structured) {
			// expandedPaths.add('app');
			// expandedPaths.add('message');
		}
	});

	// ACTIONS
	function toggleVisibility() {
		settings.visible = !settings.visible;
		saveSettings();
	}

	function toggleTheme() {
		settings.theme = settings.theme === 'light' ? 'dark' : 'light';
		saveSettings();
	}

	function saveSettings() {
		store.update((s) => Object.assign(s, settings));
	}

	function onKeyDown(e: KeyboardEvent) {
		if (!isDev || !browser) return;

		// Ctrl+Alt+D to toggle
		if (e.ctrlKey && e.altKey && (e.key === 'd' || e.key === 'D')) {
			e.preventDefault();
			toggleVisibility();
		}

		if (settings.visible && e.key === 'Escape') {
			settings.visible = false;
			saveSettings();
		}

		if (settings.visible && (e.ctrlKey || e.metaKey) && e.key === 'f') {
			e.preventDefault();
			const input = document.getElementById('filter-input');
			if (input) input.focus();
		}
	}

	// RESIZING
	function startResize(e: MouseEvent) {
		isResizing = true;
		e.preventDefault();
		window.addEventListener('mousemove', handleResize);
		window.addEventListener('mouseup', stopResize);
	}

	function handleResize(e: MouseEvent) {
		if (!isResizing) return;
		const newHeight = window.innerHeight - e.clientY;
		settings.height = Math.max(200, Math.min(window.innerHeight * 0.9, newHeight));
	}

	function stopResize() {
		isResizing = false;
		saveSettings();
		window.removeEventListener('mousemove', handleResize);
		window.removeEventListener('mouseup', stopResize);
	}

	// COPY UTILS
	function copyToClipboard(text: string) {
		navigator.clipboard.writeText(text);
	}

	function downloadSnapshot() {
		if (!currentSnapshot) return;
		const blob = new Blob(
			[
				JSON.stringify(
					{
						url: page.url.href,
						timestamp: new Date().toISOString(),
						raw: rawData,
						structured: currentSnapshot.structured,
						meta: currentSnapshot.meta
					},
					null,
					2
				)
			],
			{ type: 'application/json' }
		);
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `skphp-snapshot-${Date.now()}.json`;
		a.click();
		URL.revokeObjectURL(url);
	}

	// PATH UTILS
	function getValueByPath(obj: any, path: string): any {
		return path
			.split('.')
			.reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined), obj);
	}

	function getValueType(val: any): string {
		if (val === null) return 'null';
		if (Array.isArray(val)) return `array (${val.length})`;
		return typeof val;
	}

	function formatValuePreview(val: any): string {
		if (val === null) return 'null';
		if (typeof val === 'object') return JSON.stringify(val);
		if (typeof val === 'string') return `"${val}"`;
		return String(val);
	}

	// TREE VIEW UTILS
	function toggleTreePath(path: string) {
		const newSet = new Set(expandedPaths);
		if (newSet.has(path)) {
			newSet.delete(path);
		} else {
			newSet.add(path);
		}
		expandedPaths = newSet;
	}

	function expandAll() {
		// Simple implementation: just expand top-level and one level deep?
		// For now, let's just clear to collapse all, implementation of "expand all" requires traversal
		// We'll leave it as a todo or implement shallow expand
		const allPaths = new Set<string>();
		// traverse currentSnapshot.structured to find all object paths
		// This is expensive, so maybe just top levels
		if (currentSnapshot?.structured) {
			Object.keys(currentSnapshot.structured).forEach((k) => {
				allPaths.add(k);
				const val = (currentSnapshot!.structured as any)[k];
				if (typeof val === 'object' && val !== null) {
					Object.keys(val).forEach((subK) => allPaths.add(`${k}.${subK}`));
				}
			});
		}
		expandedPaths = allPaths;
	}

	function collapseAll() {
		expandedPaths = new Set();
	}

	// SEARCH FILTER
	let filteredPaths = $derived.by(() => {
		if (!currentSnapshot || !settings.searchQuery) return currentSnapshot?.keyPaths || [];
		const q = settings.searchQuery.toLowerCase();
		return currentSnapshot.keyPaths.filter((p) => p.toLowerCase().includes(q));
	});

	// MOUNT
	$effect(() => {
		if (isDev && browser) {
			window.addEventListener('keydown', onKeyDown);
			return () => {
				window.removeEventListener('keydown', onKeyDown);
			};
		}
	});
</script>

<!-- SNIPPETS -->
{#snippet treeNode(key: string, value: any, path: string, level: number)}
	{@const isObject = value !== null && typeof value === 'object'}
	{@const isExpanded = expandedPaths.has(path)}
	{@const hasChildren = isObject && Object.keys(value).length > 0}

	<div class="tree-row" class:active={false} style="padding-left: {level * 14}px">
		<div
			class="tree-content"
			onclick={() => hasChildren && toggleTreePath(path)}
			role="button"
			tabindex="0"
			onkeydown={(e) => e.key === 'Enter' && hasChildren && toggleTreePath(path)}
		>
			{#if hasChildren}
				<span class="caret" class:rotated={isExpanded}>▶</span>
			{:else}
				<span class="caret-placeholder"></span>
			{/if}

			<span class="key-name">{key}</span>
			{#if isObject}
				<span class="meta-type"
					>{Array.isArray(value)
						? `array (${value.length})`
						: `object (${Object.keys(value).length})`}</span
				>
				{#if !isExpanded}
					<span class="preview-dim"
						>{JSON.stringify(value).slice(0, 40)}{JSON.stringify(value).length > 40
							? '...'
							: ''}</span
					>
				{/if}
			{:else}
				<span class="separator">:</span>
				<span
					class="value-primitive"
					class:string={typeof value === 'string'}
					class:number={typeof value === 'number'}
					class:bool={typeof value === 'boolean'}
					class:null={value === null}
				>
					{JSON.stringify(value)}
				</span>
			{/if}
		</div>
	</div>

	{#if isObject && isExpanded}
		{#each Object.entries(value) as [k, v]}
			{@render treeNode(k, v, path ? `${path}.${k}` : k, level + 1)}
		{/each}
	{/if}
{/snippet}

{#if isDev}
	{#if !settings.visible}
		<button
			class="toggle-btn-minimized"
			onclick={toggleVisibility}
			aria-label="Open SvelteKit PHP DevTools"
		>
			<span class="status-dot" class:loaded={!!currentSnapshot} class:error={!currentSnapshot}
			></span>
			PHP DevTools
		</button>
	{:else}
		<div
			class="devtools-panel"
			class:light-theme={settings.theme === 'light'}
			style="height: {settings.height}px;"
		>
			<!-- Header / Top Bar -->
			<header class="devtools-header">
				<!-- Left Section: Title and Tabs -->
				<div class="header-left">
					<div class="brand">
						<span class="brand-icon">
							<svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M9 5l7 7-7 7"
								></path>
							</svg>
						</span>
						SvelteKit PHP
					</div>

					<!-- Tabs -->
					<nav class="tabs-nav">
						{#each ['overview', 'structured', 'raw', 'paths', 'diff'] as tab}
							<button
								class="tab-btn"
								class:active={settings.activeTab === tab}
								onclick={() => {
									settings.activeTab = tab as any;
									saveSettings();
								}}
							>
								{tab.toUpperCase()}
							</button>
						{/each}
					</nav>
				</div>

				<!-- Right Section: Search and Actions -->
				<div class="header-right">
					<!-- Search Input -->
					<div class="search-container">
						<input
							id="filter-input"
							type="text"
							placeholder="Filter keys (Ctrl+F)..."
							bind:value={settings.searchQuery}
							class="search-input"
						/>
						<svg class="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
							></path>
						</svg>
					</div>

					<!-- Actions -->
					<div class="actions-group">
						<button
							class="action-btn"
							onclick={() => copyToClipboard(JSON.stringify(rawData, null, 2))}
							title="Copy Raw JSON"
						>
							<svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m-7 4h7m-7 3h7m-7 3h7"
								></path>
							</svg>
						</button>
						<button class="action-btn" onclick={downloadSnapshot} title="Save Snapshot">
							<svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M8 7H5a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12"
								></path>
							</svg>
						</button>
						<button class="action-btn" onclick={toggleTheme} title="Toggle Theme">
							{#if settings.theme === 'light'}
								<svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
									></path>
								</svg>
							{:else}
								<svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
									></path>
								</svg>
							{/if}
						</button>
						<button class="action-btn" onclick={toggleVisibility} title="Minimize">
							<svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M19 9l-7 7-7-7"
								></path>
							</svg>
						</button>
					</div>
				</div>
			</header>

			<!-- Resize Handle -->
			<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
			<div
				class="resize-handle"
				onmousedown={startResize}
				role="separator"
				aria-label="Resize panel"
			></div>

			<!-- Main Content Area -->
			<main class="main-content">
				{#if !currentSnapshot}
					<div class="empty-state">
						<p>No debug data available.</p>
					</div>
				{:else}
					<!-- 1. OVERVIEW Tab -->
					{#if settings.activeTab === 'overview'}
						<div class="tab-pane overview-grid">
							<div class="grid-left">
								<!-- Application Panel -->
								<div class="panel">
									<h2 class="panel-title">APPLICATION</h2>
									<div class="info-list">
										<div class="info-row">
											<span class="label">Name:</span>
											<span class="value accent"
												>{currentSnapshot.structured?.app?.app_name ?? 'N/A'}</span
											>
										</div>
										<div class="info-row">
											<span class="label">Version:</span>
											<span class="value"
												>{currentSnapshot.structured?.app?.app_version ?? 'N/A'}</span
											>
										</div>
										<div class="info-row">
											<span class="label">Engine:</span>
											<span class="value"
												>{currentSnapshot.structured?.runtime?.php_engine ?? 'Unknown'}</span
											>
										</div>
									</div>
								</div>

								<!-- Current Request Panel -->
								<div class="panel flex-grow">
									<h2 class="panel-title">CURRENT REQUEST</h2>
									<div class="info-list">
										<div class="info-row">
											<span class="label">URL:</span>
											<span class="value accent url">{page.url.pathname}</span>
										</div>
										<div class="info-row">
											<span class="label">Message:</span>
											<span class="value"
												>{currentSnapshot.structured?.message?.message ?? '-'}</span
											>
										</div>
										<div class="info-row">
											<span class="label">Timestamp:</span>
											<span class="value"
												>{currentSnapshot.structured?.timing?.timestamp_iso ?? '-'}</span
											>
										</div>
										<div class="info-row">
											<span class="label">Memory:</span>
											<span class="value">
												{currentSnapshot.structured?.runtime?.memory_usage_mb ?? 0} MB
											</span>
										</div>
									</div>
								</div>
							</div>

							<div class="grid-right">
								<!-- History Panel -->
								<div class="panel full-height">
									<h2 class="panel-title">HISTORY ({snapshots.length})</h2>
									<div class="history-list">
										{#each snapshots as snap, i}
											<div
												class="history-row"
												class:selected={JSON.stringify(snap.data) === JSON.stringify(rawData)}
											>
												<div class="truncate">
													<span class="history-time"
														>{new Date(snap.timestamp).toLocaleTimeString()}</span
													>
													<span class="history-url">{new URL(snap.url).pathname}</span>
												</div>
											</div>
										{/each}
									</div>
								</div>
							</div>
						</div>

						<!-- 2. STRUCTURED Tab -->
					{:else if settings.activeTab === 'structured'}
						<div class="tab-pane flex-col">
							<div class="toolbar-sub">
								<span class="label">Current Payload: Request Data</span>
								<div class="actions">
									<button class="text-btn" onclick={expandAll}>Expand All</button>
									<button class="text-btn" onclick={collapseAll}>Collapse All</button>
								</div>
							</div>
							<div class="tree-viewer">
								{#if currentSnapshot.structured}
									{#each Object.entries(currentSnapshot.structured) as [k, v]}
										{@render treeNode(k, v, k, 0)}
									{/each}
								{:else}
									<div class="empty-state">No structured data</div>
								{/if}
							</div>
						</div>

						<!-- 3. RAW Tab -->
					{:else if settings.activeTab === 'raw'}
						<div class="tab-pane flex-col bg-darker">
							<div class="toolbar-sub">
								<span class="label"
									>Raw JSON Payload ({currentSnapshot.meta.estimatedSize} bytes)</span
								>
								<button
									class="text-btn"
									onclick={() => copyToClipboard(JSON.stringify(rawData, null, 2))}>Copy</button
								>
							</div>
							<div class="code-viewer">
								<pre>{JSON.stringify(rawData, null, 2)}</pre>
							</div>
						</div>

						<!-- 4. PATHS Tab -->
					{:else if settings.activeTab === 'paths'}
						<div class="tab-pane flex-col p-0">
							<div class="table-container">
								<table class="paths-table">
									<thead>
										<tr>
											<th style="width: 40%">Path</th>
											<th style="width: 40%">Value Preview</th>
											<th style="width: 10%">Type</th>
											<th style="width: 10%" class="text-center">Copy</th>
										</tr>
									</thead>
									<tbody>
										{#each filteredPaths as path}
											{@const val = getValueByPath(currentSnapshot.structured, path)}
											<tr class="path-row">
												<td class="path-cell text-accent" title={path}>{path}</td>
												<td class="value-cell text-dim">{formatValuePreview(val)}</td>
												<td class="type-cell text-warn">{getValueType(val)}</td>
												<td class="text-center">
													<button
														class="icon-only-btn"
														onclick={() => copyToClipboard(path)}
														title="Copy Path"
													>
														<svg
															width="12"
															height="12"
															fill="none"
															stroke="currentColor"
															viewBox="0 0 24 24"
														>
															<path
																stroke-linecap="round"
																stroke-linejoin="round"
																stroke-width="2"
																d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m-7 4h7m-7 3h7m-7 3h7"
															></path>
														</svg>
													</button>
												</td>
											</tr>
										{/each}
										{#if filteredPaths.length === 0}
											<tr
												><td colspan="4" class="p-4 text-center text-dim"
													>No matching paths found</td
												></tr
											>
										{/if}
									</tbody>
								</table>
							</div>
						</div>

						<!-- 5. DIFF Tab -->
					{:else if settings.activeTab === 'diff'}
						<div class="tab-pane diff-view">
							<div class="toolbar-sub">
								<span class="label">Comparison vs Previous</span>
							</div>
							<div class="diff-placeholder">
								{#if snapshots.length > 1}
									<div class="diff-header">
										Comparing current vs {new Date(
											snapshots[snapshots.length - 2].timestamp
										).toLocaleTimeString()}
									</div>
									<div class="split-view">
										<div class="split-col">
											<h4>Previous</h4>
											<pre>{JSON.stringify(snapshots[snapshots.length - 2].meta, null, 2)}</pre>
										</div>
										<div class="split-col">
											<h4>Current</h4>
											<pre>{JSON.stringify(currentSnapshot.meta, null, 2)}</pre>
										</div>
									</div>
								{:else}
									<div class="empty-state">Need at least 2 snapshots to diff.</div>
								{/if}
							</div>
						</div>
					{/if}
				{/if}
			</main>

			<!-- Footer / Status Bar -->
			<footer class="devtools-footer">
				<div class="footer-left">
					<span>Keys: {currentSnapshot?.meta?.keyCount ?? 0}</span>
					<span>Size: ~{(currentSnapshot?.meta?.estimatedSize ?? 0 / 1024).toFixed(2)} KB</span>
				</div>
				<div class="footer-right">
					SvelteKit PHP Adapter <span class="text-accent ml-1">v0.9</span>
				</div>
			</footer>
		</div>
	{/if}
{/if}

<style>
	/* --- VARIABLES (Dark Base) --- */
	:root {
		--bg-dark-base: #0f172a; /* slate-900 */
		--bg-panel: #1e293b; /* slate-800 */
		--bg-content: #111827; /* gray-900 */
		--bg-header: #1a2333;
		--border-low: #334155; /* slate-700 */
		--text-high: #e2e8f0; /* slate-200 */
		--text-mid: #cbd5e1; /* slate-300 */
		--text-low: #94a3b8; /* slate-400 */
		--accent-main: #38bdf8; /* sky-400 */
		--accent-hover: #0ea5e9; /* sky-500 */
		--accent-active-bg: rgba(56, 189, 248, 0.15);
		--success: #4ade80;
		--warning: #facc15;
		--error: #f87171;

		--font-ui: ui-sans-serif, system-ui, sans-serif;
		--font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
	}

	/* Light Theme Overrides */
	.devtools-panel.light-theme {
		--bg-dark-base: #f8fafc;
		--bg-panel: #ffffff;
		--bg-content: #f1f5f9;
		--bg-header: #f8fafc;
		--border-low: #e2e8f0;
		--text-high: #1e293b;
		--text-mid: #475569;
		--text-low: #64748b;
		--accent-main: #0284c7;
		--accent-active-bg: rgba(2, 132, 199, 0.1);
	}

	/* --- UTILS & RESET --- */
	* {
		box-sizing: border-box;
	}
	button {
		appearance: none;
		background: none;
		border: none;
		cursor: pointer;
		color: inherit;
		font-family: inherit;
	}

	.text-accent {
		color: var(--accent-main);
	}
	.text-dim {
		color: var(--text-low);
	}
	.text-warn {
		color: var(--warning);
	}
	.ml-1 {
		margin-left: 0.25rem;
	}
	.truncate {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	/* --- PANEL LAYOUT --- */
	.devtools-panel {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		background-color: var(--bg-panel);
		color: var(--text-high);
		font-family: var(--font-ui);
		font-size: 13px;
		z-index: 99999;
		display: flex;
		flex-direction: column;
		border-top: 1px solid var(--border-low);
		box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.2);
	}

	.resize-handle {
		position: absolute;
		top: -4px;
		left: 0;
		right: 0;
		height: 6px;
		cursor: ns-resize;
		background: transparent;
		z-index: 100000;
	}
	.resize-handle:hover {
		background: var(--accent-main);
		opacity: 0.5;
	}

	/* --- HEADER --- */
	.devtools-header {
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 12px;
		background-color: var(--bg-header);
		border-bottom: 1px solid var(--border-low);
		flex-shrink: 0;
	}

	.header-left,
	.header-right {
		display: flex;
		align-items: center;
		gap: 16px;
		height: 100%;
	}

	.brand {
		font-weight: 600;
		color: var(--text-low);
		letter-spacing: 0.02em;
		display: flex;
		align-items: center;
		gap: 6px;
		user-select: none;
	}
	.brand-icon {
		transform: rotate(90deg);
		color: var(--text-low);
		display: flex;
	}

	/* --- TABS --- */
	.tabs-nav {
		display: flex;
		height: 100%;
	}
	.tab-btn {
		height: 100%;
		padding: 0 12px;
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 0.05em;
		color: var(--text-low);
		border-bottom: 2px solid transparent;
		transition: all 0.15s;
	}
	.tab-btn:hover {
		color: var(--text-high);
	}
	.tab-btn.active {
		color: var(--accent-main);
		border-bottom-color: var(--accent-main);
	}

	/* --- SEARCH & ACTIONS --- */
	.search-container {
		position: relative;
	}
	.search-input {
		background: var(--bg-content);
		border: 1px solid var(--border-low);
		color: var(--text-high);
		border-radius: 4px;
		padding: 4px 8px 4px 28px;
		font-size: 12px;
		width: 180px;
		transition: border-color 0.15s;
	}
	.search-input:focus {
		outline: none;
		border-color: var(--accent-main);
	}
	.search-icon {
		position: absolute;
		left: 8px;
		top: 50%;
		transform: translateY(-50%);
		width: 14px;
		height: 14px;
		color: var(--text-low);
		pointer-events: none;
	}

	.actions-group {
		display: flex;
		gap: 4px;
	}
	.action-btn {
		padding: 6px;
		border-radius: 4px;
		color: var(--text-low);
		transition:
			background 0.15s,
			color 0.15s;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.action-btn:hover {
		background: var(--border-low);
		color: var(--accent-main);
	}

	/* --- MAIN CONTENT --- */
	.main-content {
		flex: 1;
		overflow: hidden;
		background: var(--bg-content);
		display: flex;
		flex-direction: column;
	}

	.tab-pane {
		width: 100%;
		height: 100%;
		overflow: auto;
		padding: 12px;
	}
	.tab-pane.flex-col {
		display: flex;
		flex-direction: column;
		padding: 0;
	}
	.tab-pane.p-0 {
		padding: 0;
	}

	.empty-state {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		color: var(--text-low);
		font-style: italic;
	}

	/* --- OVERVIEW GRID --- */
	.overview-grid {
		display: grid;
		grid-template-columns: 2fr 1fr;
		gap: 12px;
	}
	@media (max-width: 800px) {
		.overview-grid {
			grid-template-columns: 1fr;
		}
	}

	.grid-left {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	.grid-right {
		display: flex;
		flex-direction: column;
	}

	.panel {
		background: var(--bg-panel);
		border: 1px solid var(--border-low);
		border-radius: 6px;
		padding: 16px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}
	.panel.flex-grow {
		flex: 1;
	}
	.panel.full-height {
		height: 100%;
		display: flex;
		flex-direction: column;
		padding: 0;
		overflow: hidden;
	}

	.panel-title {
		font-size: 11px;
		font-weight: 700;
		color: var(--text-low);
		text-transform: uppercase;
		margin: 0 0 12px 0;
		padding-bottom: 8px;
		border-bottom: 1px solid var(--border-low);
	}
	.panel.full-height .panel-title {
		margin: 0;
		padding: 12px;
		flex-shrink: 0;
	}

	.info-list {
		display: flex;
		flex-direction: column;
		gap: 8px;
		font-size: 13px;
	}
	.info-row {
		display: flex;
		justify-content: space-between;
	}
	.info-row .label {
		color: var(--text-low);
	}
	.info-row .value {
		font-family: var(--font-mono);
		color: var(--text-high);
	}
	.info-row .value.accent {
		color: var(--accent-main);
	}

	/* --- HISTORY --- */
	.history-list {
		overflow-y: auto;
		flex: 1;
	}
	.history-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 8px 12px;
		border-left: 3px solid transparent;
		cursor: pointer;
		transition: background 0.1s;
	}
	.history-row:hover {
		background: rgba(255, 255, 255, 0.03);
	}
	.history-row.selected {
		background: var(--accent-active-bg);
		border-left-color: var(--accent-main);
	}
	.history-time {
		font-family: var(--font-mono);
		font-size: 11px;
		color: var(--text-low);
		margin-right: 8px;
	}
	.history-url {
		font-family: var(--font-mono);
		font-size: 12px;
		color: var(--text-high);
	}

	/* --- TREE VIEW (Structured) --- */
	.toolbar-sub {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 6px 12px;
		background: var(--bg-header);
		border-bottom: 1px solid var(--border-low);
		font-size: 11px;
		color: var(--text-low);
		flex-shrink: 0;
	}
	.text-btn {
		color: var(--accent-main);
		font-size: 11px;
	}
	.text-btn:hover {
		text-decoration: underline;
	}
	.actions {
		display: flex;
		gap: 12px;
	}

	.tree-viewer {
		flex: 1;
		overflow-y: auto;
		padding: 8px;
		font-family: var(--font-mono);
		font-size: 12px;
		line-height: 1.5;
	}
	.tree-row {
		display: flex;
		align-items: flex-start;
		border-radius: 2px;
	}
	.tree-row:hover {
		background: rgba(56, 189, 248, 0.05);
	}
	.tree-content {
		display: flex;
		align-items: center;
		cursor: pointer;
		width: 100%;
		padding: 1px 0;
	}
	.caret {
		display: inline-block;
		width: 14px;
		text-align: center;
		color: var(--text-low);
		font-size: 10px;
		transition: transform 0.1s;
		margin-right: 2px;
	}
	.caret.rotated {
		transform: rotate(90deg);
	}
	.caret-placeholder {
		width: 14px;
		margin-right: 2px;
	}

	.key-name {
		color: var(--accent-main);
		margin-right: 4px;
		font-weight: 600;
	}
	.separator {
		margin-right: 4px;
		color: var(--text-low);
	}

	.meta-type {
		font-size: 10px;
		color: var(--text-low);
		background: rgba(255, 255, 255, 0.1);
		padding: 0 4px;
		border-radius: 3px;
		margin-left: 4px;
	}
	.preview-dim {
		color: var(--text-low);
		opacity: 0.6;
		font-style: italic;
		margin-left: 6px;
		font-size: 11px;
	}

	.value-primitive.string {
		color: #fce7f3; /* pink-100 */
	}
	.devtools-panel.light-theme .value-primitive.string {
		color: #c026d3;
	}

	.value-primitive.number {
		color: #d8b4fe; /* purple-200 */
	}
	.devtools-panel.light-theme .value-primitive.number {
		color: #7e22ce;
	}

	.value-primitive.bool {
		color: #fca5a5; /* red-200 */
	}
	.devtools-panel.light-theme .value-primitive.bool {
		color: #dc2626;
	}

	.value-primitive.null {
		color: var(--text-low);
	}

	/* --- RAW VIEW --- */
	.bg-darker {
		background: #0b1120;
	} /* even darker for code */
	.code-viewer {
		padding: 12px;
		overflow: auto;
		flex: 1;
	}
	.code-viewer pre {
		margin: 0;
		font-family: var(--font-mono);
		font-size: 12px;
		color: var(--text-mid);
	}

	/* --- PATHS TABLE --- */
	.table-container {
		flex: 1;
		overflow: auto;
	}
	.paths-table {
		width: 100%;
		border-collapse: collapse;
		font-family: var(--font-mono);
		font-size: 12px;
		table-layout: fixed;
	}
	.paths-table th {
		text-align: left;
		padding: 8px 12px;
		background: var(--bg-header);
		position: sticky;
		top: 0;
		z-index: 10;
		font-size: 11px;
		text-transform: uppercase;
		color: var(--text-low);
		font-weight: 600;
		border-bottom: 1px solid var(--border-low);
	}
	.paths-table td {
		padding: 6px 12px;
		border-bottom: 1px solid var(--border-low);
		color: var(--text-high);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.path-row:hover {
		background: rgba(255, 255, 255, 0.03);
	}
	.icon-only-btn {
		color: var(--text-low);
		padding: 4px;
		border-radius: 4px;
	}
	.icon-only-btn:hover {
		color: var(--accent-main);
		background: var(--bg-panel);
	}

	/* --- FOOTER --- */
	.devtools-footer {
		height: 28px;
		background: var(--bg-header);
		border-top: 1px solid var(--border-low);
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 12px;
		font-size: 11px;
		color: var(--text-low);
		flex-shrink: 0;
	}
	.footer-left {
		display: flex;
		gap: 12px;
	}

	/* --- MINIMIZED TOGGLE --- */
	.toggle-btn-minimized {
		position: fixed;
		bottom: 0;
		right: 24px;
		background: var(--bg-header);
		border: 1px solid var(--border-low);
		border-bottom: none;
		border-radius: 6px 6px 0 0;
		padding: 6px 12px;
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 12px;
		color: var(--text-mid);
		box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
		z-index: 99999;
	}
	.toggle-btn-minimized:hover {
		background: var(--bg-panel);
		color: var(--accent-main);
	}
	.status-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--text-low);
	}
	.status-dot.loaded {
		background: var(--success);
	}
	.status-dot.error {
		background: var(--error);
	}
</style>
