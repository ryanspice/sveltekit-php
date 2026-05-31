<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionResult } from '@sveltejs/kit';

	type MultipartActionForm = {
		type: ActionResult['type'];
		data?: {
			success?: boolean;
			error?: string;
			uploadedFile?: {
				name: string;
				size: number;
				type: string;
			};
			title?: string;
			description?: string;
		};
	};

	type MultipartActionResult = {
		success?: boolean;
		error?: string;
		uploadedFile?: {
			name: string;
			size: number;
			type: string;
		};
		title?: string;
		description?: string;
	};

	export let form: MultipartActionResult | null = null;
	let loading = false;
	let selectedFile: File | null = null;
	let previewUrl: string | null = null;

	function handleFileSelect(event: Event) {
		const input = event.currentTarget as HTMLInputElement | null;
		const file = input?.files?.[0] ?? null;
		if (file) {
			selectedFile = file;
			previewUrl = URL.createObjectURL(file);
		}
	}

	function handleSubmit() {
		loading = true;
		return async (opts: { result: MultipartActionForm; [key: string]: unknown }) => {
			const { result } = opts;
			loading = false;
			if (result.type === 'success') {
				selectedFile = null;
				if (previewUrl) {
					URL.revokeObjectURL(previewUrl);
					previewUrl = null;
				}
			}
		};
	}
</script>

<svelte:head>
	<title>Multipart Form Actions</title>
</svelte:head>

<div class="container">
	<h1>Multipart Form Actions</h1>

	{#if form?.success}
		<div class="success">
			<p>✅ File uploaded successfully!</p>
			{#if form.uploadedFile}
				<p>File: {form.uploadedFile.name} ({form.uploadedFile.size} bytes)</p>
				<p>Type: {form.uploadedFile.type}</p>
			{/if}
		</div>
	{/if}

	{#if form?.error}
		<div class="error">
			<p>❌ {form.error}</p>
		</div>
	{/if}

	<form method="POST" enctype="multipart/form-data" use:enhance={handleSubmit}>
		<div class="form-group">
			<label for="title">Title</label>
			<input
				type="text"
				id="title"
				name="title"
				placeholder="Enter a title for your upload"
				value={form?.title || ''}
			/>
		</div>

		<div class="form-group">
			<label for="description">Description</label>
			<textarea id="description" name="description" rows="3" placeholder="Describe your upload"
				>{form?.description || ''}</textarea
			>
		</div>

		<div class="form-group">
			<label for="file">File Upload</label>
			<input
				type="file"
				id="file"
				name="file"
				accept="image/*,.pdf,.txt"
				on:change={handleFileSelect}
				required
			/>

			{#if selectedFile}
				<div class="file-info">
					<p><strong>Selected:</strong> {selectedFile.name}</p>
					<p><strong>Size:</strong> {(selectedFile.size / 1024).toFixed(2)} KB</p>
					<p><strong>Type:</strong> {selectedFile.type || 'Unknown'}</p>
				</div>
			{/if}
		</div>

		{#if previewUrl && selectedFile?.type?.startsWith('image/')}
			<div class="preview">
				<img src={previewUrl} alt="Preview" />
			</div>
		{/if}

		<div class="form-group">
			<label>
				<input type="checkbox" name="agree" required />
				I agree to the terms and conditions
			</label>
		</div>

		<button type="submit" disabled={loading}>
			{loading ? 'Uploading...' : 'Upload File'}
		</button>
	</form>

	<div class="info">
		<h3>Supported File Types</h3>
		<ul>
			<li>Images: JPG, PNG, GIF, WebP</li>
			<li>Documents: PDF, TXT</li>
			<li>Maximum file size: 10MB</li>
		</ul>
	</div>
</div>

<style>
	.container {
		max-width: 600px;
		margin: 2rem auto;
		padding: 2rem;
		background: #f9f9f9;
		border-radius: 8px;
	}

	h1 {
		color: #333;
		margin-bottom: 2rem;
	}

	.success {
		background: #d4edda;
		border: 1px solid #c3e6cb;
		color: #155724;
		padding: 1rem;
		border-radius: 4px;
		margin-bottom: 1rem;
	}

	.error {
		background: #f8d7da;
		border: 1px solid #f5c6cb;
		color: #721c24;
		padding: 1rem;
		border-radius: 4px;
		margin-bottom: 1rem;
	}

	.form-group {
		margin-bottom: 1.5rem;
	}

	label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: 600;
		color: #555;
	}

	input[type='text'],
	textarea {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid #ddd;
		border-radius: 4px;
		font-size: 1rem;
	}

	input[type='file'] {
		margin-bottom: 0.5rem;
	}

	input[type='checkbox'] {
		margin-right: 0.5rem;
	}

	.file-info {
		background: #e9ecef;
		padding: 0.75rem;
		border-radius: 4px;
		font-size: 0.9rem;
		margin-top: 0.5rem;
	}

	.preview {
		margin: 1rem 0;
		text-align: center;
	}

	.preview img {
		max-width: 200px;
		max-height: 200px;
		border-radius: 4px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	button {
		background: #007bff;
		color: white;
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: 4px;
		font-size: 1rem;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	button:hover:not(:disabled) {
		background: #0056b3;
	}

	button:disabled {
		background: #6c757d;
		cursor: not-allowed;
	}

	.info {
		margin-top: 2rem;
		padding: 1rem;
		background: #e3f2fd;
		border-radius: 4px;
	}

	.info h3 {
		margin-top: 0;
		color: #1976d2;
	}

	.info ul {
		margin: 0;
		padding-left: 1.5rem;
	}

	.info li {
		margin-bottom: 0.25rem;
	}
</style>
