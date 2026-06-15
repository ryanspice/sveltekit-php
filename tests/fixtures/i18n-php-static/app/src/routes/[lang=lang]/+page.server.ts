import type { EntryGenerator, PageServerLoad } from './$types';

export const prerender = true;

export const entries: EntryGenerator = () => [{ lang: 'fr' }];

export const load: PageServerLoad = ({ params }) => {
	return {
		locale: params.lang,
		title: 'Accueil francais'
	};
};

