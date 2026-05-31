export function load({ params }) {
	const publishedAt = new Date().toISOString();
	return {
		slug: params.slug,
		title: `Blog Post: ${params.slug}`,
		content: `This is a blog post with slug: ${params.slug}`,
		description: `Read blog post ${params.slug} in this SvelteKit + adapter demo.`,
		date: publishedAt
	};
}
