export const prerender = true;
export const ssr = true;
export const trailingSlash = 'always';

import type { PageLoad } from './$types';

export const load: PageLoad = () => {
	return {
		message: 'Hello from JS Load'
	};
};
