<script lang="ts">
	import { base } from '$app/paths';

	interface FileBrowserData {
		path: string[];
	}

	let { data = { path: [] } }: { data?: FileBrowserData } = $props();

	const pathSegments = $derived(normalizePathSegments(data?.path));
	const filePath = $derived(pathSegments.join('/'));

	function normalizePathSegments(path: string[]): string[] {
		return Array.isArray(path) ? path : [];
	}
</script>

<svelte:head>
	<title>File Browser: {filePath || 'Root'}</title>
	<meta name="description" content="Browse files and directories" />
</svelte:head>

<main>
	<h1>File Browser</h1>

	<nav aria-label="Breadcrumb">
		<ol>
			<li><a href="{base}/path-viewer">Root</a></li>
			{#each pathSegments as segment, i (segment + i)}
				<li>
					{#if i === pathSegments.length - 1}
						{segment}
					{:else}
						<a href="{base}/path-viewer/{pathSegments.slice(0, i + 1).join('/')}">{segment}</a>
					{/if}
				</li>
			{/each}
		</ol>
	</nav>

	<div class="file-info">
		<h2>Path: {filePath || 'Root Directory'}</h2>
		<p>This is a catch-all route demonstrating file browsing capabilities.</p>

		{#if pathSegments.length === 0}
			<p>Welcome to the root directory. Navigate to subdirectories by adding paths to the URL.</p>
		{:else}
			<p>You are currently viewing: <code>{filePath}</code></p>
		{/if}
	</div>

	<div class="actions">
		<h3>Available Actions</h3>
		<ul>
			<li><a href="{base}/path-viewer/test/document.pdf">View a sample document</a></li>
			<li><a href="{base}/path-viewer/images/photo.jpg">View a sample image</a></li>
			<li><a href="{base}/path-viewer/code/script.js">View a sample script</a></li>
		</ul>
	</div>
</main>

<style>
	nav ol {
		list-style: none;
		display: flex;
		gap: 0.5rem;
		padding: 0;
		margin: 1rem 0;
	}

	nav li:not(:last-child)::after {
		content: '/';
		margin-left: 0.5rem;
		color: #666;
	}

	.file-info {
		background: #f5f5f5;
		padding: 1rem;
		border-radius: 0.5rem;
		margin: 1rem 0;
	}

	.actions {
		margin-top: 2rem;
	}

	code {
		background: #e8e8e8;
		padding: 0.2rem 0.4rem;
		border-radius: 0.25rem;
		font-family: monospace;
	}
</style>
