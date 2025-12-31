<script>
	let { data, form } = $props();
</script>

<h1>PHP-backed page (HMR + Data Working! + WSs)</h1>

<div class="card">
	<h2>Server data</h2>
	<pre>{JSON.stringify(data, null, 2)}</pre>
</div>

<div class="card">
	<h2>Form action</h2>
	<form method="POST" action="?/save">
		<label>
			Note
			<input name="note" />
		</label>
		<button>Save</button>
	</form>

	{#if form}
		<p><strong>{form.message}</strong></p>
	{/if}
</div>

<style>
	.card {
		border: 1px solid #ccc;
		padding: 1rem;
		margin: 1rem 0;
		border-radius: 4px;
	}
</style>
