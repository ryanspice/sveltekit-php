<script lang="ts">
	import { browser } from '$app/environment';
	import { base } from '$app/paths';

	let { data }: { data?: { message?: string } } = $props();
</script>

<div class="container">
	<h1>SSR Data</h1>

	{#if data?.message}
		<p>Message from server: <strong>{data.message}</strong></p>
	{:else}
		<p>Message from server: <strong>Waiting for PHP...</strong></p>
	{/if}

	{#if browser}
		<div class="debug-info">
			<h3>Debug Info</h3>
			<p>Data Type: {typeof data}</p>
			<p>Is Array: {Array.isArray(data)}</p>
			<p>Keys: {JSON.stringify(data ? Object.keys(data) : [])}</p>
			<p>Raw: {JSON.stringify(data, null, 2)}</p>
			<p>Message Value: {JSON.stringify(data?.message)}</p>
		</div>
	{/if}

	<a href="{base}/">Back to Home</a>
</div>

<style>
	.container {
		font-family: sans-serif;
		padding: 2rem;
	}

	.debug-info {
		margin-top: 1em;
		border: 1px solid red;
		padding: 1em;
		background: #fff;
	}
</style>
