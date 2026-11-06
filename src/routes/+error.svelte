<script lang="ts">
	import { resolve } from '$app/paths';

	let { error }: { error: App.Error } = $props();
</script>

<main class="error-page">
	<h1>{error.status}</h1>
	<p>{error.message}</p>
	<a href={resolve('/')}>Return home</a>
</main>

<style>
	.error-page {
		max-width: 42rem;
		margin: 4rem auto;
		padding: 2rem;
		font-family: sans-serif;
	}
</style>
