<svelte:head>
	<title>Layout Demo - Child</title>
	<meta name="description" content="Child page for nested layout demonstration" />
</svelte:head>

<section class="layout-page">
	<h2>Child route content</h2>
	<p>
		This page makes the child layout route a real prerender target while preserving
		the inherited parent and child layout chrome.
	</p>
</section>

<style>
	.layout-page {
		background: #fff8dc;
		border-radius: 0.5rem;
		margin: 1rem 0;
		padding: 1rem;
	}
</style>
