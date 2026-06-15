import type { Actions, EntryGenerator, PageServerLoad } from './$types';

export const prerender = true;

export const entries: EntryGenerator = () => [{ lang: 'fr' }];

export const load: PageServerLoad = ({ params }) => {
	return {
		locale: params.lang
	};
};

export const actions: Actions = {
	default: async ({ params, request }) => {
		const form = await request.formData();
		return {
			locale: params.lang,
			value: String(form.get('value') ?? '')
		};
	}
};

