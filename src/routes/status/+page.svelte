<script lang="ts">
	export let data: { status?: number };
</script>

<h1>Status Test</h1>
<p>Server returned status code: <strong>{data?.status}</strong></p>
<p><a href="/">Back to Home</a></p>
