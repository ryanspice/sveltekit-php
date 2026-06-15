<svelte:head>
	<title>Layout Demo - Parent</title>
	<meta name="description" content="Parent page for nested layout demonstration" />
</svelte:head>

<section class="layout-page">
	<h2>Parent route content</h2>
	<p>
		This page makes the parent layout route a real prerender target instead of a
		layout-only navigation placeholder.
	</p>
</section>

<style>
	.layout-page {
		background: #f8f8f8;
		border-radius: 0.5rem;
		margin: 1rem 0;
		padding: 1rem;
	}
</style>
