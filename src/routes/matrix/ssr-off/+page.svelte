<script lang="ts">
	let { data } = $props<{ data: { message?: string } }>();
</script>

<h1>SSR OFF</h1>
<p>Message: {data.message}</p>
