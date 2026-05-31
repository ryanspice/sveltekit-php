<script>
	import { base } from '$app/paths';
</script>

<svelte:head>
	<title>Child Layout</title>
	<meta name="description" content="Child level of nested layout demonstration" />
</svelte:head>

<main>
	<h1>Child Layout</h1>
	<p>This is the child level of a nested layout hierarchy.</p>
	
	<slot />
</main>

<nav>
	<h3>Navigate the hierarchy:</h3>
	<ul>
		<li><a href="{base}/layout/parent">Parent level</a></li>
		<li><strong>Child level</strong> (current)</li>
		<li><a href="{base}/layout/parent/child/grandchild">Grandchild level</a></li>
	</ul>
</nav>