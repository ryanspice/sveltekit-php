<script lang="ts">
	type Props = {
		html: string;
		class?: string;
	};

	let { html, class: className }: Props = $props();
</script>

<div class={className}>
	{@html html}
</div>
