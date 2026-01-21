<script lang="ts">
	import { page } from '$app/state';
	import { browser } from '$app/environment';

	type ServerData = {
		parent?: string;
		child?: string;
		nested?: string;
	};

	let { data } = $props<{ data?: ServerData }>();
	let serverData: ServerData | undefined = $state();

	$effect(() => {
		if (data) serverData = data;
	});

	$effect(() => {
		if (browser && (!serverData?.parent || !serverData?.nested)) {
			const pData = page.data;
			if (pData?.parent && pData?.nested) {
				serverData = pData;
			}
		}
	});
</script>

<div class="container">
	<h1>Nested Deep Child</h1>
	<p>Grandparent Data: <strong>{serverData?.parent}</strong></p>
	<p>
		Parent Data (Layout): <strong>{serverData?.child}</strong> (Note: This was 'child' in sibling page,
		but here we don't inherit it unless it's in a layout)
	</p>
	<p>Own Data: <strong>{serverData?.nested}</strong></p>

	<p>
		Wait, 'child' data was in `+page.server.php` of parent directory? That won't be inherited. Only
		`+layout.server.php` data is inherited.
	</p>

	<div class="status">
		{#if serverData?.parent && serverData?.nested}
			<span style="color: green">✔ Inherited Grandparent & Own Data</span>
		{:else}
			<span style="color: red">✘ Data Missing (Expected during build)</span>
			{#if browser}
				<p style="font-size: 0.8em; color: #666;">Waiting for data hydration...</p>
			{/if}
		{/if}
	</div>

	<br />
	<a href="/parent-child">Back to Level 1</a>
</div>

<style>
	.container {
		font-family: sans-serif;
		padding: 2rem;
		border: 2px dashed #666;
		margin: 1rem;
	}
</style>
