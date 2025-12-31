
/** @type {import('./$types').Actions} */
export const actions = {
    save: async ({ request, url, fetch }) => {
        // Proxy action to PHP
        const formData = await request.formData();
        const data = Object.fromEntries(formData);

        try {
            const phpActionUrl = `http://localhost:8888?route=${url.pathname}&action=save`;
            const response = await fetch(phpActionUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                return await response.json();
            } else {
                console.error(`PHP Action Failed: ${response.status}`);
                return { success: false, error: 'PHP Action failed' };
            }
        } catch (e) {
            console.error('Failed to connect to PHP Action Server:', e);
            return { success: false, error: 'Connection failed' };
        }
    }
};

/** @type {import('./$types').PageServerLoad} */
export async function load({ fetch, url, request }) {
    // In development, we proxy data loading to our PHP data server
    // This allows us to use PHP logic while running Vite

    try {
        // Fetch from our local PHP data server
        // We pass the entire query string so PHP can access searchParams
        const phpDataUrl = `http://localhost:8888?route=${url.pathname}&${url.searchParams.toString()}`;

        // Forward cookies
        const headers = {};
        const cookie = request.headers.get('cookie');
        if (cookie) {
            headers['Cookie'] = cookie;
        }

        const response = await fetch(phpDataUrl, { headers });

        if (response.ok) {
            const data = await response.json();
            // If PHP returns null (no data loading logic), return empty object
            return data || {};
        } else {
            console.error(`PHP Data Server returned ${response.status}`);
        }
    } catch (e) {
        console.error('Failed to connect to PHP Data Server:', e);
    }

    return {
        _dev_error: 'Could not load data from PHP server'
    };
}
