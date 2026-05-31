<script>
	import { base } from '$app/paths';

	export let data;

	// Optional parameter - could be undefined
	$: id = data?.id;
</script>

<svelte:head>
	<title>Optional Route {id ? `- ID: ${id}` : ''}</title>
	<meta name="description" content="Demonstrates optional parameters in SvelteKit routing" />
</svelte:head>

<main>
	<h1>Optional Parameter Demo</h1>

	{#if id}
		<div class="with-id">
			<h2>Route with ID: {id}</h2>
			<p>This route was accessed with an optional parameter: <code>{id}</code></p>
			<p>The parameter is optional, so this route works both with and without it.</p>
		</div>
	{:else}
		<div class="without-id">
			<h2>Route without ID</h2>
			<p>This route was accessed without any parameters.</p>
			<p>Optional parameters allow flexible URL patterns.</p>
		</div>
	{/if}

	<div class="examples">
		<h3>Try these URLs:</h3>
		<ul>
			<li><a href="{base}/optional">/optional</a> (no parameter)</li>
			<li><a href="{base}/optional/123">/optional/123</a> (with parameter)</li>
			<li><a href="{base}/optional/abc">/optional/abc</a> (with string parameter)</li>
		</ul>
	</div>

	<div class="info">
		<h3>How it works</h3>
		<p>Double brackets <code>[[id]]</code> make the parameter optional in SvelteKit routing.</p>
		<p>This is useful for routes that can work with or without additional context.</p>
	</div>
</main>

<style>
	.examples {
		margin: 2rem 0;
		padding: 1rem;
		background: #f8f9fa;
		border-radius: 0.5rem;
	}

	.info {
		margin: 2rem 0;
		padding: 1rem;
		background: #e8f4f8;
		border-radius: 0.5rem;
	}

	code {
		background: #e8e8e8;
		padding: 0.2rem 0.4rem;
		border-radius: 0.25rem;
		font-family: monospace;
	}

	ul {
		list-style-type: none;
		padding: 0;
	}

	li {
		margin: 0.5rem 0;
	}

	a {
		color: #0066cc;
		text-decoration: none;
	}

	a:hover {
		text-decoration: underline;
	}
</style>
