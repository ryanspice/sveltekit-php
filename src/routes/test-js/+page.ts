export const prerender = true;
export const ssr = true;
export const trailingSlash = 'always';

export const load = () => {
	return {
		message: 'Hello from JS Load'
	};
};
