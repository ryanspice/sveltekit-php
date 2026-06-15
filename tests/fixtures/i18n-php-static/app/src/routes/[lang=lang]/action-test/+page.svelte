<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<h1>Action test {data.locale}</h1>
<form method="POST">
	<label>
		Value
		<input name="value" />
	</label>
	<button type="submit">Send</button>
</form>

