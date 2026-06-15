import type { EntryGenerator, PageServerLoad } from './$types';

export const prerender = true;

export const entries: EntryGenerator = () => [{ lang: 'fr', slug: 'demo' }];

export const load: PageServerLoad = ({ params, request }) => {
	return {
		locale: params.lang,
		slug: params.slug,
		accept: request.headers.get('accept') ?? ''
	};
};

