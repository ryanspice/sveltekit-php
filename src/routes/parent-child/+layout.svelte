<script lang="ts">
	import type { Snippet } from 'svelte';

	let { data, children }: { data: { layout_level_1?: string }; children: Snippet } = $props();
</script>

<div class="layout-1">
	<h2>Level 1 Layout</h2>
	<p>Layout Data: {data?.layout_level_1}</p>
	{@render children()}
</div>

<style>
	.layout-1 {
		border: 2px solid blue;
		padding: 1rem;
		margin: 1rem;
	}
</style>
