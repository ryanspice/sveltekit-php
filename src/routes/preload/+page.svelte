<script lang="ts">
	import { base } from '$app/paths';

	let { data }: { data: { timestamp?: string; heavy_data?: unknown[] } } = $props();
</script>

<div class="container">
	<h1>Preload Target</h1>
	<p>This page has data that can be preloaded on hover.</p>
	<p>Server Timestamp: {data?.timestamp ?? 'Loading...'}</p>
	<p>Data Length: {data?.heavy_data?.length ?? 0}</p>
	<a href="{base}/">Back to Home</a>
</div>

<style>
	.container {
		font-family: sans-serif;
		padding: 2rem;
	}
</style>
