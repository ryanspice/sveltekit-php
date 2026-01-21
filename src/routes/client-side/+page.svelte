<script>
	import { onMount } from 'svelte';

	let loaded = false;
	let time = '';

	onMount(() => {
		// This only runs on client
		loaded = true;
		time = new Date().toLocaleTimeString();

		const interval = setInterval(() => {
			time = new Date().toLocaleTimeString();
		}, 1000);

		return () => clearInterval(interval);
	});
</script>

<div class="container">
	<h1>Client-Side Rendering</h1>

	<p>This section relies on JS hydration.</p>

	{#if loaded}
		<div class="box success">
			<h3>✔ Hydrated</h3>
			<p>Current Time: <strong>{time}</strong></p>
		</div>
	{:else}
		<div class="box warning">
			<h3>⚠ Loading / SSR Only</h3>
			<p>Waiting for client-side JavaScript...</p>
		</div>
	{/if}

	<p class="note">
		If you see the time updating, SvelteKit is successfully running on the client after PHP served
		the initial HTML.
	</p>

	<a href="/">Back to Home</a>
</div>

<style>
	.container {
		font-family: sans-serif;
		padding: 2rem;
	}
	.box {
		padding: 1rem;
		border-radius: 4px;
		margin: 1rem 0;
	}
	.success {
		background: #d4edda;
		border: 1px solid #c3e6cb;
		color: #155724;
	}
	.warning {
		background: #fff3cd;
		border: 1px solid #ffeeba;
		color: #856404;
	}
	.note {
		color: #666;
		font-style: italic;
	}
</style>
