import { resolve as resolvePath } from '$app/paths';

/** @type {import('@sveltejs/kit/hooks').Handle} */
export async function handle({ event, resolve }) {
	// Negotiation test support for js-ssr.
	if (event.url.pathname.endsWith('/negotiate')) {
		const accept = event.request.headers.get('accept') || '';
		if (accept.includes('application/json')) {
			return new Response(JSON.stringify({ message: 'Negotiated API' }), {
				headers: {
					'Content-Type': 'application/json',
					Vary: 'Accept'
				}
			});
		}
		// Ensure HTML response also has Vary: Accept
		const response = await resolve(event);
		response.headers.append('Vary', 'Accept');
		return response;
	}

	const response = await resolve(event);

	// Intercept 404 and 500 errors
	if (response.status === 404 || response.status === 500) {
		// Resolve within this application, including a configured deployment base.
		const home = resolvePath('/');
		const appPath = event.url.pathname.slice(home.replace(/\/$/, '').length);

		// Do not redirect API requests (let them 404 naturally)
		if (appPath.startsWith('/api/')) {
			return response;
		}
		if (appPath.endsWith('/__data.json')) return response;
		if (appPath.startsWith('/_app/') || /\.[^/]+$/.test(appPath)) {
			return new Response(response.status === 404 ? 'Not Found' : 'Internal Server Error', {
				status: response.status,
				headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' }
			});
		}

		// Ignore favicon.ico
		if (event.url.pathname.endsWith('/favicon.ico')) {
			return new Response(null, { status: 404 });
		}

		process.emitWarning(`[Error Handled] ${response.status} at ${event.url.pathname} - Redirecting to /`);

		// Redirect to home page with cookie
		return new Response(null, {
			status: 307,
			headers: {
				Location: home,
				'Set-Cookie': `redirected_from=${encodeURIComponent(event.url.pathname)}; Path=${home}; Max-Age=10; SameSite=Lax; HttpOnly${
					event.url.protocol === 'https:' ? '; Secure' : ''
				}`
			}
		});
	}

	return response;
}

/** @type {import('@sveltejs/kit/hooks').HandleServerError} */
export function handleError({ kind, error }) {
	// Kit 3 sends safe app/framework errors through this hook as well.
	if (kind !== 'unknown') return error;
	process.emitWarning(error instanceof Error ? error.message : String(error));

	// We can't return a redirect here, but we've handled the redirect in 'handle'
	// by checking the response status.
	return {
		status: 500,
		message: 'Internal Server Error'
	};
}
