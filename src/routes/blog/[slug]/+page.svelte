<script>
	export let data;
</script>

<svelte:head>
	<title>Blog Post: {data.title}</title>
	<meta name="description" content={data.description} />
</svelte:head>

<main>
	<article>
		<h1>{data.title}</h1>
		<p class="meta">Published: {data.date}</p>
		<div class="content">
			<!-- eslint-disable-next-line svelte/no-at-html-tags -->
			{@html data.content}
		</div>
	</article>
</main>

<style>
	main {
		padding: 2rem;
		max-width: 800px;
		margin: 0 auto;
	}
	article {
		background: white;
		padding: 2rem;
		border-radius: 8px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}
	h1 {
		color: #1e40af;
		margin-bottom: 0.5rem;
	}
	.meta {
		color: #6b7280;
		font-style: italic;
		margin-bottom: 2rem;
	}
	.content {
		line-height: 1.6;
	}
</style>
