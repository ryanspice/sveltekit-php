<script>
	import { enhance } from '$app/forms';

	let { form } = $props();
</script>

<svelte:head>
	<title>Actions Basic Demo</title>
	<meta name="description" content="Demonstrates basic form actions in SvelteKit" />
</svelte:head>

<main>
	<h1>Basic Actions Demo</h1>

	<div class="form-section">
		<h2>Simple Form Action</h2>
		<form method="POST" action="?/process" use:enhance>
			<div class="form-group">
				<label for="name">Name:</label>
				<input type="text" id="name" name="name" required />
			</div>

			<div class="form-group">
				<label for="email">Email:</label>
				<input type="email" id="email" name="email" required />
			</div>

			<div class="form-group">
				<label for="message">Message:</label>
				<textarea id="message" name="message" rows="4" required></textarea>
			</div>

			<button type="submit">Submit</button>
		</form>
	</div>

	{#if form}
		<div class="result {form.success ? 'success' : 'error'}">
			<h3>Result:</h3>
			{#if form.success}
				<p>✅ Success! Data processed successfully.</p>
				{#if form.data}
					<pre>{JSON.stringify(form.data, null, 2)}</pre>
				{/if}
			{:else}
				<p>❌ Error: {form.message || 'Something went wrong'}</p>
			{/if}
		</div>
	{/if}

	<div class="info">
		<h3>How Actions Work</h3>
		<p>SvelteKit actions handle form submissions server-side:</p>
		<ol>
			<li>Form data is sent to the server</li>
			<li>Server processes the data</li>
			<li>Results are returned to the client</li>
			<li>Page updates automatically</li>
		</ol>
	</div>

	<div class="features">
		<h3>Action Benefits</h3>
		<ul>
			<li>✅ Server-side validation</li>
			<li>✅ Automatic form enhancement</li>
			<li>✅ Progressive enhancement</li>
			<li>✅ Built-in error handling</li>
		</ul>
	</div>
</main>

<style>
	.form-section {
		background: #f8f9fa;
		padding: 1.5rem;
		border-radius: 0.5rem;
		margin: 1rem 0;
	}

	.form-group {
		margin-bottom: 1rem;
	}

	label {
		display: block;
		margin-bottom: 0.25rem;
		font-weight: 500;
	}

	input,
	textarea {
		width: 100%;
		padding: 0.5rem;
		border: 1px solid #ccc;
		border-radius: 0.25rem;
		font-size: 1rem;
	}

	input:focus,
	textarea:focus {
		outline: none;
		border-color: #4a90e2;
		box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.2);
	}

	button {
		background: #4a90e2;
		color: white;
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: 0.25rem;
		font-size: 1rem;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	button:hover:not(:disabled) {
		background: #357abd;
	}

	button:disabled {
		background: #ccc;
		cursor: not-allowed;
	}

	.result {
		padding: 1rem;
		border-radius: 0.5rem;
		margin: 1rem 0;
	}

	.result.success {
		background: #e8f5e8;
		border-left: 4px solid #32cd32;
	}

	.result.error {
		background: #ffeaea;
		border-left: 4px solid #ff6b6b;
	}

	.result pre {
		background: #f5f5f5;
		padding: 0.5rem;
		border-radius: 0.25rem;
		overflow-x: auto;
		font-size: 0.9rem;
	}

	.info {
		background: #fff8dc;
		padding: 1rem;
		border-radius: 0.5rem;
		margin: 1rem 0;
	}

	.features {
		background: #f0fff0;
		padding: 1rem;
		border-radius: 0.5rem;
		margin: 1rem 0;
		border-left: 4px solid #32cd32;
	}

	ol {
		margin: 0.5rem 0;
		padding-left: 1.5rem;
	}

	li {
		margin: 0.25rem 0;
	}
</style>
