<script>
	import DebugData from '$lib/components/DebugData.svelte';
	import favicon from '$lib/assets/favicon.svg';
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<slot />

<DebugData />

<style>
	:global(body) {
		margin: 0;
		font-family:
			-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen-Sans, Ubuntu, Cantarell,
			'Helvetica Neue', sans-serif;
	}
</style>
