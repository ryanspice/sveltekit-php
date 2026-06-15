<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<h1>{data.slug}</h1>
<p>Locale: {data.locale}</p>
<p>Accept: {data.accept}</p>

