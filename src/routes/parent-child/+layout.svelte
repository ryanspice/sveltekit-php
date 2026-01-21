<script lang="ts">
	export let data: { layout_level_1?: string };
</script>

<div class="layout-1">
	<h2>Level 1 Layout</h2>
	<p>Layout Data: {data?.layout_level_1}</p>
	<slot />
</div>

<style>
	.layout-1 {
		border: 2px solid blue;
		padding: 1rem;
		margin: 1rem;
	}
</style>
