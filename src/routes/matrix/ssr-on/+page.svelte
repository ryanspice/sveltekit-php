<script lang="ts">
	let { data } = $props<{ data: { message?: string } }>();
</script>

<h1>SSR ON</h1>
<p>Message: {data.message}</p>
