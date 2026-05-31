<script lang="ts">
	import { base } from '$app/paths';

	type StreamData = {
		step1?: string;
		step2?: Promise<string>;
	};

	let { data } = $props<{ data: StreamData }>();
</script>

<div class="container">
	<h1>Streaming Response</h1>

	<p>Step 1: <strong>{data.step1}</strong></p>

	<div>
		Step 2:
		{#if data.step2}
			{#await data.step2}
				<span style="color: blue">Loading... (check network tab for progressive flush)</span>
			{:then val}
				<strong>{val}</strong>
			{:catch err}
				<span style="color: red">Error: {err.message}</span>
			{/await}
		{:else}
			<span>(step2 missing)</span>
		{/if}
	</div>

	<a href="{base}/">Back to Home</a>
</div>
