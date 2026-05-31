<script>
	import { base } from '$app/paths';
</script>

<svelte:head>
	<title>Parent Layout</title>
	<meta name="description" content="Parent level of nested layout demonstration" />
</svelte:head>

<main>
	<h1>Parent Layout</h1>
	<p>This is the parent level of a nested layout hierarchy.</p>

	<slot />
</main>

<nav>
	<h3>Navigate the hierarchy:</h3>
	<ul>
		<li><strong>Parent level</strong> (current)</li>
		<li><a href="{base}/layout/parent/child">Child level</a></li>
		<li><a href="{base}/layout/parent/child/grandchild">Grandchild level</a></li>
	</ul>
</nav>
