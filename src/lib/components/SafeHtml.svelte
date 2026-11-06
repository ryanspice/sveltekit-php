<script lang="ts">
	type Props = {
		/** Legacy prop name: this component renders plain text, never trusted HTML markup. */
		html: string;
		class?: string;
	};

	let { html, class: className }: Props = $props();
</script>

<div class={className}>
	{html}
</div>
