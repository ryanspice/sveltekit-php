<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';

	type UploadForm = {
		filename?: string;
		size?: number;
		file?: { original_name: string; size: number };
		error?: string;
	};

	let { form }: { form?: UploadForm | null } = $props();
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
			{#if form.error}
				<p>{form.error}</p>
			{:else}
				<p>Filename: {form.file?.original_name ?? form.filename}</p>
				<p>Size: {form.file?.size ?? form.size} bytes</p>
			{/if}
		</div>
	{/if}

	<br />
	<a href={resolve('/')}>Back to Home</a>
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
