<script lang="ts">
	import { page } from '$app/state';
	import { browser } from '$app/environment';

	let { data } = $props();
	let serverData = $state(data);

	$effect(() => {
		if (data) serverData = data;
	});
</script>

<div class="container">
	<h1>Streaming Response</h1>
	<p>Step 1: <strong>{serverData?.step1}</strong></p>

	<p>
		Step 2:
		{#if serverData?.step2}
			{#await serverData.step2}
				<span style="color: blue">Loading... (check network tab for progressive flush)</span>
			{:then val}
				<strong>{val}</strong>
			{:catch error}
				<span style="color: red">Error: {error.message}</span>
			{/await}
		{:else}
			<strong>No Data (Expected during build)</strong>
			{#if browser}
				<p style="font-size: 0.8em; color: #666;">Waiting for data hydration...</p>
			{/if}
		{/if}
	</p>

	<a href="/">Back to Home</a>
</div>

<style>
	.container {
		font-family: sans-serif;
		padding: 2rem;
	}
</style>
