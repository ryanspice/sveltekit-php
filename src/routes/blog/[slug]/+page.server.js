export function load({ params }) {
	return {
		slug: params.slug,
		title: `Blog Post: ${params.slug}`,
		content: `This is a blog post with slug: ${params.slug}`
	};
}
