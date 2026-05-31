<script>
	import { base } from '$app/paths';
	// No data needed for this page
</script>

<svelte:head>
	<title>Layout Demo - Grandchild</title>
	<meta name="description" content="Demonstrates nested layout inheritance" />
</svelte:head>

<main>
	<h1>Layout Demo: Grandchild Page</h1>

	<div class="layout-info">
		<p>This is the <strong>grandchild</strong> page in a nested layout structure.</p>
		<p>It demonstrates how SvelteKit layouts cascade through nested routes.</p>
	</div>

	<div class="hierarchy">
		<h3>Layout Hierarchy</h3>
		<ol>
			<li>Root layout (applies to all pages)</li>
			<li>Parent layout (applies to /layout/parent and children)</li>
			<li>Child layout (applies to /layout/parent/child and children)</li>
			<li><strong>Grandchild page</strong> (this page)</li>
		</ol>
	</div>

	<div class="navigation">
		<h3>Navigate the hierarchy:</h3>
		<ul>
			<li><a href="{base}/layout/parent">Parent level</a></li>
			<li><a href="{base}/layout/parent/child">Child level</a></li>
			<li><strong>Grandchild level</strong> (current)</li>
		</ul>
	</div>

	<div class="content">
		<h3>Content Inheritance</h3>
		<p>Each level can add its own content while preserving parent layout elements.</p>
		<p>This creates a consistent user experience while allowing flexibility.</p>
	</div>
</main>

<style>
	.layout-info {
		background: #f0f8ff;
		padding: 1rem;
		border-left: 4px solid #4a90e2;
		margin: 1rem 0;
	}

	.hierarchy {
		background: #f8f8f8;
		padding: 1rem;
		border-radius: 0.5rem;
		margin: 1rem 0;
	}

	.hierarchy ol {
		margin: 0.5rem 0;
		padding-left: 1.5rem;
	}

	.navigation {
		background: #fff8dc;
		padding: 1rem;
		border-radius: 0.5rem;
		margin: 1rem 0;
	}

	.navigation ul {
		list-style: none;
		padding: 0;
		margin: 0.5rem 0;
	}

	.navigation li {
		margin: 0.5rem 0;
	}

	.content {
		background: #f5f5f5;
		padding: 1rem;
		border-radius: 0.5rem;
		margin: 1rem 0;
	}

	a {
		color: #0066cc;
		text-decoration: none;
	}

	a:hover {
		text-decoration: underline;
	}

	strong {
		color: #2c5282;
	}
</style>
