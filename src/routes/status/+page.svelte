<script lang="ts">
	import { base } from '$app/paths';

	let { data }: { data: { status?: number } } = $props();
</script>

<h1>Status Test</h1>
<p data-testid="status-code">Server returned status code: <strong>{data?.status}</strong></p>
<p><a href="{base}/">Back to Home</a></p>
