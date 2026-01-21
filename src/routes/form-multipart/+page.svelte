<script>
	import { enhance } from '$app/forms';
	export let form;
</script>

<div class="container">
	<h1>File Upload</h1>

	<form method="POST" enctype="multipart/form-data" use:enhance>
		<label>
			Select File:
			<input type="file" name="file" />
		</label>
		<button>Upload</button>
	</form>

	{#if form}
		<div class="result">
			<h3>Result:</h3>
			<p>Filename: {form.filename}</p>
			<p>Size: {form.size} bytes</p>
		</div>
	{/if}

	<br />
	<a href="/">Back to Home</a>
</div>

<style>
	.container {
		font-family: sans-serif;
		padding: 2rem;
	}
	.result {
		margin-top: 1rem;
		padding: 1rem;
		background: #eee;
		border-radius: 4px;
	}
</style>
