<script>
	import { enhance } from '$app/forms';
	
	export let form;
	
	let activeAction = 'process';
	let loading = false;
	
	function handleSubmit(event) {
		loading = true;
		// The form action will be set by the selected button
		return async ({ result }) => {
			loading = false;
			// Handle the result
			console.log('Action result:', result);
		};
	}
</script>

<svelte:head>
	<title>Actions Named Demo</title>
	<meta name="description" content="Demonstrates named form actions in SvelteKit" />
</svelte:head>

<main>
	<h1>Named Actions Demo</h1>
	
	<div class="action-selector">
		<h2>Choose an Action</h2>
		<p>SvelteKit supports multiple named actions on the same page:</p>
		
		<div class="action-buttons">
			<button 
				on:click={() => activeAction = 'process'}
				class:active={activeAction === 'process'}
				formaction="?/process"
			>
				Process Data
			</button>
			<button 
				on:click={() => activeAction = 'validate'}
				class:active={activeAction === 'validate'}
				formaction="?/validate"
			>
				Validate Only
			</button>
			<button 
				on:click={() => activeAction = 'save'}
				class:active={activeAction === 'save'}
				formaction="?/save"
			>
				Save Data
			</button>
		</div>
	</div>
	
	<div class="form-section">
		<h2>Form with Named Action: {activeAction}</h2>
		<form method="POST" action="?/{activeAction}" use:enhance={handleSubmit}>
			<div class="form-group">
				<label for="data">Data Input:</label>
				<textarea id="data" name="data" rows="4" placeholder="Enter some data to process..."></textarea>
			</div>
			
			<div class="form-group">
				<label for="options">Options:</label>
				<select id="options" name="options">
					<option value="default">Default</option>
					<option value="strict">Strict Mode</option>
					<option value="lenient">Lenient Mode</option>
				</select>
			</div>
			
			<button type="submit" disabled={loading}>
				{loading ? 'Processing...' : `Run ${activeAction}`}
			</button>
		</form>
	</div>
	
	{#if form}
		<div class="result {form.success ? 'success' : 'error'}">
			<h3>Action Result: {form.action}</h3>
			{#if form.success}
				<p>✅ Success! Action completed successfully.</p>
				{#if form.data}
					<pre>{JSON.stringify(form.data, null, 2)}</pre>
				{/if}
				{#if form.message}
					<p><strong>Message:</strong> {form.message}</p>
				{/if}
			{:else}
				<p>❌ Error: {form.message || 'Something went wrong'}</p>
			{/if}
		</div>
	{/if}
	
	<div class="info">
		<h3>How Named Actions Work</h3>
		<p>SvelteKit allows multiple named actions on the same page:</p>
		<ol>
			<li>Each action has a unique name</li>
			<li>Form action attribute specifies which action to run</li>
			<li>Actions can have different logic and return different results</li>
			<li>Same form can trigger different actions</li>
		</ol>
	</div>
	
	<div class="features">
		<h3>Named Action Benefits</h3>
		<ul>
			<li>✅ Multiple operations on same page</li>
			<li>✅ Cleaner code organization</li>
			<li>✅ Reusable form components</li>
			<li>✅ Flexible user interactions</li>
		</ul>
	</div>
</main>

<style>
	.action-selector {
		background: #f8f9fa;
		padding: 1.5rem;
		border-radius: 0.5rem;
		margin: 1rem 0;
	}
	
	.action-buttons {
		display: flex;
		gap: 1rem;
		margin: 1rem 0;
		flex-wrap: wrap;
	}
	
	.action-buttons button {
		padding: 0.75rem 1.5rem;
		border: 2px solid #ccc;
		background: white;
		border-radius: 0.5rem;
		cursor: pointer;
		transition: all 0.2s;
		font-size: 1rem;
	}
	
	.action-buttons button:hover {
		border-color: #4a90e2;
		color: #4a90e2;
	}
	
	.action-buttons button.active {
		background: #4a90e2;
		border-color: #4a90e2;
		color: white;
	}
	
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
	
	textarea, select {
		width: 100%;
		padding: 0.5rem;
		border: 1px solid #ccc;
		border-radius: 0.25rem;
		font-size: 1rem;
	}
	
	textarea:focus, select:focus {
		outline: none;
		border-color: #4a90e2;
		box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.2);
	}
	
	button[type="submit"] {
		background: #4a90e2;
		color: white;
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: 0.25rem;
		font-size: 1rem;
		cursor: pointer;
		transition: background-color 0.2s;
	}
	
	button[type="submit"]:hover:not(:disabled) {
		background: #357abd;
	}
	
	button[type="submit"]:disabled {
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
	
	strong {
		color: #2c5282;
	}
</style>