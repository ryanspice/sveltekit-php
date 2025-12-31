/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
	const response = await resolve(event);

	// Intercept 404 and 500 errors
	if (response.status === 404 || response.status === 500) {
		// Ignore favicon.ico
		if (event.url.pathname === '/favicon.ico') {
			return new Response(null, { status: 404 });
		}

		console.error(`[Error Handled] ${response.status} at ${event.url.pathname} - Redirecting to /`);

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

		console.log(`[Hooks] Redirecting to origin: ${origin}`);

		// Redirect to home page with cookie
		return new Response(null, {
			status: 307,
			headers: {
				'Location': `${origin}/`,
				'Set-Cookie': `redirected_from=${event.url.pathname}; Path=/; Max-Age=10; SameSite=Lax`
			}
		});
	}

	return response;
}

/** @type {import('@sveltejs/kit').HandleError} */
export async function handleError({ error, event }) {
	console.error('[Server Error]', error);

	// We can't return a redirect here, but we've handled the redirect in 'handle'
	// by checking the response status.
	return {
		message: 'Internal Server Error'
	};
}
