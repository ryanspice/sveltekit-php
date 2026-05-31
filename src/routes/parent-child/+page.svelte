<script lang="ts">
	import { page } from '$app/state';
	import { browser } from '$app/environment';
	import { base } from '$app/paths';

	type ServerData = {
		parent?: string;
		child?: string;
	};

	let { data } = $props<{ data?: ServerData }>();

	let serverData: ServerData | undefined = $state();

	// Sync data when props change (initial load + navigation)
	$effect(() => {
		if (data) {
			serverData = data;
		}
	});

	// Fallback: Check page.data if prop is missing expected values
	$effect(() => {
		if (browser && (!serverData?.parent || !serverData?.child)) {
			const pData = page.data;
			if (pData?.parent && pData?.child) {
				serverData = pData;
			}
		}
	});
</script>

<div class="container">
	<h1>Parent-Child Merging</h1>
	<p>Parent Data: <strong>{serverData?.parent}</strong></p>
	<p>Child Data: <strong>{serverData?.child}</strong></p>

	<div class="status">
		{#if serverData?.parent && serverData?.child}
			<span style="color: green">✔ Merged Successfully</span>
		{:else}
			<span style="color: red">✘ Merge Failed (Expected during build)</span>
			{#if browser}
				<p style="font-size: 0.8em; color: #666;">Waiting for data hydration...</p>
			{/if}
		{/if}
	</div>

	<br />
	<a href="{base}/">Back to Home</a>
</div>

<style>
	.container {
		font-family: sans-serif;
		padding: 2rem;
	}
</style>
