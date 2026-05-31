<script lang="ts">
	import { base } from '$app/paths';

	const href = (p: string) => {
		const path = p.startsWith('/') ? p : `/${p}`;
		return `${base}${path}`;
	};

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
			<li><a href={href('ssr-data')}>SSR Data Injection</a></li>
			<li><a href={href('parent-child')}>Layout Merging (Level 1)</a></li>
			<li><a href={href('parent-child/nested')}>Layout Merging (Level 2 Nested)</a></li>
			<li><a href={href('stream')}>Streaming Response</a></li>
			<li><a href={href('form-basic')}>Form Actions (POST)</a></li>
			<li><a href={href('form-multipart')}>File Uploads</a></li>
			<li><a href={href('client-side')}>Client-Side Rendering (Hydration)</a></li>
			<li>
				<a href={href('preload')} data-sveltekit-preload-data="hover">Preload Data (Hover me)</a>
			</li>
			<li><a href={href('api/ping')} target="_blank">API Ping (JSON)</a></li>
			<li><a href={href('redirect-me')}>Redirect Test</a></li>
			<li><a href={href('status?code=404')}>404 Page</a></li>
			<a href={href('matrix/ssr-off')}>Matrix SSR off</a>
			<a href={href('matrix/ssr-on')}>Matrix SSR on</a>
			<li><a href={href('matrix/dynamic-ssr')}>Matrix: Dynamic SSR</a></li>
			<li><a href={href('negotiate')}>Negotiation</a></li>
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
