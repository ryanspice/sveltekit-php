<svelte:head>
	<title>No hydration prerender fixture</title>
	<meta
		name="description"
		content="SvelteKit PHP fixture proving a prerendered csr=false page keeps stable SSR HTML without client hydration scripts."
	/>
</svelte:head>

<main data-fixture="no-hydration-fixture" data-contract="csr-disabled-prerender-contract">
	<h1>No hydration prerender fixture</h1>
	<p>
		This fixture is intentionally prerendered with csr=false so adapter smoke can catch blog-style
		regressions where client hydration scripts repaint a stable server-rendered theme.
	</p>
	<p><strong>Contract:</strong> theme-stable-ssr-html</p>
</main>
