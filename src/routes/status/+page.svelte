<script lang="ts">
	import { resolve } from '$app/paths';

	let { data }: { data: { status?: number } } = $props();
</script>

<h1>Status Test</h1>
<p data-testid="status-code">Server returned status code: <strong>{data?.status}</strong></p>
<p><a href={resolve('/')}>Back to Home</a></p>
