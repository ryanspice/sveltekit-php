/** @type {import('@sveltejs/kit').Handle} */
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
		// Do not redirect API requests (let them 404 naturally)
		if (event.url.pathname.startsWith('/api/')) {
			return response;
		}

		// Ignore favicon.ico
		if (event.url.pathname === '/favicon.ico') {
			return new Response(null, { status: 404 });
		}

		process.emitWarning(`[Error Handled] ${response.status} at ${event.url.pathname} - Redirecting to /`);

		// Determine the redirect origin
		// 1. Trust PROXY_ORIGIN env var if set (from dev-server.js)
		// 2. Trust X-Forwarded-Host (from proxy)
		// 3. Fallback to Host header or event.url.origin
		let origin = process.env.PROXY_ORIGIN;

		if (!origin) {
			const forwardedHost = event.request.headers.get('x-forwarded-host');
			if (forwardedHost) {
				origin = `${event.url.protocol}//${forwardedHost}`;
			} else {
				const host = event.request.headers.get('host');
				origin = host ? `${event.url.protocol}//${host}` : event.url.origin;
			}
		}

		process.emitWarning(`[Hooks] Redirecting to origin: ${origin}`);

		// Redirect to home page with cookie
		return new Response(null, {
			status: 307,
			headers: {
				Location: `${origin}/`,
				'Set-Cookie': `redirected_from=${event.url.pathname}; Path=/; Max-Age=10; SameSite=Lax; HttpOnly${
					event.url.protocol === 'https:' ? '; Secure' : ''
				}`
			}
		});
	}

	return response;
}

/** @type {import('@sveltejs/kit').HandleServerError} */
export function handleError({ error }) {
	process.emitWarning(error instanceof Error ? error.message : String(error));

	// We can't return a redirect here, but we've handled the redirect in 'handle'
	// by checking the response status.
	return {
		message: 'Internal Server Error'
	};
}
