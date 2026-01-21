<script lang="ts">
	import { base } from '$app/paths';
	export let data: { title?: string; description?: string; app_name?: string };
</script>

<svelte:head>
	<title>{data?.app_name ?? data?.title ?? 'SvelteKit PHP Demo'}</title>
</svelte:head>

<div class="hero">
	<h1>{data?.title ?? 'SvelteKit PHP Adapter'}</h1>
	<p>{data?.description ?? 'Welcome to the test suite.'}</p>

	<div class="menu">
		<h2>Test Scenarios</h2>
		<ul>
			<li><a href="{base}/ssr-data">SSR Data Injection</a></li>
			<li><a href="{base}/parent-child">Layout Merging (Level 1)</a></li>
			<li><a href="{base}/parent-child/nested">Layout Merging (Level 2 Nested)</a></li>
			<li><a href="{base}/stream">Streaming Response</a></li>
			<li><a href="{base}/form-basic">Form Actions (POST)</a></li>
			<li><a href="{base}/form-multipart">File Uploads</a></li>
			<li><a href="{base}/client-side">Client-Side Rendering (Hydration)</a></li>
			<li>
				<a href="{base}/preload" data-sveltekit-preload-data="hover">Preload Data (Hover me)</a>
			</li>
			<li><a href="{base}/api/ping" target="_blank">API Ping (JSON)</a></li>
			<li><a href="{base}/redirect-me">Redirect Test</a></li>
			<li><a href="{base}/status?code=404">404 Page</a></li>
			<li><a href="{base}/matrix/ssr-on">Matrix: SSR On</a></li>
			<li><a href="{base}/matrix/ssr-off">Matrix: SSR Off</a></li>
			<li><a href="{base}/matrix/dynamic-ssr">Matrix: Dynamic SSR</a></li>
			<li><a href="{base}/negotiate">Negotiation</a></li>
		</ul>
	</div>
</div>

<style>
	.hero {
		font-family: sans-serif;
		max-width: 800px;
		margin: 0 auto;
		padding: 2rem;
	}
	.menu ul {
		list-style: none;
		padding: 0;
	}
	.menu li {
		margin: 0.5rem 0;
	}
	.menu a {
		display: block;
		padding: 1rem;
		background: #f0f0f0;
		text-decoration: none;
		color: #333;
		border-radius: 4px;
	}
	.menu a:hover {
		background: #e0e0e0;
	}
</style>
