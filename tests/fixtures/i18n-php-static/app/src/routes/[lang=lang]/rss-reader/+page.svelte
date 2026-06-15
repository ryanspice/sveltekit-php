<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<h1>RSS reader</h1>
<a href={data.feedPath}>Feed</a>

