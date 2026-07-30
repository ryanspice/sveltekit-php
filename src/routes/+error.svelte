<script lang="ts">
	import { page } from '$app/state';
</script>

<main class="error-page">
	<h1>{page.status}</h1>
	<p>{page.error?.message ?? 'Something went wrong.'}</p>
	<a href="/">Return home</a>
</main>

<style>
	.error-page {
		max-width: 42rem;
		margin: 4rem auto;
		padding: 2rem;
		font-family: sans-serif;
	}
</style>
