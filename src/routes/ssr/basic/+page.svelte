<script>
	import { onMount } from 'svelte';
	
	export let data;
	
	let clientTime = '';
	let isClient = false;
	
	onMount(() => {
		isClient = true;
		updateTime();
		const interval = setInterval(updateTime, 1000);
		return () => clearInterval(interval);
	});
	
	function updateTime() {
		clientTime = new Date().toLocaleTimeString();
	}
</script>

<svelte:head>
	<title>SSR Basic Demo</title>
	<meta name="description" content="Demonstrates Server-Side Rendering with hydration" />
</svelte:head>

<main>
	<h1>Server-Side Rendering Basic Demo</h1>
	
	<div class="server-data">
		<h2>Server-Side Data</h2>
		<p>This data was rendered on the server:</p>
		<ul>
			<li><strong>Server Time:</strong> {data.serverTime}</li>
			<li><strong>Build Info:</strong> {data.buildInfo}</li>
			<li><strong>Environment:</strong> {data.environment}</li>
		</ul>
	</div>
	
	<div class="client-data">
		<h2>Client-Side Data</h2>
		<p>This updates live in the browser:</p>
		<ul>
			<li><strong>Client Time:</strong> {isClient ? clientTime : 'Loading...'}</li>
			<li><strong>Status:</strong> {isClient ? '✅ Hydrated' : '⏳ Hydrating...'}</li>
		</ul>
	</div>
	
	<div class="explanation">
		<h3>How SSR Works</h3>
		<p>This page demonstrates the classic SSR pattern:</p>
		<ol>
			<li>Server renders the initial HTML with data</li>
			<li>Client receives and displays the HTML immediately</li>
			<li>JavaScript loads and "hydrates" the page</li>
			<li>Interactive features become available</li>
		</ol>
	</div>
	
	<div class="features">
		<h3>SSR Benefits</h3>
		<ul>
			<li>✅ Fast initial page load</li>
			<li>✅ SEO-friendly content</li>
			<li>✅ Progressive enhancement</li>
			<li>✅ Works without JavaScript</li>
		</ul>
	</div>
</main>

<style>
	.server-data {
		background: #e8f4f8;
		padding: 1rem;
		border-radius: 0.5rem;
		margin: 1rem 0;
		border-left: 4px solid #4a90e2;
	}
	
	.client-data {
		background: #f0fff0;
		padding: 1rem;
		border-radius: 0.5rem;
		margin: 1rem 0;
		border-left: 4px solid #32cd32;
	}
	
	.explanation {
		background: #fff8dc;
		padding: 1rem;
		border-radius: 0.5rem;
		margin: 1rem 0;
	}
	
	.features {
		background: #f5f5f5;
		padding: 1rem;
		border-radius: 0.5rem;
		margin: 1rem 0;
	}
	
	ul {
		margin: 0.5rem 0;
		padding-left: 1.5rem;
	}
	
	li {
		margin: 0.25rem 0;
	}
	
	strong {
		color: #2c5282;
	}
</style>